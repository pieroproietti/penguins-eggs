#!/bin/bash
# Script di installazione per penguins-eggs AppImage

APP_NAME="penguins-eggs"
LATEST_URL="https://github.com/pieroproietti/penguins-eggs/releases/latest"
INSTALL_DIR="$HOME/.local/bin"
DESKTOP_DIR="$HOME/.local/share/applications"

echo "🐧 Installing Penguins Eggs..."

# Crea directory se non esistono
mkdir -p "$INSTALL_DIR"
mkdir -p "$DESKTOP_DIR"

# Scarica l'ultima versione
echo "📥 Downloading latest AppImage..."
cd /tmp
wget -q "$LATEST_URL/download/${APP_NAME}-*-x86_64.AppImage" -O "${APP_NAME}.AppImage"

if [ $? -ne 0 ]; then
    echo "❌ Download failed. Please download manually from:"
    echo "   $LATEST_URL"
    exit 1
fi

# Rendi eseguibile
chmod +x "${APP_NAME}.AppImage"

# Installa
mv "${APP_NAME}.AppImage" "$INSTALL_DIR/eggs"

# Crea desktop file
cat > "$DESKTOP_DIR/penguins-eggs.desktop" << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=Penguins Eggs
Comment=Utility CLI per creare distribuzioni Linux live personalizzate
Exec=$INSTALL_DIR/eggs
Icon=penguins-eggs
Categories=System;
Terminal=true
StartupNotify=false
EOF

echo "✅ Penguins Eggs installed successfully!"
echo "📍 Location: $INSTALL_DIR/eggs"
echo "🚀 Run with: eggs"
