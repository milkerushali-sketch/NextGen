from typing import Any


def search_web(query: str) -> list[dict[str, Any]]:
    """Optional read-only web lookup; unavailable providers return no results."""
    try:
        from duckduckgo_search import DDGS

        return list(DDGS().text(query, max_results=3))
    except (ImportError, RuntimeError):
        return []

