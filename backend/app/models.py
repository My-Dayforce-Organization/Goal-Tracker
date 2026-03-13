from __future__ import annotations
from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    email: str
    role: str
    manager_id: Optional[int] = None


class Goal(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int
    title: str
    progress: float = 0
    priority: str = "medium"
    status: str = "active"
    target_date: Optional[str] = None


class Milestone(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    goal_id: int
    title: str
    completed: bool = False


class NLEvent(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int
    client_event_id: str
    idempotency_token: str
    text: str
    text_hash: str
    matched_goal_id: Optional[int] = None
    confidence: float = 0
    preview: str = ""
    confirmed: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Feedback(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    goal_id: int
    manager_id: int
    employee_id: int
    text: str


class Rating(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    goal_id: int
    manager_id: int
    employee_id: int
    score: int


class AuditLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int
    action: str
    entity: str
    entity_id: int
    diff: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Notification(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int
    message: str
    read: bool = False