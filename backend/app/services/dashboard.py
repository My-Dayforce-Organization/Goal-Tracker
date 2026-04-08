from __future__ import annotations

from app.models.entities import User
from app.services.storage import StorageService


class DashboardService:
    def __init__(self, storage: StorageService):
        self.storage = storage

    def get_dashboard(self, current_user: User) -> dict:
        milestones = self.storage.list_milestones()
        if current_user.role == "employee":
            milestones = [m for m in milestones if m.user_id == current_user.id]
        else:
            report_ids = {u.id for u in self.storage.list_users() if u.manager_id == current_user.id}
            milestones = [m for m in milestones if m.user_id in report_ids]
        total = len(milestones)
        completed = len([m for m in milestones if m.status == "completed"])
        overdue = len([m for m in milestones if m.status == "overdue"])
        avg = round(sum(m.progress for m in milestones) / total, 2) if total else 0
        by_employee = {}
        for m in milestones:
            by_employee.setdefault(m.user_id, {"count": 0, "avg_progress": 0, "sum": 0})
            by_employee[m.user_id]["count"] += 1
            by_employee[m.user_id]["sum"] += m.progress
        for user_id, data in by_employee.items():
            data["avg_progress"] = round(data["sum"] / data["count"], 2)
            data.pop("sum", None)
        return {
            "total_milestones": total,
            "completed_milestones": completed,
            "overdue_milestones": overdue,
            "average_progress": avg,
            "by_employee": by_employee,
        }
