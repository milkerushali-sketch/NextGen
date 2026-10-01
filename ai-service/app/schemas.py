from typing import Any, Literal

from pydantic import BaseModel, Field


Priority = Literal["low", "medium", "high", "critical"]
Sentiment = Literal["positive", "neutral", "negative"]
ActionType = Literal[
    "answer",
    "product_search",
    "cart_update",
    "order_tracking",
    "ticket_create",
    "escalate",
]


class AgentRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    customer_id: int | None = None
    order_id: int | None = None
    confirmed_product_id: int | None = None
    quantity: int = Field(default=1, ge=1, le=20)
    context: dict[str, Any] = Field(default_factory=dict)


class Classification(BaseModel):
    intent: str
    intent_confidence: float = Field(ge=0, le=1, alias="intentConfidence")
    priority: Priority
    sentiment: Sentiment


class ProductResult(BaseModel):
    id: int
    name: str
    category: str
    price: float
    rating: float
    image: str = ""
    description: str = ""
    stock_quantity: int | None = None
    reason: str = ""


class OrderDetails(BaseModel):
    id: int
    status: str
    total: float
    payment_status: str | None = None
    shipment_status: str | None = None
    tracking_id: str | None = None
    expected_delivery: str | None = None


class AgentResponse(BaseModel):
    intent: str
    intent_confidence: float = Field(ge=0, le=1, alias="intentConfidence")
    priority: Priority
    sentiment: Sentiment
    tools_used: list[str] = Field(default_factory=list, alias="toolsUsed")
    policy_reference: str | None = Field(default=None, alias="policyReference")
    root_cause: str | None = Field(default=None, alias="rootCause")
    recommended_action: str = Field(default="", alias="recommendedAction")
    action_type: ActionType = Field(default="answer", alias="actionType")
    products: list[ProductResult] = Field(default_factory=list)
    order_details: OrderDetails | None = Field(default=None, alias="orderDetails")
    should_escalate: bool = Field(default=False, alias="shouldEscalate")
    escalation_reason: str | None = Field(default=None, alias="escalationReason")
    assigned_team: str | None = Field(default=None, alias="assignedTeam")
    ticket_id: int | None = Field(default=None, alias="ticketId")
    message: str

    model_config = {"populate_by_name": True}


class ClassifyRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)


class PolicySearchRequest(BaseModel):
    query: str = Field(min_length=1, max_length=2000)
    limit: int = Field(default=4, ge=1, le=10)


class PolicyIndexRequest(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    policy_text: str = Field(min_length=1, max_length=50000)
