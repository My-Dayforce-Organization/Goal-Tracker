from fastapi import APIRouter, Depends, Header, HTTPException, Query
from sqlmodel import Session, select
from .database import get_session
from .models import User, Goal, Milestone, NLEvent, AuditLog, Feedback, Notification
from .schemas import LoginRequest, GoalCreate, MilestoneCreate, NLIngestRequest, FeedbackCreate
from backend.services.nlp import MockNLPService, content_hash

router = APIRouter()


def _can_access(requester: User, target_user_id: int, session: Session) -> bool:
    if requester.role in {"admin", "hr_admin", "security_auditor"}:
        return True
    if requester.role == "manager":
        reports = session.exec(select(User).where(User.manager_id == requester.id)).all()
        report_ids = {u.id for u in reports}
        return target_user_id in report_ids or target_user_id == requester.id
    return requester.id == target_user_id


def _get_requester(user_id: int, session: Session) -> User:
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(404, "requester not found")
    return user


@router.post('/auth/login')
def login(payload: LoginRequest, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.email == payload.email)).first()
    if not user:
        raise HTTPException(401, "invalid email")
    return {"token": f"dev-token-{user.id}", "user_id": user.id, "role": user.role}


@router.get('/users/{id}')
def get_user(id: int, requester_id: int = Query(...), session: Session = Depends(get_session)):
    requester = _get_requester(requester_id, session)
    if not _can_access(requester, id, session):
        raise HTTPException(403, "forbidden")
    user = session.get(User, id)
    if not user:
        raise HTTPException(404, "not found")
    return user


@router.get('/users/{id}/goals')
def user_goals(id: int, requester_id: int = Query(...), session: Session = Depends(get_session)):
    requester = _get_requester(requester_id, session)
    if not _can_access(requester, id, session):
        raise HTTPException(403, "forbidden")
    return session.exec(select(Goal).where(Goal.user_id == id)).all()


@router.post('/goals')
def create_goal(payload: GoalCreate, requester_id: int = Query(...), session: Session = Depends(get_session)):
    requester = _get_requester(requester_id, session)
    if not _can_access(requester, payload.user_id, session):
        raise HTTPException(403, "forbidden")
    goal = Goal(user_id=payload.user_id, title=payload.title, priority=payload.priority)
    session.add(goal)
    session.commit()
    session.refresh(goal)
    session.add(AuditLog(user_id=requester.id, action="create", entity="goal", entity_id=goal.id, diff=payload.model_dump_json()))
    session.commit()
    return goal


@router.put('/goals/{id}')
def update_goal(id: int, payload: GoalCreate, requester_id: int = Query(...), session: Session = Depends(get_session)):
    requester = _get_requester(requester_id, session)
    goal = session.get(Goal, id)
    if not goal:
        raise HTTPException(404, "not found")
    if not _can_access(requester, goal.user_id, session):
        raise HTTPException(403, "forbidden")
    goal.title = payload.title
    goal.priority = payload.priority
    session.add(goal)
    session.add(AuditLog(user_id=requester.id, action="edit", entity="goal", entity_id=goal.id, diff=payload.model_dump_json()))
    session.commit()
    return goal


@router.delete('/goals/{id}')
def delete_goal(id: int, requester_id: int = Query(...), session: Session = Depends(get_session)):
    requester = _get_requester(requester_id, session)
    goal = session.get(Goal, id)
    if not goal:
        raise HTTPException(404, "not found")
    if not _can_access(requester, goal.user_id, session):
        raise HTTPException(403, "forbidden")
    session.delete(goal)
    session.add(AuditLog(user_id=requester.id, action="delete", entity="goal", entity_id=id, diff="{}"))
    session.commit()
    return {"deleted": True}


@router.get('/goals/{id}/milestones')
def goal_milestones(id: int, requester_id: int = Query(...), session: Session = Depends(get_session)):
    goal = session.get(Goal, id)
    requester = _get_requester(requester_id, session)
    if not goal or not _can_access(requester, goal.user_id, session):
        raise HTTPException(403, "forbidden")
    return session.exec(select(Milestone).where(Milestone.goal_id == id)).all()


