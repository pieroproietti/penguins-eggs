#!/bin/sh
# gitpack install script for penguins-eggs
# Enables: gitpack install pieroproietti/penguins-eggs

set -eu

REPO_URL="https://github.com/pieroproietti/penguins-eggs"
INSTALL_DIR="/usr/local/lib/penguins-eggs"
BIN_LINK="/usr/local/bin/eggs"

# Detect architecture
ARCH=$(uname -m)
case "$ARCH" in
  x86_64)  DEB_ARCH="amd64" ;;
  aarch64) DEB_ARCH="arm64" ;;
  armv7l)  DEB_ARCH="armhf" ;;
  i686)    DEB_ARCH="i386" ;;
  *)       echo "Unsupported architecture: $ARCH"; exit 1 ;;
esac

# Detect package manager
if command -v dpkg >/dev/null 2>&1; then
  PKG_TYPE="deb"
elif command -v rpm >/dev/null 2>&1; then
  PKG_TYPE="rpm"
elif command -v pacman >/dev/null 2>&1; then
  PKG_TYPE="pacman"
else
  PKG_TYPE="npm"
fi

# Get latest release tag
LATEST_TAG=$(git -C "$GITPACK_REPO_DIR" describe --tags --abbrev=0 2>/dev/null || echo "")
if [ -z "$LATEST_TAG" ]; then
  LATEST_TAG=$(git -C "$GITPACK_REPO_DIR" tag --sort=-v:refname | head -1)
fi

VERSION=$(echo "$LATEST_TAG" | sed 's/^v//')

echo "Installing penguins-eggs $VERSION for $ARCH ($PKG_TYPE)"

case "$PKG_TYPE" in
  deb)
    # Download and install .deb from GitHub releases
    DEB_URL="${REPO_URL}/releases/download/${LATEST_TAG}/penguins-eggs_${VERSION}_${DEB_ARCH}.deb"
    TMP_DEB=$(mktemp /tmp/penguins-eggs-XXXXXX.deb)
    if command -v curl >/dev/null 2>&1; then
      curl -fsSL "$DEB_URL" -o "$TMP_DEB"
    elif command -v wget >/dev/null 2>&1; then
      wget -q "$DEB_URL" -O "$TMP_DEB"
    fi
    dpkg -i "$TMP_DEB" || apt-get install -f -y
    rm -f "$TMP_DEB"
    ;;
  npm)
    # Fallback: install via npm
    if command -v npm >/dev/null 2>&1; then
      npm install -g penguins-eggs
    else
      echo "No supported package manager found. Install npm or use a .deb/.rpm package."
      exit 1
    fi
    ;;
  *)
    echo "Package type $PKG_TYPE: download from ${REPO_URL}/releases"
    exit 1
    ;;
esac

echo "penguins-eggs $VERSION installed successfully"
