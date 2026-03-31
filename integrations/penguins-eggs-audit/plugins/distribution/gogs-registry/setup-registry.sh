#!/bin/bash
# setup-registry.sh
# Sets up a self-hosted eggs ISO registry using Gogs + Giftless.
#
# Usage:
#   ./setup-registry.sh              # start the registry
#   ./setup-registry.sh --stop       # stop the registry
#   ./setup-registry.sh --status     # check status

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

case "${1:-start}" in
  start|--start)
    echo "Starting eggs ISO registry..."
    docker compose -f "$SCRIPT_DIR/docker-compose.yml" up -d

    echo ""
    echo "=== Eggs ISO Registry ==="
    echo "Gogs (Git UI):    http://localhost:3000"
    echo "LFS Server:       http://localhost:5000"
    echo "SSH:              ssh://git@localhost:2222"
    echo ""
    echo "First-time setup:"
    echo "  1. Open http://localhost:3000/install"
    echo "  2. Database: PostgreSQL, host=postgres:5432, user=gogs, pass=gogs_password, db=gogs"
    echo "  3. Create admin account"
    echo "  4. Create 'eggs-isos' repository"
    echo ""
    echo "Configure eggs to use this registry:"
    echo "  git remote add registry http://localhost:3000/<user>/eggs-isos.git"
    echo "  git config lfs.url http://localhost:5000/<user>/eggs-isos"
    ;;

  stop|--stop)
    echo "Stopping eggs ISO registry..."
    docker compose -f "$SCRIPT_DIR/docker-compose.yml" down
    ;;

  status|--status)
    docker compose -f "$SCRIPT_DIR/docker-compose.yml" ps
    ;;

  *)
    echo "Usage: $0 [start|stop|status]"
    exit 1
    ;;
esac
