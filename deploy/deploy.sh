#!/usr/bin/env sh
# Обновление приложения на виртуальной машине. Вызывается из GitHub Actions по SSH:
#   deploy.sh <branch> <commit-sha>
set -eu
BRANCH="${1:-main}"
RELEASE="${2:-$(git rev-parse HEAD)}"

cd "$(dirname "$0")/.."
git fetch --prune origin
git checkout -q "$BRANCH"
git reset -q --hard "origin/$BRANCH"

cd deploy
APP_RELEASE="$RELEASE" docker compose up -d --build --remove-orphans
docker image prune -f > /dev/null

# Ждём, пока API ответит на /health
for i in $(seq 1 30); do
  if docker compose exec -T api wget -qO- http://127.0.0.1:3000/health > /dev/null 2>&1; then
    echo "Deployed $RELEASE"
    exit 0
  fi
  sleep 2
done
echo "API не прошёл health-check" >&2
docker compose logs --tail=50 api >&2
exit 1
