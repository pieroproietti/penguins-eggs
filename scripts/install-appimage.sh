#!/bin/bash
# Script di installazione semplice per penguins-eggs AppImage

APP_NAME="penguins-eggs"
INSTALL_DIR="$HOME/.local/bin"

echo "Installing Penguins Eggs..."

# Crea directory se non esiste
mkdir -p "$INSTALL_DIR"

# Cerca l'AppImage nella directory corrente
APPIMAGE_FILE=$(find . -name "${APP_NAME}-*-x86_64.AppImage" | head -1)

if [ -z "$APPIMAGE_FILE" ]; then
    echo "ERROR: AppImage not found in current directory."
    echo "Please download it from: https://github.com/pieroproietti/penguins-eggs/releases"
    exit 1
fi

# Rendi eseguibile e installa
chmod +x "$APPIMAGE_FILE"
cp "$APPIMAGE_FILE" "$INSTALL_DIR/eggs"

echo "SUCCESS: Penguins Eggs installed to $INSTALL_DIR/eggs"
echo "Add to your PATH if needed: export PATH=\"\$HOME/.local/bin:\$PATH\""