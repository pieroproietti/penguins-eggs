#!/bin/bash
# install-tools.sh
# Installs git developer tools from GitHub releases.
# Called during wardrobe wear for the 'developer' costume.

set -euo pipefail

ARCH=$(uname -m)
case "$ARCH" in
  x86_64)  GO_ARCH="Linux_x86_64"; RUST_ARCH="x86_64-unknown-linux-gnu" ;;
  aarch64) GO_ARCH="Linux_arm64"; RUST_ARCH="aarch64-unknown-linux-gnu" ;;
  *)       echo "Unsupported arch: $ARCH"; exit 1 ;;
esac

INSTALL_DIR="/usr/local/bin"

# --- lazygit ---
install_lazygit() {
  echo "Installing lazygit..."
  local version
  version=$(curl -fsSL "https://api.github.com/repos/jesseduffield/lazygit/releases/latest" | grep -oP '"tag_name":\s*"v\K[^"]+')

  local url="https://github.com/jesseduffield/lazygit/releases/download/v${version}/lazygit_${version}_${GO_ARCH}.tar.gz"
  local tmp=$(mktemp -d)

  curl -fsSL "$url" | tar xz -C "$tmp"
  install -m 755 "$tmp/lazygit" "$INSTALL_DIR/lazygit"
  rm -rf "$tmp"

  echo "lazygit ${version} installed"
}

# --- git-swift ---
install_git_swift() {
  echo "Installing git-swift..."
  local url
  url=$(curl -fsSL "https://api.github.com/repos/ddddami/git-swift/releases/latest" | \
    grep -oP '"browser_download_url":\s*"\K[^"]+' | grep -i linux | head -1)

  if [ -n "$url" ]; then
    local tmp=$(mktemp -d)
    curl -fsSL "$url" -o "$tmp/git-swift"
    install -m 755 "$tmp/git-swift" "$INSTALL_DIR/git-swift"
    rm -rf "$tmp"
    echo "git-swift installed"
  else
    echo "git-swift: no Linux binary found, skipping"
  fi
}

# --- git-insight ---
install_git_insight() {
  echo "Installing git-insight..."
  local tmp=$(mktemp -d)
  git clone --depth 1 https://github.com/avimehenwal/git-insight.git "$tmp/git-insight"
  install -m 755 "$tmp/git-insight/git-insight.sh" "$INSTALL_DIR/git-insight"
  rm -rf "$tmp"
  echo "git-insight installed"
}

# --- Main ---
main() {
  echo "=== Installing developer tools ==="

  install_lazygit
  install_git_swift
  install_git_insight

  echo ""
  echo "=== Developer tools installed ==="
  echo "  lazygit    — Terminal UI for git"
  echo "  git-swift  — Fuzzy branch switcher"
  echo "  git-insight — Repo analytics"
}

main "$@"
