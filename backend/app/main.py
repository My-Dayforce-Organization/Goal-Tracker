from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.core.deps import get_storage
from app.data.seed import seed_data

app = FastAPI(title="Milestone Tracker API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup() -> None:
    seed_data(get_storage())


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


app.include_router(router)
