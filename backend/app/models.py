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