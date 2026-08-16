#!/usr/bin/env bash
set -euo pipefail

# SSH 経由（非対話シェル）でも Docker / Homebrew の PATH を確実に通す
export PATH="/opt/homebrew/bin:/usr/local/bin:$HOME/.docker/bin:$PATH"

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR"

COMPOSE="docker compose --env-file .env -f compose.prod.yaml"

echo "==> [1/4] Pulling latest code..."
git pull --ff-only origin main

echo "==> [2/4] Building images..."
$COMPOSE build

echo "==> [3/4] Starting containers..."
$COMPOSE up -d --remove-orphans

echo "==> [4/4] Checking container status..."
$COMPOSE ps

echo ""
echo "==> Deploy complete."
echo "    Logs: $COMPOSE logs -f --tail=200"
