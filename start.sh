#!/usr/bin/env bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "=========================================================="
echo " Starting ScholarMind AI — Research & Authoring Agent"
echo "=========================================================="

# 1. Start FastAPI Backend
echo "Starting Backend on http://127.0.0.1:8000..."
cd "$DIR"
PYTHONPATH=. backend/venv/bin/python3 -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# 2. Start Next.js Frontend
echo "Starting Frontend on http://localhost:3000..."
cd "$DIR/frontend"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "ScholarMind AI is running!"
echo "• Frontend UI: http://localhost:3000"
echo "• Backend API: http://127.0.0.1:8000"
echo "• API Docs:    http://127.0.0.1:8000/docs"
echo ""
echo "Press Ctrl+C to stop both servers."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
wait
