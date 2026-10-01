from pathlib import Path

import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

ROOT = Path(__file__).parents[1]


def train(label: str) -> None:
    frame = pd.read_csv(ROOT / "dataset" / "cleaned_tickets.csv")
    text_column = next(column for column in frame if column in {"text", "message", "ticket"})
    if label not in frame:
        raise ValueError(f"Dataset is missing required label column: {label}")
    model = Pipeline(
        [("tfidf", TfidfVectorizer()), ("classifier", LogisticRegression(max_iter=1000))]
    )
    model.fit(frame[text_column].astype(str), frame[label].astype(str))
    joblib.dump(model, ROOT / "models" / f"{label}_classifier.joblib")

