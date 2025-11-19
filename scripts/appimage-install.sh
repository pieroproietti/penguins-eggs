#!/bin/bash
# Script di installazione system-wide per penguins-eggs AppImage

APP_NAME="penguins-eggs"
INSTALL_DIR="/usr/local/bin"

echo "Installing Penguins Eggs system-wide..."

# Cerca l'AppImage nella directory corrente
APPIMAGE_FILE=$(find . -maxdepth 1 -name "${APP_NAME}-*-x86_64.AppImage" | head -1)

if [ -z "$APPIMAGE_FILE" ]; then
    echo "ERROR: AppImage not found in current directory."
    echo "Please download it from: https://github.com/pieroproietti/penguins-eggs/releases"
    echo "Or run from the directory containing the AppImage file."
    exit 1
fi

# Rendi eseguibile e installa system-wide
echo "Installing $APPIMAGE_FILE to $INSTALL_DIR/eggs"
sudo chmod +x "$APPIMAGE_FILE"
sudo cp "$APPIMAGE_FILE" "$INSTALL_DIR/eggs"

# Nota sulle completion (rimosse)
echo ""
echo "NOTE autocomplete: run eggs autocomplete and follow instrutions"
echo "     man pages are not available in penguins-eggs as AppImage."
echo ""

echo ""
echo "SUCCESS: Penguins Eggs installed system-wide!"
echo ""
echo "Components installed:"
echo "  - Main executable: $INSTALL_DIR/eggs"
echo ""
echo "Usage:"
echo "  eggs help [command]  # Get help for specific commands"
echo "  eggs setup -f        # Install prerequisites"
echo "  eggs dad -d          # Configure eggs (default values)"
echo "  eggs love -n         # Create live ISO image (nointeractive)"
echo ""
echo "For full documentation, visit:"
echo "  https://github.com/pieroproietti/penguins-eggs"