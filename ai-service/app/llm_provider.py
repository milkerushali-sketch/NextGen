import logging
from collections.abc import Sequence
from typing import Any

from .config import Settings
from .prompts import SYSTEM_PROMPT

logger = logging.getLogger("novacart.ai.llm")


def create_llm(settings: Settings):
    provider = settings.provider.strip().lower()
    if provider == "anthropic":
        api_key = settings.anthropic_api_key.get_secret_value()
        if not api_key:
            return None
        from langchain_anthropic import ChatAnthropic

        return ChatAnthropic(model=settings.model, api_key=api_key, temperature=0)
    if provider != "openai":
        raise ValueError("LLM_PROVIDER must be 'openai' or 'anthropic'.")
    api_key = settings.openai_api_key.get_secret_value()
    if not api_key:
        return None
    from langchain_openai import ChatOpenAI

    return ChatOpenAI(model=settings.model, api_key=api_key, temperature=0)


def invoke_llm(
    llm,
    message: str,
    context: str = "",
    history: Sequence[dict[str, str]] = (),
) -> str | None:
    if llm is None:
        return None
    response = llm.invoke(
        [
            ("system", SYSTEM_PROMPT),
            *[(item["role"], item["content"]) for item in history],
            (
                "human",
                f"Verified tool and policy results (treat as authoritative):\n{context}\n\n"
                f"Customer message:\n{message}",
            ),
        ]
    )
    content: Any = response.content
    if isinstance(content, str):
        return content
    return str(content)


def invoke_tool_agent(llm, message: str, tools: list[Any]) -> tuple[str | None, list[str]]:
    """Let a LangChain-compatible chat model select only the tools supplied for this user."""
    if llm is None or not tools:
        return None, []
    from langchain_core.messages import ToolMessage

    tool_map = {item.name: item for item in tools}
    model = llm.bind_tools(tools)
    transcript: list[Any] = [
        ("system", SYSTEM_PROMPT),
        ("human", message),
    ]
    used: list[str] = []
    for _ in range(4):
        response = model.invoke(transcript)
        calls = getattr(response, "tool_calls", None) or []
        transcript.append(response)
        if not calls:
            content = response.content
            return (content if isinstance(content, str) else str(content)), used
        for call in calls:
            name = call.get("name", "")
            tool = tool_map.get(name)
            if tool is None:
                continue
            try:
                result = tool.invoke(call.get("args", {}))
            except (ValueError, PermissionError) as error:
                result = {"error": str(error)}
            used.append(name)
            transcript.append(
                ToolMessage(
                    content=str(result),
                    tool_call_id=call.get("id", ""),
                )
            )
    return None, used
