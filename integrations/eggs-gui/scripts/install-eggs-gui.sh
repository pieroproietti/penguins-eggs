#!/bin/sh
# Install eggs-gui: daemon + TUI + optional desktop/web frontends.
#
# Usage:
#   sudo ./scripts/install-eggs-gui.sh              # daemon + TUI only
#   sudo ./scripts/install-eggs-gui.sh --desktop    # + NodeGUI desktop
#   sudo ./scripts/install-eggs-gui.sh --web        # + NiceGUI web
#   sudo ./scripts/install-eggs-gui.sh --all        # all frontends

set -e

INSTALL_DESKTOP=0
INSTALL_WEB=0

for arg in "$@"; do
    case "$arg" in
        --desktop) INSTALL_DESKTOP=1 ;;
        --web)     INSTALL_WEB=1 ;;
        --all)     INSTALL_DESKTOP=1; INSTALL_WEB=1 ;;
    esac
done

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BIN_DIR="${BIN_DIR:-/usr/local/bin}"
SYSTEMD_DIR="${SYSTEMD_DIR:-/etc/systemd/system}"

echo "=== eggs-gui installer ==="

# ── Dependencies ──────────────────────────────────────────────────────────────
if ! command -v go >/dev/null 2>&1; then
    echo "ERROR: Go is required to build eggs-gui. Install Go 1.21+ and retry." >&2
    exit 1
fi

# ── Build daemon + TUI ────────────────────────────────────────────────────────
echo "Building eggs-daemon and eggs-tui..."
make -C "$SCRIPT_DIR" daemon tui

install -m 755 "$SCRIPT_DIR/bin/eggs-daemon" "$BIN_DIR/eggs-daemon"
install -m 755 "$SCRIPT_DIR/bin/eggs-tui"    "$BIN_DIR/eggs-tui"
echo "Installed: $BIN_DIR/eggs-daemon, $BIN_DIR/eggs-tui"

# ── Desktop frontend (NodeGUI) ────────────────────────────────────────────────
if [ "$INSTALL_DESKTOP" = "1" ]; then
    if ! command -v npm >/dev/null 2>&1; then
        echo "WARNING: npm not found — skipping desktop frontend." >&2
    else
        echo "Building NodeGUI desktop frontend..."
        make -C "$SCRIPT_DIR" desktop
        # Install desktop entry
        mkdir -p /usr/share/applications
        install -m 644 "$SCRIPT_DIR/assets/eggs-gui.desktop" \
            /usr/share/applications/eggs-gui.desktop 2>/dev/null || true
        echo "Desktop frontend built."
    fi
fi

# ── Web frontend (NiceGUI) ────────────────────────────────────────────────────
if [ "$INSTALL_WEB" = "1" ]; then
    if ! command -v pip3 >/dev/null 2>&1 && ! command -v pip >/dev/null 2>&1; then
        echo "WARNING: pip not found — skipping web frontend." >&2
    else
        echo "Installing NiceGUI web frontend dependencies..."
        PIP="${PIP:-pip3}"
        $PIP install -r "$SCRIPT_DIR/web/requirements.txt"
        echo "Web frontend dependencies installed."
    fi
fi

# ── systemd service for the daemon ───────────────────────────────────────────
if command -v systemctl >/dev/null 2>&1; then
    cat > "$SYSTEMD_DIR/eggs-daemon.service" << 'SVCEOF'
[Unit]
Description=eggs-gui daemon (JSON-RPC socket for penguins-eggs GUI frontends)
After=network.target
Documentation=https://github.com/Interested-Deving-1896/eggs-gui

[Service]
Type=simple
ExecStart=/usr/local/bin/eggs-daemon
Restart=on-failure
RestartSec=3
# The daemon listens on /tmp/eggs-gui.sock — no network exposure by default.
# To expose over TCP for the web frontend, set EGGS_DAEMON_ADDR=:7777
Environment=EGGS_DAEMON_ADDR=

[Install]
WantedBy=multi-user.target
SVCEOF

    systemctl daemon-reload
    echo "systemd service installed: eggs-daemon.service"
    echo "Enable with: sudo systemctl enable --now eggs-daemon"
else
    echo "systemd not found — skipping service installation."
    echo "Start the daemon manually: eggs-daemon &"
fi

echo ""
echo "=== eggs-gui installation complete ==="
echo ""
echo "Start the daemon:  sudo systemctl start eggs-daemon"
echo "Launch TUI:        eggs-tui"
if [ "$INSTALL_DESKTOP" = "1" ]; then
    echo "Launch desktop:    cd $SCRIPT_DIR/desktop && npm start"
fi
if [ "$INSTALL_WEB" = "1" ]; then
    echo "Launch web:        cd $SCRIPT_DIR/web && python main.py"
fi
