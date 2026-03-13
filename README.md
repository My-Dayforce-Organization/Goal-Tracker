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

## Demo
- Demo page: `demo/index.html`
- Transcript: `demo/transcript.md`
- Captions: `demo/captions.vtt`
- Video generation fallback: `demo/demo_walkthrough_placeholder.txt`
- Cloud hosting notes: `demo/CLOUD_HOSTING.md`

## App link
After startup, use: **http://localhost:5173**