import pickle
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.metrics.pairwise import cosine_similarity


class GameRecommender:
    def __init__(self, features_path: str = "data/features.pkl"):
        path = Path(features_path)
        if not path.exists():
            raise FileNotFoundError(
                f"{features_path} not found. "
                "Run notebooks/01_data_collection.ipynb and 02_feature_engineering.ipynb first."
            )
        with open(path, "rb") as f:
            data = pickle.load(f)

        self.games: pd.DataFrame = data["games"].reset_index(drop=True)
        self.matrix = data["matrix"]
        self.vocab: list[str] = data["vocab"]
        self._name_index: dict[str, int] = {
            name.lower(): i for i, name in enumerate(self.games["name"])
        }

    def search(self, query: str, n: int = 10) -> list[dict]:
        q = query.lower()
        results = []
        for name, idx in self._name_index.items():
            if q in name:
                row = self.games.iloc[idx]
                results.append({
                    "appid": int(row["appid"]),
                    "name": row["name"],
                    "developer": row.get("developer", ""),
                    "top_tags": row.get("top_tags", ""),
                })
        return results[:n]

    def recommend(self, games: list[str], n: int = 10) -> list[dict]:
        indices = []
        not_found = []
        for name in games:
            idx = self._find(name)
            if idx is None:
                not_found.append(name)
            else:
                indices.append(idx)

        if not indices:
            return []

        query_vec = np.asarray(self.matrix[indices].mean(axis=0))
        scores = cosine_similarity(query_vec, self.matrix)[0]
        scores[indices] = -1  # exclude query games

        top_idx = np.argsort(scores)[::-1][:n]

        results = []
        for i in top_idx:
            row = self.games.iloc[i]
            results.append({
                "appid": int(row["appid"]),
                "name": row["name"],
                "developer": row.get("developer", ""),
                "top_tags": row.get("top_tags", ""),
                "similarity": round(float(scores[i]), 4),
            })
        return results, not_found

    def _find(self, name: str) -> int | None:
        q = name.lower().strip()
        if q in self._name_index:
            return self._name_index[q]
        for stored_name, idx in self._name_index.items():
            if q in stored_name:
                return idx
        return None
