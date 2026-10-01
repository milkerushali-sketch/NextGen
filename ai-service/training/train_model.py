from pathlib import Path

import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split

# Kaggle customer-support ticket data trains the supervised machine-learning classifiers.
# The LLM is used for conversational generation and tool orchestration.
# RAG retrieves current internal company-policy documents.
ROOT = Path(__file__).parents[1]
LABELS = ("intent", "priority", "sentiment")


def train(label: str) -> None:
    if label not in LABELS:
        raise ValueError(f"Unsupported classifier label: {label}")
    data_path = ROOT / "dataset" / "cleaned_tickets.csv"
    if not data_path.is_file():
        raise FileNotFoundError(
            f"Run preprocess_dataset.py with the licensed Kaggle dataset first: {data_path}"
        )
    frame = pd.read_csv(data_path).dropna(subset=["text", label])
    if frame.empty or frame[label].nunique() < 2:
        raise ValueError(f"At least two non-empty classes are required to train {label}.")
    vectorizer = TfidfVectorizer(ngram_range=(1, 2), min_df=1, max_features=50000)
    features = vectorizer.fit_transform(frame["text"].astype(str))
    labels = frame[label].astype(str)
    stratify = labels if labels.value_counts().min() >= 2 else None
    train_x, _, train_y, _ = train_test_split(
        features,
        labels,
        test_size=0.2,
        random_state=42,
        stratify=stratify,
    )
    classifier = LogisticRegression(max_iter=1000, class_weight="balanced")
    classifier.fit(train_x, train_y)
    model_dir = ROOT / "models"
    model_dir.mkdir(parents=True, exist_ok=True)
    joblib.dump(vectorizer, model_dir / "tfidf_vectorizer.joblib")
    joblib.dump(classifier, model_dir / f"{label}_classifier.joblib")
    print(f"Saved {label} classifier and shared TF-IDF vectorizer to {model_dir}")
