#!/usr/bin/env bash
# scripts/install-powerwash.sh
#
# Install penguins-powerwash and register its eggs plugin hook.
#
# Usage:
#   sudo bash scripts/install-powerwash.sh [--prefix /usr/local] [--no-plugin]

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

echo "=== penguins-powerwash installer ==="
echo "Prefix: $PREFIX"

# ── 1. Install binary and libraries ──────────────────────────────────────────
BIN_DIR="$PREFIX/bin"
LIB_DIR="$PREFIX/lib/penguins-powerwash"
mkdir -p "$BIN_DIR" "$LIB_DIR"

if [ -f "$SCRIPT_DIR/bin/penguins-powerwash" ]; then
  install -m 0755 "$SCRIPT_DIR/bin/penguins-powerwash" "$BIN_DIR/penguins-powerwash"
fi

if [ -d "$SCRIPT_DIR/lib" ]; then
  cp -r "$SCRIPT_DIR/lib/"  "$LIB_DIR/"
fi
if [ -d "$SCRIPT_DIR/modes" ]; then
  cp -r "$SCRIPT_DIR/modes/" "$LIB_DIR/modes/"
fi
if [ -d "$SCRIPT_DIR/plugins" ]; then
  cp -r "$SCRIPT_DIR/plugins/" "$LIB_DIR/plugins/"
fi

echo "Installed to $PREFIX"

# ── 2. Register eggs plugin hook ──────────────────────────────────────────────
if [ "$REGISTER_PLUGIN" = "1" ]; then
  HOOK_SRC="$SCRIPT_DIR/integration/eggs-plugin/powerwash-hook.sh"
  if [ -f "$HOOK_SRC" ]; then
    mkdir -p "$PLUGIN_DIR"
    ln -sf "$HOOK_SRC" "$PLUGIN_DIR/60-powerwash-hook.sh"
    echo "Plugin registered: $PLUGIN_DIR/60-powerwash-hook.sh"
  else
    echo "Warning: hook script not found at $HOOK_SRC — skipping plugin registration"
  fi
fi

echo ""
echo "penguins-powerwash installed."
echo "The factory-reset GRUB entry will be added automatically on the next 'eggs produce'."
