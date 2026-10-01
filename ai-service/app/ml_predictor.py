import logging
import re
from functools import lru_cache
from pathlib import Path
from typing import Any

import joblib

logger = logging.getLogger("novacart.ai.ml")
MODEL_DIR = Path(__file__).parents[1] / "models"

INTENT_LABELS = (
    "product_query",
    "price_filter",
    "style_recommendation",
    "product_availability",
    "place_order_help",
    "cart_assistance",
    "order_tracking",
    "delivery_delay",
    "cancel_order",
    "return_request",
    "refund_delay",
    "payment_issue",
    "damaged_product",
    "account_issue",
    "human_agent_request",
    "general_complaint",
)


def normalize_intent(label: str, message: str = "") -> str:
    value = f"{label} {message}".lower()
    rules = (
        (r"\b(human|person|representative|live agent|supervisor)\b", "human_agent_request"),
        (r"\b(fraud|duplicate payment|unauthori[sz]ed payment|chargeback|payment|charged)\b", "payment_issue"),
        (r"\b(damaged|broken|defective)\b", "damaged_product"),
        (r"\b(refund|money back)\b", "refund_delay"),
        (r"\b(return|exchange|replacement)\b", "return_request"),
        (r"\b(cancel|cancellation)\b", "cancel_order"),
        (r"\b(delayed|late|shipment|delivery)\b", "delivery_delay"),
        (r"\b(track|tracking|where is my order|order status)\b", "order_tracking"),
        (r"\b(cart|add to cart|basket)\b", "cart_assistance"),
        (r"\b(stock|available|availability|in stock)\b", "product_availability"),
        (r"\b(under|below|budget|price|cost|₹|\$)\b", "price_filter"),
        (r"\b(cozy|style|minimal|work|office|home|look)\b", "style_recommendation"),
        (r"\b(login|password|account|profile)\b", "account_issue"),
        (r"\b(order|buy|checkout|purchase)\b", "place_order_help"),
        (r"\b(complaint|angry|terrible|unacceptable)\b", "general_complaint"),
        (r"\b(product|recommend|show|find|looking for)\b", "product_query"),
        (r"\b(what is|what does|difference between)\b", "product_query"),
    )
    for pattern, intent in rules:
        if re.search(pattern, value):
            return intent
    if label in INTENT_LABELS:
        return label
    return "general_complaint"


def _normalize_priority(label: str) -> str:
    value = label.lower()
    if value in {"critical", "urgent", "emergency"}:
        return "critical"
    if value in {"high", "h", "3"}:
        return "high"
    if value in {"low", "l", "1"}:
        return "low"
    return "medium"


def _normalize_sentiment(label: str) -> str:
    value = label.lower()
    if "negative" in value or "angry" in value or "frustrat" in value:
        return "negative"
    if "positive" in value or "satisfied" in value or "happy" in value:
        return "positive"
    return "neutral"


@lru_cache(maxsize=1)
def _load_models() -> tuple[Any, dict[str, Any]]:
    vectorizer_path = MODEL_DIR / "tfidf_vectorizer.joblib"
    if not vectorizer_path.is_file():
        return None, {}
    vectorizer = joblib.load(vectorizer_path)
    classifiers = {}
    for task in ("intent", "priority", "sentiment"):
        path = MODEL_DIR / f"{task}_classifier.joblib"
        if path.is_file():
            classifiers[task] = joblib.load(path)
    return vectorizer, classifiers


def predict(message: str) -> dict[str, Any]:
    """Classify with Kaggle-trained sklearn artifacts; never treat the LLM as trained."""
    fallback_intent = normalize_intent("", message)
    # The workspace may run before the Kaggle dataset has been provided and trained.
    # This transparent rule fallback is not represented as a supervised model result.
    fallback_confidence = 0.45 if fallback_intent == "general_complaint" else 0.76
    lower_message = message.lower()
    result: dict[str, Any] = {
        "intent": fallback_intent,
        "intentConfidence": fallback_confidence,
        "priority": "critical" if re.search(r"\b(fraud|chargeback|unauthori[sz]ed)\b", lower_message) else "high" if re.search(r"\b(urgent|immediately|asap)\b", lower_message) else "medium",
        "sentiment": "negative" if re.search(r"\b(angry|frustrat|terrible|unacceptable|awful|hate)\w*\b", lower_message) else "positive" if re.search(r"\b(thank|great|love|excellent|happy)\w*\b", lower_message) else "neutral",
        "modelAvailable": False,
        "confidenceSource": "heuristic_fallback",
    }
    try:
        vectorizer, classifiers = _load_models()
    except (OSError, ValueError, EOFError, ImportError) as error:
        logger.warning("Could not load support classifier artifacts: %s", error)
        return result
    if vectorizer is None or not classifiers:
        return result

    features = vectorizer.transform([message])
    result["modelAvailable"] = "intent" in classifiers
    if result["modelAvailable"]:
        result["confidenceSource"] = "sklearn_model"
    for task, classifier in classifiers.items():
        probabilities = classifier.predict_proba(features)[0]
        index = int(probabilities.argmax())
        label = str(classifier.classes_[index])
        if task == "intent":
            result["intent"] = normalize_intent(label, message)
            result["intentConfidence"] = float(probabilities[index])
        elif task == "priority":
            result["priority"] = _normalize_priority(label)
        elif task == "sentiment":
            result["sentiment"] = _normalize_sentiment(label)
    return result
