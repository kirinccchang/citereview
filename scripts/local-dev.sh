#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
WORKER_DIR="$ROOT_DIR/worker"
STATE_DIR="$ROOT_DIR/.local-dev"

UI_PORT="${UI_PORT:-8788}"
API_PORT="${API_PORT:-8787}"

UI_PID_FILE="$STATE_DIR/ui.pid"
API_PID_FILE="$STATE_DIR/api.pid"
UI_LOG="$STATE_DIR/ui.log"
API_LOG="$STATE_DIR/api.log"

mkdir -p "$STATE_DIR"

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1"
    exit 1
  fi
}

is_pid_running() {
  local pid="$1"
  kill -0 "$pid" >/dev/null 2>&1
}

kill_from_pid_file() {
  local pid_file="$1"
  local name="$2"
  if [[ -f "$pid_file" ]]; then
    local pid
    pid="$(cat "$pid_file" 2>/dev/null || true)"
    if [[ -n "$pid" ]] && is_pid_running "$pid"; then
      kill "$pid" >/dev/null 2>&1 || true
      sleep 0.3
      if is_pid_running "$pid"; then
        kill -9 "$pid" >/dev/null 2>&1 || true
      fi
      echo "Stopped $name (pid $pid)"
    fi
    rm -f "$pid_file"
  fi
}

wait_for_http() {
  local url="$1"
  local label="$2"
  local tries=50
  while (( tries > 0 )); do
    if curl -sSf "$url" >/dev/null 2>&1; then
      echo "$label ready: $url"
      return 0
    fi
    sleep 0.2
    tries=$((tries - 1))
  done
  echo "Timed out waiting for $label at $url"
  return 1
}

print_post_start_instructions() {
  cat <<EOF

Local servers are running.

UI:
  http://localhost:${UI_PORT}

Worker API:
  http://localhost:${API_PORT}

One-time browser setup (DevTools Console on localhost page):
  localStorage.setItem("citereview_api_base", "http://localhost:${API_PORT}");
  localStorage.setItem("citereview_verifier_v2", "1");
  localStorage.setItem("citereview_run_self_tests", "1");
  location.reload();

Verification checks:
  window.citereviewRuntime
  window.citereviewRunVerifierSelfTests()

Logs:
  tail -f "$UI_LOG"
  tail -f "$API_LOG"

Stop:
  ./scripts/local-dev.sh stop
EOF
}

start() {
  require_cmd node
  require_cmd npx
  require_cmd curl

  kill_from_pid_file "$UI_PID_FILE" "UI server"
  kill_from_pid_file "$API_PID_FILE" "Worker API"

  echo "Starting UI on port $UI_PORT..."
  (
    cd "$ROOT_DIR"
    nohup npx serve -l "$UI_PORT" --no-port-switching >"$UI_LOG" 2>&1 &
    echo $! >"$UI_PID_FILE"
  )

  echo "Starting Worker API on port $API_PORT..."
  (
    cd "$WORKER_DIR"
    nohup npx wrangler dev --port "$API_PORT" >"$API_LOG" 2>&1 &
    echo $! >"$API_PID_FILE"
  )

  wait_for_http "http://localhost:${UI_PORT}" "UI" || true
  wait_for_http "http://localhost:${API_PORT}" "Worker API" || true
  print_post_start_instructions
}

stop() {
  kill_from_pid_file "$UI_PID_FILE" "UI server"
  kill_from_pid_file "$API_PID_FILE" "Worker API"
}

status() {
  local ui_status="stopped"
  local api_status="stopped"

  if [[ -f "$UI_PID_FILE" ]] && is_pid_running "$(cat "$UI_PID_FILE")"; then
    ui_status="running (pid $(cat "$UI_PID_FILE"))"
  fi
  if [[ -f "$API_PID_FILE" ]] && is_pid_running "$(cat "$API_PID_FILE")"; then
    api_status="running (pid $(cat "$API_PID_FILE"))"
  fi

  echo "UI server: $ui_status"
  echo "Worker API: $api_status"
  if curl -sSf "http://localhost:${UI_PORT}" >/dev/null 2>&1; then
    echo "UI HTTP check: ok"
  else
    echo "UI HTTP check: unavailable"
  fi
  if curl -sSf "http://localhost:${API_PORT}" >/dev/null 2>&1; then
    echo "Worker HTTP check: ok"
  else
    echo "Worker HTTP check: unavailable"
  fi
}

case "${1:-start}" in
  start)
    start
    ;;
  stop)
    stop
    ;;
  restart)
    stop
    start
    ;;
  status)
    status
    ;;
  *)
    echo "Usage: ./scripts/local-dev.sh [start|stop|restart|status]"
    exit 1
    ;;
esac
