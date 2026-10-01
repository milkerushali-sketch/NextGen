import logging
import re
from typing import Any

from .prompts import PUBLIC_SEARCH_RULES

logger = logging.getLogger("novacart.ai.web")
_FORBIDDEN = re.compile(
    r"\b(novacart|order|tracking|refund|payment|customer|account|"
    r"return policy|cancellation policy|company policy|stock|inventory)\b",
    re.IGNORECASE,
)


def is_safe_public_query(query: str) -> bool:
    return bool(query.strip()) and not _FORBIDDEN.search(query)


def search_web(query: str) -> list[dict[str, Any]]:
    if not is_safe_public_query(query):
        raise ValueError("Public web search is only for generic public questions.")
    try:
        from duckduckgo_search import DDGS

        with DDGS() as search:
            return list(search.text(query, max_results=3))
    except ImportError as error:
        logger.error("duckduckgo-search dependency is unavailable: %s", error)
        raise RuntimeError("Public search is not configured.") from error
    except Exception as error:
        logger.warning("DuckDuckGo public search failed: %s", error)
        return []


def search_wikipedia(query: str) -> list[dict[str, str]]:
    if not is_safe_public_query(query):
        raise ValueError("Wikipedia is only for generic public questions.")
    try:
        import wikipedia

        return [
            {"title": title, "summary": wikipedia.summary(title, sentences=2, auto_suggest=False)}
            for title in wikipedia.search(query, results=3)
        ]
    except ImportError as error:
        logger.error("wikipedia dependency is unavailable: %s", error)
        raise RuntimeError("Wikipedia search is not configured.") from error
    except Exception as error:
        logger.warning("Wikipedia lookup failed: %s", error)
        return []


__all__ = ["PUBLIC_SEARCH_RULES", "is_safe_public_query", "search_web", "search_wikipedia"]

