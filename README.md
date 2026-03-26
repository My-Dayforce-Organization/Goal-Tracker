# Goal Tracker

Goal Tracker MVP for employees and managers with FastAPI backend and React frontend.

## Quickstart (Docker)
```bash
cp .env.example .env
docker compose up --build
```

App URLs after containers are healthy:
- Backend API docs: http://localhost:8000/docs
- Backend health: http://localhost:8000/healthz
- Frontend: http://localhost:5173

## If `localhost refused to connect`
1. Confirm Docker is installed and running:
   ```bash
   docker --version
   docker compose version
   ```
2. Check whether containers are up:
   ```bash
   docker compose ps
   ```
3. If any service is `Exited`, inspect logs:
   ```bash
   docker compose logs backend frontend --tail=200
   ```
4. Rebuild from scratch:
   ```bash
   docker compose down -v
   docker compose up --build
   ```

5. Confirm health status (should become `healthy`):
   ```bash
   docker compose ps
   ```
6. If ports still appear down, verify listeners and port collisions:
   ```bash
   docker compose logs -f backend frontend
   ss -ltnp | grep -E ':(5173|8000|5432|6379)'
   ```


### One-command fallback (if localhost still refuses connection)
```bash
./scripts/dev_up.sh
```
This script first tries Docker Compose; if Docker is unavailable, it falls back to local backend/frontend startup and keeps both services running with logs in `/tmp/goaltracker_*.log`.

## Local run without Docker
Backend:
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
```

Frontend (new terminal):
```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```


## Implemented functional scope (current)
- Role switcher demo for employee/manager personas (seeded users).
- Dashboard KPIs with monthly/quarterly/yearly selector.
- Goal CRUD (create + list in UI; backend supports update/delete soft-delete).
- NL ingestion preview flow with confirm/discard and 10-second undo buffer in UI.
- Manager direct-reports panel.
- Backend endpoints for `/nl/ingest`, `/nl/ingest/{id}/confirm`, `/users/{id}/reports`, export audit logging, and notifications.


## Desired end-to-end page mocks
- `demo/desired-pages/login.html`
- `demo/desired-pages/employee-dashboard.html`
- `demo/desired-pages/nl-preview.html`
- `demo/desired-pages/manager-dashboard.html`
- `demo/desired-pages/reports-export.html`
- `demo/desired-pages/notifications.html`

## Demo
- UI visual reference preview: `demo/ui-preview.html`
- Demo page: `demo/index.html`
- Transcript: `demo/transcript.md`
- Captions: `demo/captions.vtt`
- Video generation fallback: `demo/demo_walkthrough_placeholder.txt`
- Cloud hosting notes: `demo/CLOUD_HOSTING.md`

## App link
After startup, use: **http://localhost:5173**
