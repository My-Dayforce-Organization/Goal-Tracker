from fastapi.testclient import TestClient
from backend.app.main import app
from backend.seed import run
from backend.app.database import init_db
import os


def setup_module():
    db_path = 'goal_tracker.db'
    if os.path.exists(db_path):
        os.remove(db_path)
    init_db()
    run()


def test_nl_ingest_preview_confirm_and_idempotency():
    c = TestClient(app)
    payload = {
        'user_id': 2,
        'client_event_id': 'evt-1',
        'text': 'I completed reading 12 Rules for Life today',
        'source': 'web'
    }
    r1 = c.post('/nl/ingest', headers={'idempotency-token': 'idem-1'}, json=payload)
    assert r1.status_code == 200
    data = r1.json()
    assert data['status'] == 'pending_confirm'
    assert data['confidence'] >= 0.7

    confirm = c.post(f"/nl/ingest/{data['nl_event_id']}/confirm", params={'requester_id': 2}, json={'confirm': True})
    assert confirm.status_code == 200
    assert confirm.json()['status'] in {'confirmed', 'already_confirmed'}

    r2 = c.post('/nl/ingest', headers={'idempotency-token': 'idem-1'}, json=payload)
    assert r2.json()['status'] in {'duplicate', 'deduped'}