#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if command -v docker >/dev/null 2>&1; then
  echo "[dev_up] Docker detected. Starting via docker compose..."
  docker compose up --build
  exit 0
fi

echo "[dev_up] Docker not found. Starting local fallback mode."

echo "[dev_up] Starting backend on :8000"
python -m venv .venv >/dev/null 2>&1 || true
source .venv/bin/activate
pip install -r backend/requirements.txt >/dev/null 2>&1 || echo "[dev_up] Backend deps install skipped/failed; ensure dependencies are available."
PYTHONPATH=. uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 >/tmp/goaltracker_backend.log 2>&1 &
BACKEND_PID=$!

echo "[dev_up] Backend PID: $BACKEND_PID"

if command -v npm >/dev/null 2>&1; then
  echo "[dev_up] Starting frontend on :5173"
  (
    cd frontend
    npm install >/tmp/goaltracker_frontend_install.log 2>&1 || true
    npm run dev -- --host 0.0.0.0 --port 5173 --strictPort >/tmp/goaltracker_frontend.log 2>&1
  ) &
  FRONTEND_PID=$!
  echo "[dev_up] Frontend PID: $FRONTEND_PID"
else
  echo "[dev_up] npm not found. Serving static fallback preview at :5173"
  python -m http.server 5173 --directory demo >/tmp/goaltracker_frontend.log 2>&1 &
  FRONTEND_PID=$!
fi

cleanup() {
  echo "[dev_up] Stopping services..."
  kill "$BACKEND_PID" >/dev/null 2>&1 || true
  kill "$FRONTEND_PID" >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

echo "[dev_up] App URLs:"
echo "  Frontend: http://localhost:5173"
echo "  Backend docs: http://localhost:8000/docs"

echo "[dev_up] Press Ctrl+C to stop."
wait
