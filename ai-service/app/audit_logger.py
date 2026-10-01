import json
import logging
from typing import Any

from psycopg import Error as PsycopgError

from .database import get_connection

logger = logging.getLogger("novacart.ai.audit")


def log_decision(
    event: str,
    payload: dict[str, Any],
    customer_id: int | None = None,
) -> None:
    safe_payload = {
        key: value
        for key, value in payload.items()
        if key not in {"message", "email", "password", "token"}
    }
    serialized = json.dumps(safe_payload, default=str)
    logger.info("%s %s", event, serialized)
    try:
        with get_connection() as connection:
            with connection.transaction():
                connection.execute(
                    """INSERT INTO agent_audit_logs (customer_id, event_type, details)
                       VALUES (%s, %s, %s::jsonb)""",
                    (customer_id, event[:100], serialized),
                )
    except (OSError, PsycopgError) as error:
        logger.warning("Could not persist AI audit event: %s", error)
