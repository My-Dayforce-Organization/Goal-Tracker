from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from fastapi import HTTPException

from app.models.entities import AuditLog, Milestone, Notification, User
from app.schemas.api import MilestoneCreate, MilestoneUpdate
from app.services.storage import StorageService


class MilestoneService:
    def __init__(self, storage: StorageService):
        self.storage = storage

    def list_for_user(self, current_user: User, user_id: str) -> list[Milestone]:
        if current_user.role == "employee" and current_user.id != user_id:
            raise HTTPException(status_code=403, detail="Employees can only view their own milestones")
        if current_user.role == "manager":
            target = self.storage.get_user(user_id)
            if not target or target.manager_id != current_user.id:
                raise HTTPException(status_code=403, detail="Managers can only view direct reports")
        return [m for m in self.storage.list_milestones() if m.user_id == user_id]

    def create(self, current_user: User, payload: MilestoneCreate) -> Milestone:
        if current_user.role == "employee" and payload.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Cannot create milestone for another user")
        now = datetime.now(timezone.utc)
        milestone = Milestone(
            id=f"m_{uuid4().hex[:10]}",
            user_id=payload.user_id,
            title=payload.title,
            description=payload.description,
            due_date=payload.due_date,
            progress=payload.progress,
            status=self._derive_status(payload.progress, payload.due_date),
            created_at=now,
            updated_at=now,
        )
        self.storage.save_milestone(milestone)
        self._audit(current_user.id, "milestone.create", "milestone", milestone.id)
        return milestone

    def update(self, current_user: User, milestone_id: str, payload: MilestoneUpdate) -> Milestone:
        milestone = self.storage.get_milestone(milestone_id)
        if not milestone:
            raise HTTPException(status_code=404, detail="Milestone not found")
        self._enforce_owner_or_manager(current_user, milestone.user_id)
        update_data = payload.model_dump(exclude_none=True)
        for key, value in update_data.items():
            setattr(milestone, key, value)
        if payload.status is not None:
            milestone.status = payload.status
        else:
            milestone.status = self._derive_status(milestone.progress, milestone.due_date)
        milestone.updated_at = datetime.now(timezone.utc)
        self.storage.save_milestone(milestone)
        if payload.approved and current_user.role == "manager":
            notification = Notification(
                id=f"n_{uuid4().hex[:10]}",
                user_id=milestone.user_id,
                type="approval",
                message=f"Milestone '{milestone.title}' approved by {current_user.name}",
                created_at=datetime.now(timezone.utc),
            )
            self.storage.save_notification(notification)
        self._audit(current_user.id, "milestone.update", "milestone", milestone.id)
        return milestone

    def delete(self, current_user: User, milestone_id: str) -> None:
        milestone = self.storage.get_milestone(milestone_id)
        if not milestone:
            raise HTTPException(status_code=404, detail="Milestone not found")
        self._enforce_owner_or_manager(current_user, milestone.user_id)
        if not self.storage.delete_milestone(milestone_id):
            raise HTTPException(status_code=500, detail="Could not delete milestone")
        self._audit(current_user.id, "milestone.delete", "milestone", milestone.id)

    def _enforce_owner_or_manager(self, current_user: User, user_id: str) -> None:
        if current_user.role == "employee" and current_user.id != user_id:
            raise HTTPException(status_code=403, detail="Forbidden")
        if current_user.role == "manager":
            target = self.storage.get_user(user_id)
            if not target or target.manager_id != current_user.id:
                raise HTTPException(status_code=403, detail="Forbidden")

    def _derive_status(self, progress: int, due_date: datetime) -> str:
        now = datetime.now(timezone.utc)
        due = due_date if due_date.tzinfo else due_date.replace(tzinfo=timezone.utc)
        if progress >= 100:
            return "completed"
        if due < now:
            return "overdue"
        if progress > 0:
            return "in_progress"
        return "not_started"

    def _audit(self, actor_user_id: str, action: str, entity_type: str, entity_id: str) -> None:
        self.storage.save_audit_log(
            AuditLog(
                id=f"a_{uuid4().hex[:10]}",
                actor_user_id=actor_user_id,
                action=action,
                entity_type=entity_type,
                entity_id=entity_id,
                created_at=datetime.now(timezone.utc),
            )
        )
