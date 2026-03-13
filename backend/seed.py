from sqlmodel import Session
from backend.app.database import engine, init_db
from backend.app.models import User, Goal


def run() -> None:
    init_db()
    with Session(engine) as s:
        if s.query(User).count() > 0:
            return
        manager = User(name="Manager Bob", email="manager@example.com", role="manager")
        emp_a = User(name="Employee Alice", email="alice@example.com", role="employee")
        emp_b = User(name="Employee Evan", email="evan@example.com", role="employee")
        admin = User(name="Admin Iris", email="admin@example.com", role="admin")
        s.add(manager)
        s.commit()
        s.refresh(manager)
        emp_a.manager_id = manager.id
        emp_b.manager_id = manager.id
        s.add(emp_a)
        s.add(emp_b)
        s.add(admin)
        s.commit()
        s.refresh(emp_a)
        s.refresh(emp_b)
        goals = [
            Goal(user_id=emp_a.id, title="Read 12 Rules for Life", progress=45, priority="high"),
            Goal(user_id=emp_a.id, title="Python Architecture Certification", progress=30),
            Goal(user_id=emp_a.id, title="Deliver team workshop", progress=80),
            Goal(user_id=emp_b.id, title="Lead sprint planning", progress=60),
            Goal(user_id=emp_b.id, title="Mentor new hire", progress=20),
            Goal(user_id=emp_b.id, title="Improve public speaking", progress=10),
            Goal(user_id=manager.id, title="Complete managerial coaching", progress=50),
            Goal(user_id=manager.id, title="Quarterly performance reviews", progress=40),
        ]
        s.add_all(goals)
        s.commit()


if __name__ == "__main__":
    run()