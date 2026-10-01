from pathlib import Path

import pandas as pd

SOURCE = Path(__file__).parents[1] / "dataset" / "kaggle_support_tickets.csv"
TARGET = Path(__file__).parents[1] / "dataset" / "cleaned_tickets.csv"


def main() -> None:
    frame = pd.read_csv(SOURCE).dropna(how="all")
    frame.columns = [str(column).strip().lower().replace(" ", "_") for column in frame]
    frame = frame.drop_duplicates()
    frame.to_csv(TARGET, index=False)


if __name__ == "__main__":
    main()
