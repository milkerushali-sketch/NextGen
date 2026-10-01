import argparse
from pathlib import Path

import joblib
import pandas as pd
from sklearn.metrics import classification_report
from sklearn.model_selection import train_test_split

ROOT = Path(__file__).parents[1]
LABELS = ("intent", "priority", "sentiment")


def evaluate(label: str) -> str:
    if label not in LABELS:
        raise ValueError(f"Unsupported classifier label: {label}")
    data_path = ROOT / "dataset" / "cleaned_tickets.csv"
    model_path = ROOT / "models" / f"{label}_classifier.joblib"
    vectorizer_path = ROOT / "models" / "tfidf_vectorizer.joblib"
    for path in (data_path, model_path, vectorizer_path):
        if not path.is_file():
            raise FileNotFoundError(f"Required evaluation file was not found: {path}")
    frame = pd.read_csv(data_path).dropna(subset=["text", label])
    labels = frame[label].astype(str)
    stratify = labels if labels.value_counts().min() >= 2 else None
    _, test_indices = train_test_split(
        range(len(frame)), test_size=0.2, random_state=42, stratify=stratify
    )
    vectorizer = joblib.load(vectorizer_path)
    classifier = joblib.load(model_path)
    predicted = classifier.predict(vectorizer.transform(frame.iloc[list(test_indices)]["text"].astype(str)))
    return classification_report(
        labels.iloc[list(test_indices)],
        predicted,
        zero_division=0,
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("label", choices=LABELS)
    arguments = parser.parse_args()
    print(evaluate(arguments.label))

