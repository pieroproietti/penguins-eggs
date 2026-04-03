#!/usr/bin/env bash
# scripts/install-pkm.sh
#
# Install penguins-kernel-manager and register its eggs plugin hook.
#
# Usage:
#   sudo bash scripts/install-pkm.sh [--prefix /usr/local] [--no-plugin]

set -euo pipefail

PREFIX="${PREFIX:-/usr/local}"
REGISTER_PLUGIN=1
PLUGIN_DIR="${PLUGIN_DIR:-/usr/share/penguins-eggs/plugins}"

for arg in "$@"; do
  case "$arg" in
    --prefix=*) PREFIX="${arg#*=}" ;;
    --no-plugin) REGISTER_PLUGIN=0 ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "=== penguins-kernel-manager installer ==="
echo "Prefix: $PREFIX"

# ── 1. Install Python package ─────────────────────────────────────────────────
if command -v pip3 &>/dev/null; then
  echo "Installing Python package..."
  pip3 install --quiet "$SCRIPT_DIR"
elif command -v pip &>/dev/null; then
  pip install --quiet "$SCRIPT_DIR"
else
  echo "Warning: pip not found — skipping Python package install"
  echo "Install manually: pip3 install $SCRIPT_DIR"
fi

# ── 2. Register eggs plugin hook ──────────────────────────────────────────────
if [ "$REGISTER_PLUGIN" = "1" ]; then
  HOOK_SRC="$SCRIPT_DIR/integration/eggs-plugin/pkm-hook.sh"
  if [ -f "$HOOK_SRC" ]; then
    mkdir -p "$PLUGIN_DIR"
    ln -sf "$HOOK_SRC" "$PLUGIN_DIR/30-pkm-hook.sh"
    echo "Plugin registered: $PLUGIN_DIR/30-pkm-hook.sh"
  else
    echo "Warning: hook script not found at $HOOK_SRC — skipping plugin registration"
  fi
fi

echo ""
echo "penguins-kernel-manager installed."
echo "Kernel manifests will be embedded automatically on the next 'eggs produce'."
