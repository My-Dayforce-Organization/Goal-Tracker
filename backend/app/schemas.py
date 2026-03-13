from pydantic import BaseModel


class LoginRequest(BaseModel):
    email: str


class GoalCreate(BaseModel):
    user_id: int
    title: str
    priority: str = "medium"


class MilestoneCreate(BaseModel):
    title: str


class NLIngestRequest(BaseModel):
    user_id: int
    client_event_id: str
    text: str
    source: str


class FeedbackCreate(BaseModel):
    goal_id: int
    manager_id: int
    employee_id: int
    text: str


class NLConfirmRequest(BaseModel):
    confirm: bool = True