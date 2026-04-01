from __future__ import annotations

import json
from abc import ABC, abstractmethod
from pathlib import Path

from app.models.entities import AuditLog, Feedback, Milestone, NLEvent, Notification, User


class StorageService(ABC):
    @abstractmethod
    def list_users(self) -> list[User]: ...

    @abstractmethod
    def get_user(self, user_id: str) -> User | None: ...

    @abstractmethod
    def get_user_by_email(self, email: str) -> User | None: ...

    @abstractmethod
    def save_user(self, user: User) -> User: ...

    @abstractmethod
    def list_milestones(self) -> list[Milestone]: ...

    @abstractmethod
    def get_milestone(self, milestone_id: str) -> Milestone | None: ...

    @abstractmethod
    def save_milestone(self, milestone: Milestone) -> Milestone: ...

    @abstractmethod
    def delete_milestone(self, milestone_id: str) -> bool: ...

    @abstractmethod
    def list_nl_events(self) -> list[NLEvent]: ...

    @abstractmethod
    def get_nl_event_by_client_id(self, user_id: str, client_event_id: str) -> NLEvent | None: ...

    @abstractmethod
    def save_nl_event(self, event: NLEvent) -> NLEvent: ...

    @abstractmethod
    def save_feedback(self, feedback: Feedback) -> Feedback: ...

    @abstractmethod
    def list_notifications(self, user_id: str) -> list[Notification]: ...

    @abstractmethod
    def save_notification(self, notification: Notification) -> Notification: ...

    @abstractmethod
    def save_audit_log(self, log: AuditLog) -> AuditLog: ...


class MockStorageService(StorageService):
    def __init__(self, file_path: str = "app/data/mock_db.json") -> None:
        self.file_path = Path(file_path)
        self.file_path.parent.mkdir(parents=True, exist_ok=True)
        self._data = self._load()

    def _empty(self) -> dict:
        return {
            "users": [],
            "milestones": [],
            "nl_events": [],
            "feedback": [],
            "notifications": [],
            "audit_logs": [],
        }

    def _load(self) -> dict:
        if not self.file_path.exists():
            data = self._empty()
            self._save(data)
            return data
        with self.file_path.open("r", encoding="utf-8") as f:
            return json.load(f)

    def _save(self, data: dict | None = None) -> None:
        payload = data if data is not None else self._data
        with self.file_path.open("w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2, default=str)

    def _upsert(self, key: str, item_id: str, payload: dict) -> None:
        items = self._data[key]
        for index, item in enumerate(items):
            if item["id"] == item_id:
                items[index] = payload
                self._save()
                return
        items.append(payload)
        self._save()

    def list_users(self) -> list[User]:
        return [User(**u) for u in self._data["users"]]

    def get_user(self, user_id: str) -> User | None:
        for item in self._data["users"]:
            if item["id"] == user_id:
                return User(**item)
        return None

    def get_user_by_email(self, email: str) -> User | None:
        for item in self._data["users"]:
            if item["email"].lower() == email.lower():
                return User(**item)
        return None

    def save_user(self, user: User) -> User:
        self._upsert("users", user.id, user.model_dump(mode="json"))
        return user

    def list_milestones(self) -> list[Milestone]:
        return [Milestone(**m) for m in self._data["milestones"]]

    def get_milestone(self, milestone_id: str) -> Milestone | None:
        for item in self._data["milestones"]:
            if item["id"] == milestone_id:
                return Milestone(**item)
        return None

    def save_milestone(self, milestone: Milestone) -> Milestone:
        self._upsert("milestones", milestone.id, milestone.model_dump(mode="json"))
        return milestone

    def delete_milestone(self, milestone_id: str) -> bool:
        before = len(self._data["milestones"])
        self._data["milestones"] = [m for m in self._data["milestones"] if m["id"] != milestone_id]
        changed = len(self._data["milestones"]) != before
        if changed:
            self._save()
        return changed

    def list_nl_events(self) -> list[NLEvent]:
        return [NLEvent(**e) for e in self._data["nl_events"]]

    def get_nl_event_by_client_id(self, user_id: str, client_event_id: str) -> NLEvent | None:
        for item in self._data["nl_events"]:
            if item["user_id"] == user_id and item["client_event_id"] == client_event_id:
                return NLEvent(**item)
        return None

    def save_nl_event(self, event: NLEvent) -> NLEvent:
        self._upsert("nl_events", event.id, event.model_dump(mode="json"))
        return event

    def save_feedback(self, feedback: Feedback) -> Feedback:
        self._upsert("feedback", feedback.id, feedback.model_dump(mode="json"))
        return feedback

    def list_notifications(self, user_id: str) -> list[Notification]:
        return [Notification(**n) for n in self._data["notifications"] if n["user_id"] == user_id]

    def save_notification(self, notification: Notification) -> Notification:
        self._upsert("notifications", notification.id, notification.model_dump(mode="json"))
        return notification

    def save_audit_log(self, log: AuditLog) -> AuditLog:
        self._upsert("audit_logs", log.id, log.model_dump(mode="json"))
        return log
