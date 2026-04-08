from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

Role = Literal["employee", "manager"]
MilestoneStatus = Literal["not_started", "in_progress", "completed", "overdue"]
NotificationType = Literal["info", "approval", "warning"]


class User(BaseModel):
    id: str
    name: str
    email: str
    role: Role
    manager_id: str | None = None
    password: str


class Milestone(BaseModel):
    id: str
    user_id: str
    title: str
    description: str = ""
    due_date: datetime
    progress: int = Field(ge=0, le=100)
    status: MilestoneStatus = "not_started"
    approved: bool = False
    created_at: datetime
    updated_at: datetime


class NLEvent(BaseModel):
    id: str
    user_id: str
    client_event_id: str
    text: str
    parsed_progress_delta: int
    parsed_milestone_id: str | None = None
    created_at: datetime


class Feedback(BaseModel):
    id: str
    milestone_id: str
    manager_id: str
    message: str
    created_at: datetime


class Notification(BaseModel):
    id: str
    user_id: str
    type: NotificationType = "info"
    message: str
    read: bool = False
    created_at: datetime


class AuditLog(BaseModel):
    id: str
    actor_user_id: str
    action: str
    entity_type: str
    entity_id: str
    metadata: dict = Field(default_factory=dict)
    created_at: datetime
