#!/bin/sh
# Install distrobuilder on the current system.
#
# Tries methods in order:
#   1. snap (cross-distro, simplest)
#   2. Build from source (Go required)
#
# Usage:
#   sudo ./scripts/install-distrobuilder.sh
#   sudo ./scripts/install-distrobuilder.sh --source   # force build from source

set -e

FORCE_SOURCE=0
for arg in "$@"; do
    case "$arg" in
        --source) FORCE_SOURCE=1 ;;
    esac
done

INSTALL_DIR="${INSTALL_DIR:-/usr/local/bin}"
TEMPLATE_DIR="${TEMPLATE_DIR:-/usr/local/share/penguins-distrobuilder/templates}"
HOOK_DIR="${HOOK_DIR:-/usr/local/share/penguins-distrobuilder/integration/eggs-plugin}"
RECOVERY_HOOK_DIR="${RECOVERY_HOOK_DIR:-/usr/local/share/penguins-distrobuilder/integration/recovery-plugin}"
PLUGIN_DIR="${PLUGIN_DIR:-/usr/share/penguins-eggs/plugins}"

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "=== penguins-distrobuilder installer ==="

# ── 1. Install distrobuilder binary ──────────────────────────────────────────
if command -v distrobuilder >/dev/null 2>&1 && [ "$FORCE_SOURCE" = "0" ]; then
    echo "distrobuilder already installed: $(command -v distrobuilder)"
elif [ "$FORCE_SOURCE" = "0" ] && command -v snap >/dev/null 2>&1; then
    echo "Installing distrobuilder via snap..."
    snap install distrobuilder --classic
elif command -v go >/dev/null 2>&1; then
    echo "Building distrobuilder from source (Go $(go version | awk '{print $3}'))..."
    cd "$SCRIPT_DIR/distrobuilder"
    go build -o "${INSTALL_DIR}/distrobuilder" ./cmd/distrobuilder
    echo "distrobuilder installed to ${INSTALL_DIR}/distrobuilder"
    cd "$SCRIPT_DIR"
else
    echo "ERROR: Cannot install distrobuilder." >&2
    echo "  Option 1: Install snapd and re-run this script." >&2
    echo "  Option 2: Install Go 1.21+ and re-run with --source." >&2
    echo "  Option 3: sudo snap install distrobuilder --classic" >&2
    exit 1
fi

# ── 2. Install squashfs-tools (needed by the hook to read the squashfs) ───────
if ! command -v unsquashfs >/dev/null 2>&1; then
    echo "Installing squashfs-tools..."
    if command -v apt-get >/dev/null 2>&1; then
        apt-get install -y squashfs-tools
    elif command -v dnf >/dev/null 2>&1; then
        dnf install -y squashfs-tools
    elif command -v pacman >/dev/null 2>&1; then
        pacman -S --noconfirm squashfs-tools
    elif command -v zypper >/dev/null 2>&1; then
        zypper install -y squashfs
    elif command -v apk >/dev/null 2>&1; then
        apk add squashfs-tools
    else
        echo "WARNING: Could not install squashfs-tools automatically. Install it manually." >&2
    fi
fi

# ── 3. Install template ───────────────────────────────────────────────────────
echo "Installing distrobuilder template..."
mkdir -p "$TEMPLATE_DIR"
cp "$SCRIPT_DIR/templates/penguins-eggs.yaml" "$TEMPLATE_DIR/penguins-eggs.yaml"
echo "Template installed to: $TEMPLATE_DIR/penguins-eggs.yaml"

# ── 4. Install integration hooks ─────────────────────────────────────────────
echo "Installing integration hooks..."
mkdir -p "$HOOK_DIR" "$RECOVERY_HOOK_DIR"
cp "$SCRIPT_DIR/integration/eggs-plugin/distrobuilder-hook.sh" "$HOOK_DIR/distrobuilder-hook.sh"
cp "$SCRIPT_DIR/integration/recovery-plugin/distrobuilder-recovery-hook.sh" "$RECOVERY_HOOK_DIR/distrobuilder-recovery-hook.sh"
chmod +x "$HOOK_DIR/distrobuilder-hook.sh" "$RECOVERY_HOOK_DIR/distrobuilder-recovery-hook.sh"

# ── 5. Register with eggs plugin loader ───────────────────────────────────────
echo "Registering with eggs plugin loader..."
mkdir -p "$PLUGIN_DIR"
ln -sf "$HOOK_DIR/distrobuilder-hook.sh" "$PLUGIN_DIR/50-distrobuilder-hook.sh"
echo "Plugin registered: $PLUGIN_DIR/50-distrobuilder-hook.sh"

# ── 6. Create default config ──────────────────────────────────────────────────
CONF_DIR=/etc/penguins-distrobuilder
CONF_FILE="$CONF_DIR/eggs-hooks.conf"
if [ ! -f "$CONF_FILE" ]; then
    echo "Creating default config: $CONF_FILE"
    mkdir -p "$CONF_DIR"
    cat > "$CONF_FILE" << 'CONFEOF'
# penguins-distrobuilder eggs hook configuration
# Enable distrobuilder export on every `eggs produce`
DISTROBUILDER_ENABLED=0

# Image type: incus | lxc | both
DISTROBUILDER_TYPE=incus

# Output directory for built images
DISTROBUILDER_OUTPUT=/var/lib/eggs/distrobuilder

# Path to distrobuilder YAML template (leave empty to use the bundled one)
DISTROBUILDER_TEMPLATE=

# Extra flags passed to distrobuilder (e.g. --debug)
DISTROBUILDER_EXTRA_OPTS=

# Remove the temporary squashfs copy after build (only applies when
# the squashfs was extracted from the ISO rather than found directly)
DISTROBUILDER_CLEANUP_SQUASHFS=1

# Recovery plugin settings
DISTROBUILDER_RECOVERY_ENABLED=0
DISTROBUILDER_RECOVERY_ROOTFS=/
DISTROBUILDER_RECOVERY_OUTPUT=/var/lib/eggs/distrobuilder/recovery
CONFEOF
    echo "Edit $CONF_FILE to enable and configure the integration."
else
    echo "Config already exists: $CONF_FILE (not overwritten)"
fi

echo ""
echo "=== Installation complete ==="
echo ""
echo "To enable automatic export on every 'eggs produce':"
echo "  Edit $CONF_FILE and set DISTROBUILDER_ENABLED=1"
echo ""
echo "Or use the CLI flag for one-off exports:"
echo "  sudo eggs produce --distrobuilder"
echo "  sudo eggs produce --distrobuilder --distrobuilder-type=lxc"
echo "  sudo eggs produce --distrobuilder --distrobuilder-type=both"
