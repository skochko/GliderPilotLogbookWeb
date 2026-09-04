#!/usr/bin/env bash

set -Eeuo pipefail

HOST="192.168.1.224"
USER="deploy"
APP_NAME="stage.gliderpilotlogbook.co.uk"
BRANCH_NAME="${BRANCH_NAME:-stage}"
REMOTE_DIR="${REMOTE_DIR:-/home/$USER/$APP_NAME}"
ARCHIVE="/tmp/$APP_NAME.tar.gz"
COMPOSE_BASE="$REMOTE_DIR/docker-compose.yml"
COMPOSE_STAGE="$REMOTE_DIR/docker-compose.staging.yml"
ENV_FILE="$REMOTE_DIR/.env"
SSH_OPTS=(
  -o BatchMode=yes
  -o ConnectTimeout=20
  -o ServerAliveInterval=10
  -o ServerAliveCountMax=3
)

log() {
  printf '[deploy:stage] %s\n' "$*"
}

cleanup() {
  rm -f "$ARCHIVE"
}

trap cleanup EXIT
trap 'log "failed at line $LINENO"' ERR

log "Fetching origin/$BRANCH_NAME"
git fetch origin "$BRANCH_NAME"

log "Creating archive from origin/$BRANCH_NAME"
git archive --format=tar.gz "origin/$BRANCH_NAME" -o "$ARCHIVE"

log "Ensuring remote directory $USER@$HOST:$REMOTE_DIR"
ssh "${SSH_OPTS[@]}" "$USER@$HOST" "mkdir -p '$REMOTE_DIR'"

log "Uploading archive"
scp "${SSH_OPTS[@]}" "$ARCHIVE" "$USER@$HOST:$ARCHIVE"

log "Deploying on remote host"
ssh "${SSH_OPTS[@]}" "$USER@$HOST" bash -s <<EOF
set -Eeuo pipefail
cd '$REMOTE_DIR'
test -f '$ENV_FILE'
find . -mindepth 1 -maxdepth 1 ! -name '.env' -exec rm -rf {} +
tar -xzf '$ARCHIVE' --directory '$REMOTE_DIR'
rm -f '$ARCHIVE'
docker compose --env-file '$ENV_FILE' -f '$COMPOSE_BASE' -f '$COMPOSE_STAGE' up -d --build --remove-orphans
sleep 5
if [ -z "\$(docker compose --env-file '$ENV_FILE' -f '$COMPOSE_BASE' -f '$COMPOSE_STAGE' ps -q web --status running)" ]; then
  echo 'Web container is not running. Recent logs:'
  docker compose --env-file '$ENV_FILE' -f '$COMPOSE_BASE' -f '$COMPOSE_STAGE' logs --tail=80 web || true
  docker compose --env-file '$ENV_FILE' -f '$COMPOSE_BASE' -f '$COMPOSE_STAGE' ps -a
  exit 1
fi
docker image prune -f
EOF

if command -v tput >/dev/null 2>&1 && [ -t 1 ]; then
  tput bel
fi
log "Deploy completed at $(date +"%F %T")"
