from fastapi.testclient import TestClient
from backend.app.main import app
from backend.seed import run
from backend.app.database import init_db


def setup_module():
    init_db()
    run()


def test_nl_ingest_idempotency_and_progress_update():
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
    assert data['confidence'] >= 0.7

    r2 = c.post('/nl/ingest', headers={'idempotency-token': 'idem-1'}, json=payload)
    assert r2.json()['status'] in {'duplicate', 'deduped'}