from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    token: str
    user_id: str
    role: str
    name: str


class MilestoneCreate(BaseModel):
    user_id: str
    title: str = Field(min_length=1, max_length=200)
    description: str = ""
    due_date: datetime
    progress: int = Field(default=0, ge=0, le=100)


class MilestoneUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    due_date: datetime | None = None
    progress: int | None = Field(default=None, ge=0, le=100)
    approved: bool | None = None


class NLIngestRequest(BaseModel):
    user_id: str
    client_event_id: str = Field(min_length=1)
    text: str = Field(min_length=1, max_length=1000)


class DashboardResponse(BaseModel):
    total_milestones: int
    completed_milestones: int
    overdue_milestones: int
    average_progress: float
    by_employee: dict
