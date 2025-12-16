#!/bin/bash

ISO_NAME=${ISO_NAME:-"my-custom-linux"}
INCLUDE_CALA=${INCLUDE_CALA:-false}
VERBOSE=${VERBOSE:-false}
THEME=${THEME:-"eggs"}

echo "[INFO] Starting penguin-eggs configuration..."
echo "[INFO] ISO Name: $ISO_NAME"
echo "[INFO] Include Calamares: $INCLUDE_CALA"
echo "[INFO] Verbose: $VERBOSE"
echo "[INFO] Theme: $THEME"

CONFIG_DIR="/etc/penguins-eggs.d"
mkdir -p "$CONFIG_DIR"

cat > "$CONFIG_DIR/config.conf" <<EOL
ISO_NAME=$ISO_NAME
INCLUDE_CALA=$INCLUDE_CALA
VERBOSE=$VERBOSE
THEME=$THEME
EOL

echo "[SUCCESS] Configuration saved to $CONFIG_DIR"
