import re
from collections.abc import Iterable
from typing import Any

TEAM_BY_INTENT = {
    "payment_issue": "Payments Team",
    "refund_delay": "Payments Team",
    "fraud": "Payments Team",
    "duplicate_payment": "Payments Team",
    "order_tracking": "Delivery Team",
    "delivery_delay": "Delivery Team",
    "shipment_problem": "Delivery Team",
    "return_request": "Returns Team",
    "damaged_product": "Returns Team",
    "replacement": "Returns Team",
    "account_issue": "Technical Team",
    "login_issue": "Technical Team",
    "app_error": "Technical Team",
    "privacy_issue": "Privacy Team",
    "account_deletion": "Privacy Team",
    "human_agent_request": "Customer Support Team",
    "general_complaint": "Customer Support Team",
}

_PATTERNS: tuple[tuple[str, re.Pattern[str]], ...] = (
    ("human requested", re.compile(r"\b(human|real person|live agent|representative|supervisor)\b", re.I)),
    ("fraud reported", re.compile(r"\b(fraud|scam|unauthorized payment|unauthorised payment)\b", re.I)),
    ("duplicate payment reported", re.compile(r"\b(duplicate payment|charged twice|paid twice)\b", re.I)),
    ("chargeback reported", re.compile(r"\b(chargeback|charge back)\b", re.I)),
    ("privacy issue reported", re.compile(r"\b(privacy|data leak|personal data exposed)\b", re.I)),
    ("account deletion requested", re.compile(r"\b(delete my account|erase my account|account deletion)\b", re.I)),
    ("legal threat reported", re.compile(r"\b(lawyer|legal action|sue you|regulator|court)\b", re.I)),
    ("unauthorized payment reported", re.compile(r"\b(not my payment|didn't authorize|did not authorize)\b", re.I)),
    ("repeated unresolved issue reported", re.compile(r"\b(still unresolved|again|third time|no one helped|already contacted)\b", re.I)),
)


def get_escalation_reason(
    message: str,
    intent: str,
    confidence: float,
    *,
    policy_found: bool = True,
    record_conflict: bool = False,
    unresolved_tickets: int = 0,
    refund_amount: float | None = None,
    refund_limit: float = 1000.0,
    negative: bool = False,
    repeatedly_unresolved: bool = False,
) -> str | None:
    for reason, pattern in _PATTERNS:
        if pattern.search(message):
            return reason
    if intent == "human_agent_request":
        return "human requested"
    if confidence < 0.70:
        return "classifier confidence below 0.70"
    if not policy_found:
        return "no relevant approved policy found"
    if record_conflict:
        return "order and payment records conflict"
    if unresolved_tickets >= 2:
        return "customer has multiple unresolved support tickets"
    if refund_amount is not None and refund_amount > refund_limit:
        return "refund exceeds the automated handling limit"
    if negative and repeatedly_unresolved:
        return "negative sentiment on a repeatedly unresolved issue"
    return None


def assigned_team(intent: str, reason: str | None) -> str | None:
    if not reason:
        return None
    if "privacy" in reason or "account deletion" in reason:
        return "Privacy Team"
    if "payment" in reason or "fraud" in reason or "chargeback" in reason:
        return "Payments Team"
    if "legal" in reason:
        return "Customer Support Team"
    return TEAM_BY_INTENT.get(intent, "Customer Support Team")


def get_unresolved_ticket_count(
    customer_id: int, connection: Any | None = None
) -> int:
    if connection is not None:
        row = connection.execute(
            """SELECT COUNT(*) AS count FROM support_tickets
               WHERE customer_id = %s AND status IN ('open', 'in_progress', 'escalated')""",
            (customer_id,),
        ).fetchone()
        return int(row["count"])
    from .database import get_connection

    with get_connection() as owned_connection:
        return get_unresolved_ticket_count(customer_id, owned_connection)


def get_escalation_decision(
    message: str,
    intent: str,
    confidence: float,
    **evidence: Any,
) -> dict[str, Any]:
    reason = get_escalation_reason(message, intent, confidence, **evidence)
    return {
        "shouldEscalate": reason is not None,
        "escalationReason": reason,
        "assignedTeam": assigned_team(intent, reason),
    }

