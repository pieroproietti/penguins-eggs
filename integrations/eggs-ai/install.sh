#!/usr/bin/env bash
set -euo pipefail

# Eggs-AI installer for Linux systems
# Usage: curl -fsSL https://raw.githubusercontent.com/.../install.sh | bash

REPO="eggs-ai"
INSTALL_DIR="/opt/eggs-ai"
BIN_LINK="/usr/local/bin/eggs-ai"
SERVICE_FILE="/etc/systemd/system/eggs-ai.service"
MIN_NODE_VERSION=18

RED='\033[0;31m'
GREEN='\033[0;32m'
DIM='\033[2m'
RESET='\033[0m'

info()  { echo -e "${GREEN}[eggs-ai]${RESET} $*"; }
warn()  { echo -e "${RED}[eggs-ai]${RESET} $*"; }
dim()   { echo -e "${DIM}$*${RESET}"; }

# ─── Check prerequisites ──────────────────────────────────

check_node() {
  if ! command -v node &>/dev/null; then
    warn "Node.js is required but not found."
    echo "Install Node.js 18+ from https://nodejs.org or via your package manager:"
    echo "  Debian/Ubuntu: sudo apt install nodejs npm"
    echo "  Arch:          sudo pacman -S nodejs npm"
    echo "  Fedora:        sudo dnf install nodejs npm"
    exit 1
  fi

  local version
  version=$(node -v | sed 's/v//' | cut -d. -f1)
  if [ "$version" -lt "$MIN_NODE_VERSION" ]; then
    warn "Node.js $MIN_NODE_VERSION+ required, found v$(node -v)"
    exit 1
  fi
  dim "Node.js $(node -v) found"
}

check_root() {
  if [ "$(id -u)" -ne 0 ]; then
    warn "This installer needs root. Run with sudo:"
    echo "  sudo bash install.sh"
    exit 1
  fi
}

# ─── Install ──────────────────────────────────────────────

install_from_source() {
  info "Installing eggs-ai to $INSTALL_DIR..."

  # If running from the repo directory
  if [ -f "package.json" ] && grep -q '"eggs-ai"' package.json 2>/dev/null; then
    dim "Installing from local source..."
    mkdir -p "$INSTALL_DIR"
    cp -r . "$INSTALL_DIR/"
    cd "$INSTALL_DIR"
    npm install --production 2>/dev/null
    npm run build 2>/dev/null
  else
    # Clone from git
    if command -v git &>/dev/null; then
      dim "Cloning repository..."
      rm -rf "$INSTALL_DIR"
      git clone --depth 1 https://github.com/Interested-Deving-1896/eggs-ai.git "$INSTALL_DIR" 2>/dev/null
      cd "$INSTALL_DIR"
      npm install --production 2>/dev/null
      npm run build 2>/dev/null
    else
      warn "git is required for remote installation."
      echo "Either install git or run this script from the eggs-ai directory."
      exit 1
    fi
  fi

  # Create symlink
  ln -sf "$INSTALL_DIR/bin/eggs-ai.js" "$BIN_LINK"
  chmod +x "$BIN_LINK"

  info "Installed to $INSTALL_DIR"
  info "Binary linked at $BIN_LINK"
}

install_systemd_service() {
  if ! command -v systemctl &>/dev/null; then
    dim "systemd not found, skipping service installation"
    return
  fi

  info "Installing systemd service..."

  cat > "$SERVICE_FILE" << 'EOF'
[Unit]
Description=Eggs-AI API Server
Documentation=https://github.com/Interested-Deving-1896/eggs-ai
After=network.target

[Service]
Type=simple
ExecStart=/usr/local/bin/eggs-ai serve --port 3737 --host 127.0.0.1
Restart=on-failure
RestartSec=5
Environment=NODE_ENV=production

# Security hardening
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=read-only
ReadWritePaths=/tmp

[Install]
WantedBy=multi-user.target
EOF

  systemctl daemon-reload
  info "Service installed. Enable with:"
  dim "  sudo systemctl enable --now eggs-ai"
}

setup_config() {
  local config_dir="/etc/eggs-ai"
  local config_file="$config_dir/config.yaml"

  if [ ! -f "$config_file" ]; then
    mkdir -p "$config_dir"
    cat > "$config_file" << 'EOF'
# Eggs-AI configuration
# See: eggs-ai providers init

# default_provider: gemini

# providers: []
EOF
    info "Config created at $config_file"
  else
    dim "Config already exists at $config_file"
  fi
}

# ─── Uninstall ────────────────────────────────────────────

uninstall() {
  info "Uninstalling eggs-ai..."

  if command -v systemctl &>/dev/null; then
    systemctl stop eggs-ai 2>/dev/null || true
    systemctl disable eggs-ai 2>/dev/null || true
    rm -f "$SERVICE_FILE"
    systemctl daemon-reload 2>/dev/null || true
  fi

  rm -f "$BIN_LINK"
  rm -rf "$INSTALL_DIR"

  info "Uninstalled."
}

# ─── Main ─────────────────────────────────────────────────

main() {
  echo ""
  echo "  Eggs-AI Installer"
  echo "  AI agent for Penguins-Eggs"
  echo ""

  if [ "${1:-}" = "--uninstall" ] || [ "${1:-}" = "uninstall" ]; then
    check_root
    uninstall
    exit 0
  fi

  check_root
  check_node
  install_from_source
  setup_config
  install_systemd_service

  echo ""
  info "Installation complete!"
  echo ""
  echo "  Usage:"
  echo "    eggs-ai status                    # Check system"
  echo "    eggs-ai doctor                    # AI diagnostics"
  echo "    eggs-ai ask 'How do I ...?'       # Ask a question"
  echo "    eggs-ai serve                     # Start API server"
  echo "    sudo systemctl start eggs-ai      # Start as service"
  echo ""
  echo "  Set an LLM provider key:"
  echo "    export GEMINI_API_KEY=your-key"
  echo "    export OPENAI_API_KEY=your-key"
  echo "    # Or use Ollama locally (no key needed)"
  echo ""
}

main "$@"
