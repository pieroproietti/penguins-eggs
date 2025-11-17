#!/bin/bash
# Script di installazione system-wide per penguins-eggs AppImage

APP_NAME="penguins-eggs"
INSTALL_DIR="/usr/local/bin"
BASH_COMPLETION_DIR="/etc/bash_completion.d"
ZSH_COMPLETION_DIR="/usr/local/share/zsh/site-functions"

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

# Installa bash completion
echo "Installing bash completion..."
if [ -f "scripts/eggs.bash" ] && [ -d "$BASH_COMPLETION_DIR" ]; then
    sudo cp scripts/eggs.bash "$BASH_COMPLETION_DIR/eggs"
    echo "SUCCESS: Bash completion installed to $BASH_COMPLETION_DIR/eggs"
else
    echo "WARNING: Bash completion not installed (scripts/eggs.bash not found or $BASH_COMPLETION_DIR missing)"
fi

# Installa zsh completion
echo "Installing zsh completion..."
if [ -f "scripts/_eggs" ]; then
    # Crea directory zsh se non esiste
    sudo mkdir -p "$ZSH_COMPLETION_DIR"
    sudo cp scripts/_eggs "$ZSH_COMPLETION_DIR/"
    echo "SUCCESS: Zsh completion installed to $ZSH_COMPLETION_DIR/_eggs"
else
    echo "WARNING: Zsh completion not installed (scripts/_eggs not found)"
fi

echo ""
echo "SUCCESS: Penguins Eggs installed system-wide!"
echo ""
echo "Components installed:"
echo "  - Main executable: $INSTALL_DIR/eggs"
if [ -f "scripts/eggs.bash" ]; then
    echo "  - Bash completion: $BASH_COMPLETION_DIR/eggs"
fi
if [ -f "scripts/_eggs" ]; then
    echo "  - Zsh completion: $ZSH_COMPLETION_DIR/_eggs"
fi
echo ""
echo "Usage:"
echo "  eggs [TAB]           # Auto-complete commands (bash/zsh)"
echo "  eggs produce [TAB]   # Auto-complete options"
echo "  sudo eggs [command]  # Works with sudo"
echo ""
echo "To activate completions:"
echo "  Bash: source ~/.bashrc or restart terminal"
echo "  Zsh:  source ~/.zshrc or restart terminal"