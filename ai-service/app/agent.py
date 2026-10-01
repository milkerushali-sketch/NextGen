from .audit_logger import log_decision
from .config import get_settings
from .escalation import needs_escalation
from .llm_provider import create_llm, invoke_llm
from .ml_predictor import predict
from .rag import retrieve_policy_context
from .schemas import AgentRequest, AgentResponse


def run_agent(request: AgentRequest) -> AgentResponse:
    predictions = predict(request.message)
    escalated = needs_escalation(request.message)
    llm_answer = invoke_llm(
        create_llm(get_settings()),
        f"Policy context: {retrieve_policy_context(request.message)}\n\n"
        f"Customer message: {request.message}",
    )
    answer = llm_answer or (
        "I can help with that. Please share your order number, but never share "
        "your password, card number, CVV, or OTP."
    )
    if escalated:
        answer = f"{answer}\n\nI’m escalating this to our support team for human review."
    log_decision(
        "agent_decision",
        {"email": request.email, "predictions": predictions, "escalated": escalated},
    )
    return AgentResponse(
        answer=answer,
        **predictions,
        should_escalate=escalated,
    )

