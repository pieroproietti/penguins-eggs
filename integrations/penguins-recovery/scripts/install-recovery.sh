#!/usr/bin/env bash
# scripts/install-recovery.sh
#
# Install penguins-recovery and register its eggs plugin hook.
#
# Usage:
#   sudo bash scripts/install-recovery.sh [--prefix /usr/local] [--no-plugin]

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

echo "=== penguins-recovery installer ==="
echo "Prefix: $PREFIX"

# ── 1. Install shared rescue scripts ─────────────────────────────────────────
BIN_DIR="$PREFIX/bin"
SHARE_DIR="$PREFIX/share/penguins-recovery"
mkdir -p "$BIN_DIR" "$SHARE_DIR"

cp -r "$SCRIPT_DIR/common/"  "$SHARE_DIR/"
cp -r "$SCRIPT_DIR/adapters/" "$SHARE_DIR/"
chmod +x "$SHARE_DIR/common/scripts/"*.sh 2>/dev/null || true
chmod +x "$SHARE_DIR/adapters/adapter.sh"

# Symlink the adapter into PATH
ln -sf "$SHARE_DIR/adapters/adapter.sh" "$BIN_DIR/penguins-recovery-adapter"

echo "Installed to $SHARE_DIR"

# ── 2. Register eggs plugin hook ──────────────────────────────────────────────
if [ "$REGISTER_PLUGIN" = "1" ]; then
  HOOK_SRC="$SCRIPT_DIR/integration/eggs-plugin/recovery-hook.sh"
  if [ -f "$HOOK_SRC" ]; then
    mkdir -p "$PLUGIN_DIR"
    ln -sf "$HOOK_SRC" "$PLUGIN_DIR/40-recovery-hook.sh"
    echo "Plugin registered: $PLUGIN_DIR/40-recovery-hook.sh"
  else
    echo "Warning: hook script not found at $HOOK_SRC — skipping plugin registration"
  fi
fi

echo ""
echo "penguins-recovery installed."
echo "Run 'eggs produce --recovery' to embed recovery tools into your next ISO."
