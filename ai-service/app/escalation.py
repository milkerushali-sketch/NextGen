import re


ESCALATION_PATTERNS = re.compile(
    r"\b(fraud|scam|lawyer|legal|safety|danger|threat|chargeback|"
    r"human agent|supervisor|still unresolved)\b",
    re.IGNORECASE,
)


def needs_escalation(message: str) -> bool:
    return bool(ESCALATION_PATTERNS.search(message))

