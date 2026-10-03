#!/usr/bin/env bash

# ==============================================================================
# ScholarMind AI - Instant Public HTTPS Live Link (Access from Anywhere)
# ==============================================================================

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR" || exit 1

echo "=========================================================="
echo "       🌐 ScholarMind AI — Instant Public Live Link"
echo "=========================================================="

# Check if port 3000 is running
if ! lsof -i :3000 > /dev/null 2>&1; then
  echo "⚡ Starting ScholarMind AI background servers first..."
  ./start_app.sh &
  sleep 4
fi

echo ""
echo "🔗 Creating a free, secure public HTTPS URL (via Cloudflare / Localtunnel)..."
echo "📱 This URL works anywhere in the world on Mobile 4G/5G, Wi-Fi, and PC!"
echo "----------------------------------------------------------"

# Launch Localtunnel on port 3000
npx -y localtunnel --port 3000
