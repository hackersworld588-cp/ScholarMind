#!/usr/bin/env bash

# ==============================================================================
# ScholarMind AI - Quick Launcher (Mac & Mobile Hotspot / Local Wi-Fi Ready)
# ==============================================================================

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR" || exit 1

echo "=========================================================="
echo "      🚀 Launching ScholarMind AI with Mobile Access"
echo "=========================================================="

# 1. Kill any existing instances on 8000 and 3000
echo "🧹 Cleaning up existing processes on port 8000 & 3000..."
lsof -ti:8000 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
sleep 1

# 2. Detect local Wi-Fi / Hotspot IPv4
LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | grep -v 169.254 | awk '{print $2}' | head -n 1)
if [ -z "$LOCAL_IP" ]; then
  LOCAL_IP="127.0.0.1"
fi

echo "📱 Detected Local Network IP: $LOCAL_IP"
echo "   💻 Laptop Browser: http://localhost:3000"
echo "   📱 Mobile Phone Browser: http://$LOCAL_IP:3000"
echo "----------------------------------------------------------"

# 3. Start FastAPI Backend
echo "⚡ Starting Backend API on 0.0.0.0:8000..."
PYTHONPATH=. "$PROJECT_DIR/backend/venv/bin/python3" -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# 4. Start Next.js Frontend
echo "🌐 Starting Frontend Web on 0.0.0.0:3000..."
cd "$PROJECT_DIR/frontend" || exit 1
npm run start &
FRONTEND_PID=$!

# Trap signals for clean exit
cleanup() {
  echo ""
  echo "🛑 Stopping ScholarMind AI..."
  kill $BACKEND_PID 2>/dev/null || true
  kill $FRONTEND_PID 2>/dev/null || true
  lsof -ti:8000 | xargs kill -9 2>/dev/null || true
  lsof -ti:3000 | xargs kill -9 2>/dev/null || true
  echo "✅ Stopped successfully."
  exit 0
}

trap cleanup SIGINT SIGTERM EXIT

echo "=========================================================="
echo "✨ ScholarMind AI is LIVE!"
echo "👉 On your phone, connect to same Wi-Fi/Hotspot and open:"
echo "   http://$LOCAL_IP:3000"
echo "=========================================================="
echo "Press Ctrl+C to stop."

# Wait for background processes
wait $FRONTEND_PID
