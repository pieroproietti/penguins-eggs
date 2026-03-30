#!/bin/sh
# ILF bootstrap installer
# Usage: curl -fsSL https://ilf.example.org/install.sh | sh
# Or:    sh install.sh [--prefix /usr/local] [--no-systemd]
set -e

PREFIX="/usr/local"
INSTALL_SYSTEMD=1
REPO="https://github.com/your-org/immutable-linux-framework"

for arg in "$@"; do
    case "$arg" in
        --prefix=*) PREFIX="${arg#*=}" ;;
        --no-systemd) INSTALL_SYSTEMD=0 ;;
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

echo "ILF installer: arch=$ARCH os=$OS prefix=$PREFIX"

# Check for Go — build from source if no pre-built binary is available
if command -v go >/dev/null 2>&1; then
    echo "Building ilf from source..."
    tmpdir=$(mktemp -d)
    trap 'rm -rf "$tmpdir"' EXIT
    git clone --depth=1 "$REPO" "$tmpdir/ilf-src"
    cd "$tmpdir/ilf-src"
    make build PREFIX="$PREFIX"
    make install PREFIX="$PREFIX"
else
    echo "Go not found. Please install Go >= 1.22 and re-run this script." >&2
    exit 1
fi

# Install systemd units if requested and systemd is present
if [ "$INSTALL_SYSTEMD" = "1" ] && command -v systemctl >/dev/null 2>&1; then
    echo "Installing systemd units..."
    install -Dm644 systemd/ilf-update.service /usr/lib/systemd/system/ilf-update.service
    install -Dm644 systemd/ilf-update.timer   /usr/lib/systemd/system/ilf-update.timer
    systemctl daemon-reload
    echo "Run 'systemctl enable --now ilf-update.timer' to enable automatic updates."
fi

echo ""
echo "ILF installed to $PREFIX/bin/ilf"
echo "Copy ilf.toml.sample to /etc/ilf/ilf.toml and edit it to get started."
echo "Then run: ilf init"
