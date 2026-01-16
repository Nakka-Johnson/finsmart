#!/usr/bin/env bash
# FinSmart Development Helper
# Usage: ./scripts/dev.sh [command]
#
# Commands:
#   up      Start all services (docker compose up --build -d)
#   down    Stop all services
#   logs    Tail logs from all services
#   reset   Stop, remove volumes, and restart fresh

set -e

COMPOSE_FILE="docker-compose.yml"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$PROJECT_ROOT"

case "${1:-up}" in
  up)
    echo "🚀 Starting FinSmart..."
    docker compose -f "$COMPOSE_FILE" up --build -d
    echo ""
    echo "✅ Services starting:"
    echo "   Frontend:  http://localhost:5173"
    echo "   Backend:   http://localhost:8081"
    echo "   AI:        http://localhost:8001"
    echo "   Postgres:  localhost:5433"
    echo ""
    echo "Run './scripts/dev.sh logs' to watch logs"
    ;;
  down)
    echo "🛑 Stopping FinSmart..."
    docker compose -f "$COMPOSE_FILE" down
    echo "✅ All services stopped"
    ;;
  logs)
    docker compose -f "$COMPOSE_FILE" logs -f
    ;;
  reset)
    echo "🔄 Resetting FinSmart (removes all data)..."
    docker compose -f "$COMPOSE_FILE" down -v
    docker compose -f "$COMPOSE_FILE" up --build -d
    echo "✅ Fresh start complete"
    ;;
  *)
    echo "Usage: $0 {up|down|logs|reset}"
    exit 1
    ;;
esac
