# Architecture

- Backend: FastAPI + SQLModel, SQLite fallback with PostgreSQL target.
- Frontend: React/TypeScript + Tailwind + Recharts.
- Async/Eventing: Redis queue/Celery-ready; in-process fallback for dev.
- NLP: mock parser + external adapter with PII redaction.
- Scale path: read replicas, Redis cache, vector adapter, worker pool.

## Cost estimates
- Low (15 users): $25-$75/month.
- Medium (500 users): $250-$1,200/month.
- High (10k+ users): $4k-$18k/month.

## Tradeoffs
MVP uses simplified auth and single-db topology for rapid iteration; enterprise SSO/SCIM is scaffolded as stubs.
