import re
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).parents[1]
SOURCE = ROOT / "dataset" / "kaggle_support_tickets.csv"
TARGET = ROOT / "dataset" / "cleaned_tickets.csv"

TEXT_COLUMNS = (
    "ticket_description",
    "description",
    "message",
    "ticket_subject",
    "subject",
    "text",
    "ticket",
)
INTENT_COLUMNS = ("intent", "ticket_type", "issue_type", "category")
PRIORITY_COLUMNS = ("ticket_priority", "priority")
SENTIMENT_COLUMNS = ("customer_sentiment", "sentiment")


def _find_column(frame: pd.DataFrame, names: tuple[str, ...]) -> str | None:
    return next((name for name in names if name in frame.columns), None)


def _intent_from_text(value: str) -> str:
    text = value.lower()
    mapping = (
        (r"\b(human|agent|representative|supervisor)\b", "human_agent_request"),
        (r"\b(fraud|payment|chargeback|charged twice)\b", "payment_issue"),
        (r"\b(damaged|broken|defective)\b", "damaged_product"),
        (r"\b(refund|money back)\b", "refund_delay"),
        (r"\b(return|exchange|replacement)\b", "return_request"),
        (r"\b(cancel|cancellation)\b", "cancel_order"),
        (r"\b(delayed|late|delivery|shipment)\b", "delivery_delay"),
        (r"\b(track|tracking|order status)\b", "order_tracking"),
        (r"\b(cart|basket)\b", "cart_assistance"),
        (r"\b(stock|available|availability)\b", "product_availability"),
        (r"\b(price|cost|budget)\b", "price_filter"),
        (r"\b(account|login|password)\b", "account_issue"),
        (r"\b(product|recommend|purchase)\b", "product_query"),
        (r"\b(home|cozy|style|office)\b", "style_recommendation"),
    )
    return next(
        (intent for pattern, intent in mapping if re.search(pattern, text)),
        "general_complaint",
    )


def _normalize_priority(value: str) -> str:
    label = value.lower()
    if label in {"critical", "urgent", "emergency"}:
        return "critical"
    if label in {"high", "3"}:
        return "high"
    if label in {"low", "1"}:
        return "low"
    return "medium"


def _normalize_sentiment(value: str) -> str:
    label = value.lower()
    if any(word in label for word in ("negative", "angry", "frustrat", "dissatisfied")):
        return "negative"
    if any(word in label for word in ("positive", "happy", "satisfied")):
        return "positive"
    return "neutral"


def main() -> None:
    if not SOURCE.is_file():
        raise FileNotFoundError(
            f"Place the licensed Kaggle dataset at {SOURCE}; no dataset was found."
        )
    frame = pd.read_csv(SOURCE).dropna(how="all")
    frame.columns = [str(column).strip().lower().replace(" ", "_") for column in frame]
    frame = frame.drop_duplicates()

    text_columns = [name for name in TEXT_COLUMNS if name in frame.columns]
    if not text_columns:
        raise ValueError(
            "Dataset must contain a ticket text field such as ticket_description, "
            "description, message, subject, or text."
        )
    frame["text"] = (
        frame[text_columns].fillna("").astype(str).agg(" ".join, axis=1).str.strip()
    )
    intent_col = _find_column(frame, INTENT_COLUMNS)
    priority_col = _find_column(frame, PRIORITY_COLUMNS)
    sentiment_col = _find_column(frame, SENTIMENT_COLUMNS)
    frame["intent"] = (
        frame[intent_col].fillna("").astype(str).map(_intent_from_text)
        if intent_col
        else frame["text"].map(_intent_from_text)
    )
    frame["priority"] = (
        frame[priority_col].fillna("").astype(str).map(_normalize_priority)
        if priority_col
        else "medium"
    )
    frame["sentiment"] = (
        frame[sentiment_col].fillna("").astype(str).map(_normalize_sentiment)
        if sentiment_col
        else "neutral"
    )
    TARGET.parent.mkdir(parents=True, exist_ok=True)
    frame[["text", "intent", "priority", "sentiment"]].to_csv(TARGET, index=False)
    print(f"Prepared {len(frame)} real support-ticket rows at {TARGET}")


if __name__ == "__main__":
    main()

