#!/usr/bin/env bash
#
# Production deploy: install → clean build → PM2 on port 3001.
# Uses `set -e`: build failure leaves the previous PM2 process running.
#
# Usage (from repo root on the VPS):
#   bash scripts/deploy-production.sh
#
# Optional:
#   SKIP_GIT_PULL=1
#   PM2_NAME=noosphere-realestate
#   PORT=3001
#
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PM2_NAME="${PM2_NAME:-noosphere-realestate}"
PORT="${PORT:-3001}"

if [[ "${SKIP_GIT_PULL:-0}" != "1" ]]; then
  echo "==> git pull"
  git pull
fi

echo "==> npm install"
npm install

echo "==> npm run db:migrate"
npm run db:migrate

echo "==> rm -rf .next"
rm -rf .next

echo "==> npm run build"
npm run build

echo "==> pm2 delete ${PM2_NAME} || true"
pm2 delete "${PM2_NAME}" 2>/dev/null || true

echo "==> pm2 start npm --name ${PM2_NAME} --cwd ${ROOT} -- start (PORT=${PORT})"
PORT="${PORT}" pm2 start npm --name "${PM2_NAME}" --cwd "${ROOT}" -- start

echo "==> pm2 save"
pm2 save

echo ""
echo "✅ Noosphere Real Estate deploy finished (port ${PORT})."
