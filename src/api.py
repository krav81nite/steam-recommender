import json
from contextlib import asynccontextmanager
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from src.recommender import GameRecommender

recommender: GameRecommender | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global recommender
    recommender = GameRecommender()
    print(f"Loaded {len(recommender.games)} games")
    yield


app = FastAPI(
    title="Steam Game Recommender",
    description="Content-based game recommender using SteamSpy tag data.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class RecommendRequest(BaseModel):
    games: list[str]
    n: int = 10


@app.get("/health")
def health():
    return {"status": "ok", "games_loaded": len(recommender.games) if recommender else 0}


@app.get("/search")
def search_games(q: str = Query(..., description="Partial game name"), n: int = Query(10, ge=1, le=50)):
    """Search for game names. Use this to find the exact title before calling /recommend."""
    results = recommender.search(q, n)
    return {"query": q, "results": results}


@app.get("/recommend")
def recommend_get(
    game: str = Query(..., description="Exact or partial game name"),
    n: int = Query(10, ge=1, le=50),
):
    """Recommend games similar to a single game."""
    results, not_found = recommender.recommend([game], n)
    if not results and not_found:
        raise HTTPException(status_code=404, detail=f"Game not found: '{game}'. Try /search?q=... first.")
    return {"query": [game], "not_found": not_found, "recommendations": results}


@app.get("/games/{appid}")
def get_game(appid: int):
    """Get full details for a single game including all tags with vote counts."""
    row = recommender.games[recommender.games["appid"] == appid]
    if row.empty:
        raise HTTPException(status_code=404, detail="Game not found.")
    r = row.iloc[0]
    tags = json.loads(r["tags"]) if isinstance(r.get("tags"), str) else {}
    return {
        "appid": int(r["appid"]),
        "name": r["name"],
        "developer": r.get("developer", ""),
        "publisher": r.get("publisher", ""),
        "owners": int(r.get("owners", 0)),
        "tags": tags,
    }


@app.post("/recommend")
def recommend_post(body: RecommendRequest):
    """Recommend games based on multiple liked games (averages their profiles)."""
    if not body.games:
        raise HTTPException(status_code=400, detail="Provide at least one game.")
    results, not_found = recommender.recommend(body.games, body.n)
    if not results and not_found:
        raise HTTPException(status_code=404, detail=f"None of the games were found: {not_found}")
    return {"query": body.games, "not_found": not_found, "recommendations": results}
