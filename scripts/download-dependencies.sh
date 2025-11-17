#!/bin/bash
set -e

echo "📦 Downloading universal binaries for AppImage..."

DEPS_DIR="appimage-deps"
mkdir -p "$DEPS_DIR"

# Funzione per scaricare binari statici o AppImage
download_binary() {
    local name=$1
    local url=$2
    local output="$DEPS_DIR/$name"
    
    echo "📥 Downloading $name..."
    wget -q "$url" -O "$output"
    chmod +x "$output"
}

# Binari statici universali
download_binary "curl" "https://github.com/moparisthebest/static-curl/releases/download/v7.88.1/curl-amd64"
download_binary "jq" "https://github.com/jqlang/jq/releases/download/jq-1.7/jq-linux-amd64"

# Per altri tool, possiamo usare AppImage o binari statici
download_binary "rsync" "https://github.com/rclone/rclone/releases/download/v1.63.1/rclone-v1.63.1-linux-amd64.zip"

echo "✅ Dependencies downloaded to $DEPS_DIR/"
