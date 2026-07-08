#!/usr/bin/env bash

set -Eeuo pipefail

HOST="51.195.253.121"
USER="deploy"
APP_NAME="gliderlogbook.co.uk"
BRANCH_NAME="${BRANCH_NAME:-main}"
REMOTE_DIR="${REMOTE_DIR:-/home/$USER/$APP_NAME}"
ARCHIVE="/tmp/$APP_NAME.tar.gz"
COMPOSE_BASE="$REMOTE_DIR/docker-compose.yml"
COMPOSE_PROD="$REMOTE_DIR/docker-compose.prod.yml"
ENV_FILE="$REMOTE_DIR/.env"
SSH_OPTS=(
  -o BatchMode=yes
  -o ConnectTimeout=20
  -o ServerAliveInterval=10
  -o ServerAliveCountMax=3
)

log() {
  printf '[deploy] %s\n' "$*"
}

trap 'log "failed at line $LINENO"' ERR

log "Fetching origin/$BRANCH_NAME"
git fetch origin "$BRANCH_NAME"

log "Creating archive $ARCHIVE"
git archive --format=tar.gz "origin/$BRANCH_NAME" -o "$ARCHIVE"

log "Ensuring remote directory $USER@$HOST:$REMOTE_DIR"
ssh "${SSH_OPTS[@]}" "$USER@$HOST" "mkdir -p '$REMOTE_DIR'"

log "Uploading archive"
scp "${SSH_OPTS[@]}" "$ARCHIVE" "$USER@$HOST:$ARCHIVE"
rm -f "$ARCHIVE"

log "Deploying on remote host"
ssh "${SSH_OPTS[@]}" "$USER@$HOST" bash -s <<EOF
set -e
cd '$REMOTE_DIR'
test -f '$ENV_FILE'
find . -mindepth 1 -maxdepth 1 ! -name '.env' -exec rm -rf {} +
tar -xzf '$ARCHIVE' --directory '$REMOTE_DIR'
rm -f '$ARCHIVE'
docker compose --env-file '$ENV_FILE' -f '$COMPOSE_BASE' -f '$COMPOSE_PROD' up -d --build --remove-orphans
sleep 5
if [ -z "\$(docker compose --env-file '$ENV_FILE' -f '$COMPOSE_BASE' -f '$COMPOSE_PROD' ps -q app --status running)" ]; then
  echo 'App container is not running. Recent logs:'
  docker compose --env-file '$ENV_FILE' -f '$COMPOSE_BASE' -f '$COMPOSE_PROD' logs --tail=80 app || true
  docker compose --env-file '$ENV_FILE' -f '$COMPOSE_BASE' -f '$COMPOSE_PROD' ps -a
  exit 1
fi
docker image prune -f
EOF

tput bel
echo "Deploy completed at $(date +"%F %T")"
