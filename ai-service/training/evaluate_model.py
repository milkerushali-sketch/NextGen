from pathlib import Path

import joblib
import pandas as pd
from sklearn.metrics import classification_report

ROOT = Path(__file__).parents[1]


def evaluate(label: str) -> str:
    frame = pd.read_csv(ROOT / "dataset" / "cleaned_tickets.csv")
    text_column = next(column for column in frame if column in {"text", "message", "ticket"})
    model = joblib.load(ROOT / "models" / f"{label}_classifier.joblib")
    return classification_report(frame[label], model.predict(frame[text_column].astype(str)))

