import logging
import re
from functools import lru_cache
from typing import Any

from psycopg import Error as PsycopgError

from .config import get_settings
from .database import get_connection

logger = logging.getLogger("novacart.ai.rag")
CHUNK_SIZE = 900
CHUNK_OVERLAP = 120


@lru_cache(maxsize=1)
def _embedding_model():
    from sentence_transformers import SentenceTransformer

    return SentenceTransformer(get_settings().embedding_model)


def _chunks(text: str) -> list[str]:
    normalized = re.sub(r"\s+", " ", text).strip()
    if not normalized:
        return []
    pieces = []
    start = 0
    while start < len(normalized):
        end = min(start + CHUNK_SIZE, len(normalized))
        if end < len(normalized):
            boundary = normalized.rfind(" ", start, end)
            if boundary > start:
                end = boundary
        pieces.append(normalized[start:end].strip())
        if end == len(normalized):
            break
        start = max(end - CHUNK_OVERLAP, start + 1)
    return pieces


def index_policy(title: str, policy_text: str) -> dict[str, Any]:
    chunks = _chunks(policy_text)
    if not chunks:
        raise ValueError("Policy text cannot be empty.")
    vectors = _embedding_model().encode(chunks, normalize_embeddings=True)
    with get_connection() as connection:
        with connection.transaction():
            policy = connection.execute(
                """INSERT INTO company_policies (title, policy_text, is_active, updated_at)
                   VALUES (%s, %s, TRUE, NOW())
                   ON CONFLICT (title) DO UPDATE
                   SET policy_text = EXCLUDED.policy_text, is_active = TRUE,
                       updated_at = NOW()
                   RETURNING id, title""",
                (title, policy_text),
            ).fetchone()
            connection.execute(
                "DELETE FROM policy_chunks WHERE policy_id = %s", (policy["id"],)
            )
            for text, vector in zip(chunks, vectors, strict=True):
                vector_value = "[" + ",".join(f"{float(value):.8f}" for value in vector) + "]"
                connection.execute(
                    """INSERT INTO policy_chunks (policy_id, chunk_text, embedding)
                       VALUES (%s, %s, %s::vector)""",
                    (policy["id"], text, vector_value),
                )
    return {"policy_id": policy["id"], "title": policy["title"], "chunks_indexed": len(chunks)}


def search_company_policy(query: str, limit: int = 4) -> list[dict[str, Any]]:
    vector = _embedding_model().encode([query], normalize_embeddings=True)[0]
    vector_value = "[" + ",".join(f"{float(value):.8f}" for value in vector) + "]"
    with get_connection() as connection:
        rows = connection.execute(
            """SELECT p.id AS policy_id, p.title, c.chunk_text,
                      1 - (c.embedding <=> %s::vector) AS similarity
               FROM policy_chunks c
               JOIN company_policies p ON p.id = c.policy_id
               WHERE p.is_active = TRUE AND c.embedding IS NOT NULL
               ORDER BY c.embedding <=> %s::vector
               LIMIT %s""",
            (vector_value, vector_value, max(1, min(limit, 10))),
        ).fetchall()
    return [dict(row) for row in rows]


def retrieve_policy_context(message: str, limit: int = 4) -> list[dict[str, Any]]:
    try:
        minimum = get_settings().policy_min_similarity
        results = search_company_policy(message, limit)
        return [
            result
            for result in results
            if float(result["similarity"]) >= minimum
        ]
    except (ImportError, OSError, RuntimeError, ValueError, PsycopgError) as error:
        logger.warning("Policy retrieval unavailable: %s", error)
        return []
