#!/bin/sh
# PIF bootstrap installer
# Usage: curl -fsSL https://pif.example.org/install.sh | sh
# Or:    sh install.sh [--prefix /usr/local] [--no-systemd]
set -e

PREFIX="/usr/local"
INSTALL_SYSTEMD=1
REGISTER_PLUGIN=1
PLUGIN_DIR="${PLUGIN_DIR:-/usr/share/penguins-eggs/plugins}"
REPO="https://github.com/your-org/penguins-immutable-framework"

for arg in "$@"; do
    case "$arg" in
        --prefix=*) PREFIX="${arg#*=}" ;;
        --no-systemd) INSTALL_SYSTEMD=0 ;;
        --no-plugin) REGISTER_PLUGIN=0 ;;
    esac
done

# Detect architecture
ARCH=$(uname -m)
case "$ARCH" in
    x86_64)  export GOARCH="amd64" ;;
    aarch64) export GOARCH="arm64" ;;
    armv7*)  export GOARCH="arm" ;;
    riscv64) export GOARCH="riscv64" ;;
    ppc64le) export GOARCH="ppc64le" ;;
    s390x)   export GOARCH="s390x" ;;
    *) echo "Unsupported architecture: $ARCH" >&2; exit 1 ;;
esac

OS=$(uname -s | tr '[:upper:]' '[:lower:]')

echo "PIF installer: arch=$ARCH os=$OS prefix=$PREFIX"

# Check for Go — build from source if no pre-built binary is available
if command -v go >/dev/null 2>&1; then
    echo "Building pif from source..."
    tmpdir=$(mktemp -d)
    trap 'rm -rf "$tmpdir"' EXIT
    git clone --depth=1 "$REPO" "$tmpdir/pif-src"
    cd "$tmpdir/pif-src"
    make build PREFIX="$PREFIX"
    make install PREFIX="$PREFIX"
else
    echo "Go not found. Please install Go >= 1.22 and re-run this script." >&2
    exit 1
fi

# Install systemd units if requested and systemd is present
if [ "$INSTALL_SYSTEMD" = "1" ] && command -v systemctl >/dev/null 2>&1; then
    echo "Installing systemd units..."
    install -Dm644 systemd/pif-update.service /usr/lib/systemd/system/pif-update.service
    install -Dm644 systemd/pif-update.timer   /usr/lib/systemd/system/pif-update.timer
    systemctl daemon-reload
    echo "Run 'systemctl enable --now pif-update.timer' to enable automatic updates."
fi

# ── Register eggs plugin hook ─────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
if [ "$REGISTER_PLUGIN" = "1" ]; then
    HOOK_SRC="$SCRIPT_DIR/integration/eggs-plugin/pif-hook.sh"
    if [ -f "$HOOK_SRC" ]; then
        mkdir -p "$PLUGIN_DIR"
        ln -sf "$HOOK_SRC" "$PLUGIN_DIR/20-pif-hook.sh"
        echo "Plugin registered: $PLUGIN_DIR/20-pif-hook.sh"
    else
        echo "Warning: hook script not found at $HOOK_SRC — skipping plugin registration"
    fi
fi

echo ""
echo "PIF installed to $PREFIX/bin/pif"
echo "Copy pif.toml.sample to /etc/pif/pif.toml and edit it to get started."
echo "Then run: pif init"
echo "PIF state will be embedded automatically on the next 'eggs produce'."
