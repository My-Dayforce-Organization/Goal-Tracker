from __future__ import annotations

from fastapi import HTTPException

from app.models.entities import User
from app.services.storage import StorageService


class AuthService:
    def __init__(self, storage: StorageService):
        self.storage = storage

    def login(self, email: str, password: str) -> User:
        user = self.storage.get_user_by_email(email)
        if not user or user.password != password:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        return user

    def get_current_user_from_header(self, authorization: str | None) -> User:
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Missing auth token")
        token = authorization.split(" ", 1)[1]
        if not token.startswith("dev-token:"):
            raise HTTPException(status_code=401, detail="Invalid token")
        user_id = token.split(":", 1)[1]
        user = self.storage.get_user(user_id)
        if not user:
            raise HTTPException(status_code=401, detail="Unknown user")
        return user
