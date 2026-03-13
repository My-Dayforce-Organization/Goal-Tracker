from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.database import init_db
from backend.seed import run


def setup_module():
    init_db()
    run()


def test_employee_cannot_view_peer_goals():
    c = TestClient(app)
    r = c.get('/users/3/goals', params={'requester_id': 2})
    assert r.status_code == 403


def test_manager_can_view_report_goals():
    c = TestClient(app)
    r = c.get('/users/2/goals', params={'requester_id': 1})
    assert r.status_code == 200


def test_manager_can_view_direct_reports():
    c = TestClient(app)
    r = c.get('/users/1/reports', params={'requester_id': 1})
    assert r.status_code == 200
    assert len(r.json()) >= 2