@router.post('/goals/{id}/milestones')
def add_milestone(id: int, payload: MilestoneCreate, requester_id: int = Query(...), session: Session = Depends(get_session)):
    goal = session.get(Goal, id)
    requester = _get_requester(requester_id, session)
    if not goal or not _can_access(requester, goal.user_id, session):
        raise HTTPException(403, "forbidden")
    m = Milestone(goal_id=id, title=payload.title)
    session.add(m)
    session.commit()
    session.refresh(m)
    return m


@router.post('/nl/ingest')
def ingest_nl(payload: NLIngestRequest, idempotency_token: str = Header(...), session: Session = Depends(get_session)):
    existing = session.exec(select(NLEvent).where(NLEvent.client_event_id == payload.client_event_id)).first()
    if existing:
        return {"status": "duplicate", "nl_event_id": existing.id}
    digest = content_hash(payload.user_id, payload.text)
    by_hash = session.exec(select(NLEvent).where(NLEvent.text_hash == digest)).first()
    if by_hash:
        return {"status": "deduped", "nl_event_id": by_hash.id}
    goals = session.exec(select(Goal).where(Goal.user_id == payload.user_id)).all()
    candidate = goals[0] if goals else None
    parsed = MockNLPService().parse(payload.text)
    event = NLEvent(user_id=payload.user_id, client_event_id=payload.client_event_id, idempotency_token=idempotency_token, text=payload.text, text_hash=digest, matched_goal_id=candidate.id if candidate else None, confidence=parsed.confidence)
    session.add(event)
    if candidate:
        candidate.progress = max(candidate.progress, 52)
        session.add(candidate)
    session.commit()
    session.refresh(event)
    session.add(AuditLog(user_id=payload.user_id, action="nl_ingest", entity="nl_event", entity_id=event.id, diff=payload.model_dump_json()))
    session.commit()
    return {"status": "ok", "preview": parsed.summary, "confidence": parsed.confidence, "suggested_goal_id": event.matched_goal_id, "nl_event_id": event.id}


@router.post('/goals/{id}/approve')
def approve_goal(id: int, requester_id: int = Query(...), session: Session = Depends(get_session)):
    requester = _get_requester(requester_id, session)
    goal = session.get(Goal, id)
    if requester.role != "manager" or not goal:
        raise HTTPException(403, "forbidden")
    session.add(AuditLog(user_id=requester.id, action="approval", entity="goal", entity_id=id, diff='{"approved":true}'))
    session.commit()
    return {"approved": True}


@router.post('/feedback')
def feedback(payload: FeedbackCreate, requester_id: int = Query(...), session: Session = Depends(get_session)):
    requester = _get_requester(requester_id, session)
    if requester.role != "manager":
        raise HTTPException(403, "forbidden")
    fb = Feedback(**payload.model_dump())
    session.add(fb)
    session.commit()
    return fb


@router.get('/dashboard')
def dashboard(range: str = Query("monthly"), requester_id: int = Query(...), session: Session = Depends(get_session)):
    requester = _get_requester(requester_id, session)
    goals = session.exec(select(Goal).where(Goal.user_id == requester.id)).all()
    return {
        "range": range,
        "kpis": {
            "goal_count": len(goals),
            "completion_rate": (sum(g.progress for g in goals) / len(goals)) if goals else 0,
            "overdue_goals": len([g for g in goals if g.status == "overdue"]),
        }
    }


@router.get('/reports/export')
def export_report(redact_pii: bool = True, justification: str | None = None, requester_id: int = Query(...), session: Session = Depends(get_session)):
    requester = _get_requester(requester_id, session)
    if not redact_pii and requester.role != "admin":
        raise HTTPException(403, "full export requires admin")
    if not redact_pii and not justification:
        raise HTTPException(400, "justification required")
    session.add(AuditLog(user_id=requester.id, action="export", entity="report", entity_id=0, diff=f'{{"redact":{str(redact_pii).lower()}}}'))
    session.commit()
    return {"csv": "id,title,progress"}


@router.get('/notifications')
def get_notifications(requester_id: int = Query(...), session: Session = Depends(get_session)):
    _ = _get_requester(requester_id, session)
    return session.exec(select(Notification).where(Notification.user_id == requester_id)).all()


@router.post('/notifications/mark-read')
def mark_read(requester_id: int = Query(...), session: Session = Depends(get_session)):
    items = session.exec(select(Notification).where(Notification.user_id == requester_id)).all()
    for item in items:
        item.read = True
        session.add(item)
    session.commit()
    return {"updated": len(items)}