from __future__ import annotations

from datetime import datetime, timedelta, timezone

from app.models.entities import Milestone, User
from app.services.storage import MockStorageService


def seed_data(storage: MockStorageService) -> None:
    if storage.list_users():
        return

    manager = User(
        id="u_mgr_1",
        name="Morgan Lee",
        email="manager@example.com",
        role="manager",
        password="password123",
    )
    emp1 = User(
        id="u_emp_1",
        name="Avery Johnson",
        email="employee1@example.com",
        role="employee",
        manager_id=manager.id,
        password="password123",
    )
    emp2 = User(
        id="u_emp_2",
        name="Riley Chen",
        email="employee2@example.com",
        role="employee",
        manager_id=manager.id,
        password="password123",
    )

    for user in [manager, emp1, emp2]:
        storage.save_user(user)

    now = datetime.now(timezone.utc)
    milestones = [
        Milestone(
            id="m_emp1_1",
            user_id=emp1.id,
            title="Launch onboarding revamp",
            description="Finalize docs and run pilot",
            due_date=now + timedelta(days=14),
            progress=40,
            status="in_progress",
            approved=False,
            created_at=now,
            updated_at=now,
        ),
        Milestone(
            id="m_emp1_2",
            user_id=emp1.id,
            title="Complete Q2 certification",
            description="Submit all learning modules",
            due_date=now - timedelta(days=3),
            progress=70,
            status="overdue",
            approved=False,
            created_at=now,
            updated_at=now,
        ),
        Milestone(
            id="m_emp2_1",
            user_id=emp2.id,
            title="Ship analytics dashboard",
            description="Deploy v1 with usage KPIs",
            due_date=now + timedelta(days=21),
            progress=55,
            status="in_progress",
            approved=False,
            created_at=now,
            updated_at=now,
        ),
    ]
    for milestone in milestones:
        storage.save_milestone(milestone)
