#!/bin/bash
set -e

# --- CONFIGURAZIONE ---
NODE_VERSION="22.21.0"
BOOTLOADERS_TAG="v25.11.27"
ARCH="x86_64"
APP_NAME="penguins-eggs"
CACHE_DIR="cache"

# Crea directory di cache se non esiste
mkdir -p "$CACHE_DIR"

echo "Building Penguins Eggs AppImage (ZSTD Edition)..."

# Funzione Helper Download
download_file() {
    local url="$1"
    local dest="$2"
    local name="$3"

    if [ -f "$dest" ]; then
        echo "Using cached $name."
        return 0
    fi

    echo "Downloading $name..."
    if command -v wget >/dev/null 2>&1; then
        if ! wget --no-check-certificate -nv --show-progress "$url" -O "$dest"; then
            echo "Error downloading $name."
            rm -f "$dest"
            return 1
        fi
    elif command -v curl >/dev/null 2>&1; then
        if ! curl -L -f -o "$dest" "$url"; then
            echo "Error downloading $name."
            rm -f "$dest"
            return 1
        fi
    else
        echo "Error: curl/wget not found."
        exit 1
    fi
}

VERSION=$(node -p "require('./package.json').version")
if [ -f "release" ]; then RELEASE=$(cat release | tr -d '[:space:]'); else RELEASE="1"; fi
FULL_VERSION="${VERSION}-${RELEASE}"

# Verifica build
if [ ! -f "dist/bin/dev.js" ]; then
    echo "ERROR: Build not found. Run: pnpm run build"
    exit 1
fi

# Verifica struttura
if [ ! -d "appimage" ]; then
    echo "ERROR: appimage directory missing."
    exit 1
fi

# Pulisci e crea struttura AppDir
rm -rf AppDir
mkdir -p AppDir/usr/lib/penguins-eggs
mkdir -p AppDir/usr/bin
mkdir -p AppDir/usr/share/applications
mkdir -p AppDir/usr/share/icons/hicolor/256x256/apps

# --- 1. GESTIONE TOOL (Fix Dinamico per go-appimage) ---
echo "Fetching latest go-appimagetool URL..."
TOOL_API_URL="https://api.github.com/repos/probonopd/go-appimage/releases/tags/continuous"
TOOL_URL=$(curl -s "$TOOL_API_URL" | grep "browser_download_url.*appimagetool-.*-x86_64.AppImage" | cut -d '"' -f 4 | head -n 1)

if [ -z "$TOOL_URL" ]; then
    echo "ERROR: Could not find download URL for go-appimagetool."
    exit 1
fi

echo "Found tool URL: $TOOL_URL"
TOOL_PATH="$CACHE_DIR/appimagetool-go-${ARCH}.AppImage"

if [ ! -f "$TOOL_PATH" ] || [ ! -s "$TOOL_PATH" ]; then
    download_file "$TOOL_URL" "$TOOL_PATH" "go-appimagetool"
    chmod +x "$TOOL_PATH"
else
    echo "Using cached go-appimagetool."
    chmod +x "$TOOL_PATH"
fi

# Copia file progetto
echo "Copying project files..."
for dir in dist node_modules assets addons bin conf dracut eui manpages mkinitcpio mkinitfs scripts src templates; do
    if [ -d "$dir" ]; then cp -r "$dir" AppDir/usr/lib/penguins-eggs/; fi
done

# --- GESTIONE NODE.JS ---
NODE_FILE="node-v$NODE_VERSION-linux-x64.tar.xz"
NODE_PATH="$CACHE_DIR/$NODE_FILE"
download_file "https://nodejs.org/dist/v$NODE_VERSION/$NODE_FILE" "$NODE_PATH" "Node.js"
tar -xf "$NODE_PATH"
mkdir -p AppDir/usr/lib/penguins-eggs/node
cp -r node-v$NODE_VERSION-linux-x64/* AppDir/usr/lib/penguins-eggs/node/
rm -rf node-v$NODE_VERSION-linux-x64

# --- GESTIONE BOOTLOADERS ---
BOOT_FILE="bootloaders-${BOOTLOADERS_TAG}.tar.gz"
BOOT_PATH="$CACHE_DIR/$BOOT_FILE"
download_file "https://github.com/pieroproietti/penguins-bootloaders/releases/download/${BOOTLOADERS_TAG}/bootloaders.tar.gz" "$BOOT_PATH" "bootloaders"
mkdir -p AppDir/usr/lib/penguins-eggs/bootloaders
tar -xzf "$BOOT_PATH" -C AppDir/usr/lib/penguins-eggs/bootloaders --strip-components=1

# --- COPIE METADATI ---
cp package.json AppDir/usr/lib/penguins-eggs/ 2>/dev/null || true
if [ -f "appimage/penguins-eggs.appdata.xml" ]; then
    mkdir -p AppDir/usr/share/metainfo
    sed -e "s|%VERSION%|$VERSION|g" -e "s|%DATE%|$(date +%Y-%m-%d)|g" "appimage/penguins-eggs.appdata.xml" > AppDir/usr/share/metainfo/net.penguins_eggs.eggs.appdata.xml
fi

cp appimage/AppRun AppDir/
chmod +x AppDir/AppRun

# Copia desktop e icona nella ROOT di AppDir (Richiesto da go-appimage)
cp appimage/net.penguins_eggs.eggs.desktop AppDir/
cp appimage/penguins-eggs.png AppDir/

# Copia path standard
cp appimage/net.penguins_eggs.eggs.desktop AppDir/usr/share/applications/
cp appimage/penguins-eggs.png AppDir/usr/share/icons/hicolor/256x256/apps/

ln -sf ../lib/penguins-eggs/dist/bin/dev.js AppDir/usr/bin/eggs
cp -r appimage/distro-packages AppDir/

# --- 2. CREAZIONE APPIMAGE (ZSTD) ---
echo "Creating AppImage with ZSTD..."

TARGET_NAME="${APP_NAME}-${FULL_VERSION}-${ARCH}.AppImage"
rm -f "${APP_NAME}"*.AppImage

# FIX: Passiamo ARCH=$ARCH davanti al comando per forzare l'architettura
ARCH=$ARCH "$TOOL_PATH" -s AppDir

# --- 3. RINOMINA ---
GENERATED_FILE=$(ls -t *.AppImage | grep -v "appimagetool" | head -n 1)

if [ -n "$GENERATED_FILE" ]; then
    mv "$GENERATED_FILE" "$TARGET_NAME"
    chmod +x "$TARGET_NAME"
    
    echo "------------------------------------------------"
    echo "SUCCESS! ZSTD AppImage created."
    echo "File: $TARGET_NAME"
    echo "Size: $(du -h "$TARGET_NAME" | cut -f1)"
    echo "------------------------------------------------"
else
    echo "ERROR: AppImage generation failed. No output file found."
    exit 1
fi
