from typing import Any

from pydantic import BaseModel, Field


class AgentRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    user_id: str | None = None
    email: str = "guest"
    context: dict[str, Any] = Field(default_factory=dict)


class Recommendation(BaseModel):
    id: str
    name: str
    category: str = ""
    price: float = 0
    reason: str = ""


class AgentResponse(BaseModel):
    answer: str
    intent: str = "support"
    priority: str = "normal"
    sentiment: str = "neutral"
    should_escalate: bool = False
    recommendations: list[Recommendation] = Field(default_factory=list)
    actions: list[str] = Field(default_factory=list)

