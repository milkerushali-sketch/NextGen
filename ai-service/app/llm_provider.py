from collections.abc import Sequence

from .config import Settings
from .prompts import SYSTEM_PROMPT


def create_llm(settings: Settings):
    if settings.provider.lower() == "anthropic":
        if not settings.anthropic_api_key:
            return None
        from langchain_anthropic import ChatAnthropic

        return ChatAnthropic(
            model=settings.model,
            api_key=settings.anthropic_api_key,
            temperature=0,
        )
    if not settings.openai_api_key:
        return None
    from langchain_openai import ChatOpenAI

    return ChatOpenAI(
        model=settings.model,
        api_key=settings.openai_api_key,
        temperature=0,
    )


def invoke_llm(llm, message: str, history: Sequence[dict[str, str]] = ()) -> str | None:
    if llm is None:
        return None
    response = llm.invoke(
        [
            ("system", SYSTEM_PROMPT),
            *[(item["role"], item["content"]) for item in history],
            ("user", message),
        ]
    )
    content = response.content
    return content if isinstance(content, str) else str(content)

