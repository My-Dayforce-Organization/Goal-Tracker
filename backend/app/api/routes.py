from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException

from app.core.deps import (
    get_auth_service,
    get_current_user,
    get_dashboard_service,
    get_milestone_service,
    get_nlp_service,
    get_storage,
)
from app.models.entities import AuditLog, NLEvent, Notification, User
from app.schemas.api import (
    DashboardResponse,
    LoginRequest,
    LoginResponse,
    MilestoneCreate,
    MilestoneUpdate,
    NLIngestRequest,
)
from app.services.auth import AuthService
from app.services.dashboard import DashboardService
from app.services.milestones import MilestoneService
from app.services.nlp import MockNLPService
from app.services.storage import MockStorageService

router = APIRouter()


@router.post("/auth/login", response_model=LoginResponse)
def login(payload: LoginRequest, auth: AuthService = Depends(get_auth_service)) -> LoginResponse:
    user = auth.login(payload.email, payload.password)
    return LoginResponse(token=f"dev-token:{user.id}", user_id=user.id, role=user.role, name=user.name)


@router.get("/users/{user_id}")
def get_user(
    user_id: str,
    storage: MockStorageService = Depends(get_storage),
    current_user: User = Depends(get_current_user),
):
    user = storage.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if current_user.role == "employee" and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    if current_user.role == "manager" and user.manager_id != current_user.id and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    return user


@router.get("/users/{user_id}/milestones")
def list_user_milestones(
    user_id: str,
    milestone_service: MilestoneService = Depends(get_milestone_service),
    current_user: User = Depends(get_current_user),
):
    return milestone_service.list_for_user(current_user, user_id)


@router.post("/milestones")
def create_milestone(
    payload: MilestoneCreate,
    milestone_service: MilestoneService = Depends(get_milestone_service),
    current_user: User = Depends(get_current_user),
):
    return milestone_service.create(current_user, payload)


@router.put("/milestones/{milestone_id}")
def update_milestone(
    milestone_id: str,
    payload: MilestoneUpdate,
    milestone_service: MilestoneService = Depends(get_milestone_service),
    current_user: User = Depends(get_current_user),
):
    return milestone_service.update(current_user, milestone_id, payload)


@router.delete("/milestones/{milestone_id}")
def delete_milestone(
    milestone_id: str,
    milestone_service: MilestoneService = Depends(get_milestone_service),
    current_user: User = Depends(get_current_user),
):
    milestone_service.delete(current_user, milestone_id)
    return {"deleted": True}


@router.post("/nl/ingest")
def ingest_nl(
    payload: NLIngestRequest,
    storage: MockStorageService = Depends(get_storage),
    milestone_service: MilestoneService = Depends(get_milestone_service),
    nlp_service: MockNLPService = Depends(get_nlp_service),
    current_user: User = Depends(get_current_user),
):
    if current_user.role == "employee" and current_user.id != payload.user_id:
        raise HTTPException(status_code=403, detail="Cannot ingest for another user")
    existing = storage.get_nl_event_by_client_id(payload.user_id, payload.client_event_id)
    if existing:
        return {"status": "duplicate", "event_id": existing.id}

    parsed = nlp_service.parse(payload.text)
    milestones = milestone_service.list_for_user(current_user, payload.user_id)
    if not milestones:
        raise HTTPException(status_code=404, detail="No milestones for user")

    parsed_milestone_id = parsed.get("milestone_id")
    parsed_title = (parsed.get("milestone_title") or "").strip()
    progress_value = parsed.get("progress")
    status_value = parsed.get("status")

    target = next((m for m in milestones if m.id == parsed_milestone_id), None)
    if not target and parsed_title:
        target = next((m for m in milestones if parsed_title.lower() in m.title.lower()), None)
    if not target:
        target = milestones[0]

    next_progress = target.progress
    if isinstance(progress_value, int):
        next_progress = min(max(progress_value, 0), 100)
    elif status_value == "completed":
        next_progress = 100

    update_payload = MilestoneUpdate(progress=next_progress, status=status_value)
    updated = milestone_service.update(current_user, target.id, update_payload)

    event = NLEvent(
        id=f"e_{uuid4().hex[:10]}",
        user_id=payload.user_id,
        client_event_id=payload.client_event_id,
        text=payload.text,
        parsed_progress_delta=progress_value or 0,
        parsed_milestone_id=parsed_milestone_id,
        created_at=datetime.now(timezone.utc),
    )
    storage.save_nl_event(event)
    storage.save_notification(
        Notification(
            id=f"n_{uuid4().hex[:10]}",
            user_id=payload.user_id,
            type="info",
            message=f"NLP update processed for milestone '{updated.title}'",
            created_at=datetime.now(timezone.utc),
        )
    )
    storage.save_audit_log(
        AuditLog(
            id=f"a_{uuid4().hex[:10]}",
            actor_user_id=current_user.id,
            action="nl.ingest",
            entity_type="nl_event",
            entity_id=event.id,
            metadata={"client_event_id": payload.client_event_id},
            created_at=datetime.now(timezone.utc),
        )
    )
    return {"status": "processed", "event_id": event.id, "milestone_id": updated.id, "progress": updated.progress}


@router.get("/dashboard", response_model=DashboardResponse)
def dashboard(
    dashboard_service: DashboardService = Depends(get_dashboard_service),
    current_user: User = Depends(get_current_user),
):
    return dashboard_service.get_dashboard(current_user)


@router.get("/notifications")
def notifications(
    storage: MockStorageService = Depends(get_storage),
    current_user: User = Depends(get_current_user),
):
    return storage.list_notifications(current_user.id)
