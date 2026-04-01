from functools import lru_cache

from fastapi import Depends, Header

from app.models.entities import User
from app.services.auth import AuthService
from app.services.dashboard import DashboardService
from app.services.milestones import MilestoneService
from app.services.nlp import MockNLPService
from app.services.storage import MockStorageService


@lru_cache
def get_storage() -> MockStorageService:
    return MockStorageService()


def get_auth_service() -> AuthService:
    return AuthService(get_storage())


def get_current_user(
    authorization: str | None = Header(default=None),
    auth: AuthService = Depends(get_auth_service),
) -> User:
    return auth.get_current_user_from_header(authorization)


def get_milestone_service() -> MilestoneService:
    return MilestoneService(get_storage())


def get_dashboard_service() -> DashboardService:
    return DashboardService(get_storage())


def get_nlp_service() -> MockNLPService:
    return MockNLPService()
