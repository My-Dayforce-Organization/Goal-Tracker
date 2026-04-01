# Milestone Tracker MVP

Production-quality MVP Milestone Tracker with mock persistence and no external database.

## Stack
- Backend: FastAPI + Python
- Frontend: React + TypeScript + Tailwind
- Charts: Recharts
- Storage: File-backed `MockStorageService`
- Auth: dev-mode bearer token (`dev-token:<user_id>`)

## Seeded Users
- Manager: `manager@example.com` / `password123`
- Employee 1: `employee1@example.com` / `password123`
- Employee 2: `employee2@example.com` / `password123`

## Run
```bash
docker-compose up --build
```

Frontend: http://localhost:5173  
Backend API docs (through frontend proxy): http://localhost:5173/api/docs  
Backend API docs (direct backend port): http://localhost:8000/docs

> The frontend calls `/api/*`, which Vite proxies to the backend service. In Codespaces, prefer `http://localhost:5173/api/docs` from the frontend-forwarded URL context.

## Features
- Employee milestone CRUD and progress tracking
- Manager scope-limited direct report visibility
- Dashboard KPIs and charts (progress %, overdue, completion)
- Natural language ingest (`POST /nl/ingest`) with idempotency by `client_event_id`
- Notifications and audit logs stored in mock storage
- File-backed persistence in `backend/app/data/mock_db.json`

## API Endpoints
- `POST /auth/login`
- `GET /users/{id}`
- `GET /users/{id}/milestones`
- `POST /milestones`
- `PUT /milestones/{id}`
- `DELETE /milestones/{id}`
- `POST /nl/ingest`
- `GET /dashboard`
- `GET /notifications`

## Architecture Notes
- `StorageService` abstraction enables easy swap to PostgreSQL later.
- Services layer encapsulates business logic (`auth`, `milestones`, `dashboard`, `nlp`).
- Seed data loads automatically on backend startup if no users exist.
