from pathlib import Path

import joblib

MODEL_DIR = Path(__file__).parents[1] / "models"


def predict(message: str) -> dict[str, str]:
    """Use trained classifiers when present; otherwise return safe defaults."""
    result = {"intent": "support", "priority": "normal", "sentiment": "neutral"}
    vectorizer_path = MODEL_DIR / "tfidf_vectorizer.joblib"
    if not vectorizer_path.exists():
        return result
    vectorizer = joblib.load(vectorizer_path)
    features = vectorizer.transform([message])
    for field in ("intent", "priority", "sentiment"):
        classifier = MODEL_DIR / f"{field}_classifier.joblib"
        if classifier.exists():
            result[field] = str(joblib.load(classifier).predict(features)[0])
    return result

