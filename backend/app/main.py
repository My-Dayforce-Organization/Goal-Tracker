from fastapi import FastAPI
from .routes import router
from .database import init_db

app = FastAPI(title="Goal Tracker API", version="0.1.0")


@app.on_event("startup")
def startup() -> None:
    init_db()


app.include_router(router)


@app.get("/healthz")
def healthz() -> dict:
    return {"status": "ok"}


@app.get("/")
def root() -> dict:
    return {"name": "Goal Tracker API", "docs": "/docs"}
