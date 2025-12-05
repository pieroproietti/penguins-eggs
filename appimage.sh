#!/bin/bash
set -e

# --- CONFIGURAZIONE VERSIONI ---
# Usa una versione specifica per garantire stabilità
NODE_VERSION="22.13.1"
BOOTLOADERS_TAG="v25.11.27"
ARCH="x86_64"
APP_NAME="penguins-eggs"
CACHE_DIR="cache"

# Crea directory di cache se non esiste
mkdir -p "$CACHE_DIR"

echo "Building Penguins Eggs AppImage..."

# Funzione Helper per il download sicuro
download_file() {
    local url="$1"
    local dest="$2"
    local name="$3"

    if [ -f "$dest" ]; then
        echo "Using cached $name."
        return 0
    fi

    echo "Downloading $name..."
    # Prova con wget (mostra progress bar, mostra errori)
    if command -v wget >/dev/null 2>&1; then
        if ! wget --no-check-certificate -nv --show-progress "$url" -O "$dest"; then
            echo "Error downloading $name with wget."
            rm -f "$dest" # Rimuove file parziale
            return 1
        fi
    # Fallback su curl
    elif command -v curl >/dev/null 2>&1; then
        if ! curl -L -f -o "$dest" "$url"; then
            echo "Error downloading $name with curl."
            rm -f "$dest"
            return 1
        fi
    else
        echo "Error: Neither wget nor curl found."
        exit 1
    fi
}

VERSION=$(node -p "require('./package.json').version")

# --- LETTURA FILE RELEASE ---
if [ -f "release" ]; then
    RELEASE=$(cat release | tr -d '[:space:]')
else
    RELEASE="1"
fi

FULL_VERSION="${VERSION}-${RELEASE}"

# Verifica build
if [ ! -f "dist/bin/dev.js" ]; then
    echo "ERROR: Build not found. Run: pnpm run build"
    exit 1
fi
echo "SUCCESS: Build found: dist/bin/dev.js"

# Verifica struttura base
if [ ! -d "appimage" ] || [ ! -f "appimage/AppRun" ] || [ ! -f "appimage/net.penguins_eggs.eggs.desktop" ]; then
    echo "ERROR: appimage directory structure incomplete."
    exit 1
fi

# Pulisci e crea struttura AppDir
rm -rf AppDir
mkdir -p AppDir/usr/lib/penguins-eggs
mkdir -p AppDir/usr/bin
mkdir -p AppDir/usr/share/applications
mkdir -p AppDir/usr/share/icons/hicolor/256x256/apps

# --- GESTIONE APPIMAGETOOL ---
TOOL_URL="https://github.com/AppImage/AppImageKit/releases/download/continuous/appimagetool-${ARCH}.AppImage"
TOOL_PATH="$CACHE_DIR/appimagetool-${ARCH}.AppImage"

# Check integrità basico (dimensione > 0)
if [ -f "$TOOL_PATH" ] && [ ! -s "$TOOL_PATH" ]; then
    rm "$TOOL_PATH"
fi

download_file "$TOOL_URL" "$TOOL_PATH" "appimagetool"
chmod +x "$TOOL_PATH"
cp "$TOOL_PATH" appimagetool
chmod +x appimagetool

# Copia il progetto
echo "Copying project files..."
for dir in dist node_modules assets addons bin conf dracut eui manpages mkinitcpio mkinitfs scripts src templates; do
    if [ -d "$dir" ]; then
        cp -r "$dir" AppDir/usr/lib/penguins-eggs/
    fi
done

# --- GESTIONE NODE.JS ---
# URL corretto puntando alla cartella della versione specifica, non 'latest'
NODE_FILE="node-v$NODE_VERSION-linux-x64.tar.xz"
NODE_URL="https://nodejs.org/dist/v$NODE_VERSION/$NODE_FILE"
NODE_PATH="$CACHE_DIR/$NODE_FILE"

# Check integrità archivio
if [ -f "$NODE_PATH" ]; then
    if ! tar -tJf "$NODE_PATH" &> /dev/null; then
        echo "Cached Node.js archive is corrupted. Deleting..."
        rm "$NODE_PATH"
    fi
fi

download_file "$NODE_URL" "$NODE_PATH" "Node.js v$NODE_VERSION"

echo "Extracting Node.js..."
tar -xf "$NODE_PATH"
mkdir -p AppDir/usr/lib/penguins-eggs/node
cp -r node-v$NODE_VERSION-linux-x64/* AppDir/usr/lib/penguins-eggs/node/
rm -rf node-v$NODE_VERSION-linux-x64

# --- GESTIONE BOOTLOADERS ---
BOOT_URL="https://github.com/pieroproietti/penguins-bootloaders/releases/download/${BOOTLOADERS_TAG}/bootloaders.tar.gz"
BOOT_FILE="bootloaders-${BOOTLOADERS_TAG}.tar.gz"
BOOT_PATH="$CACHE_DIR/$BOOT_FILE"

if [ -f "$BOOT_PATH" ]; then
    if ! tar -tzf "$BOOT_PATH" &> /dev/null; then
        echo "Cached bootloaders archive is corrupted. Deleting..."
        rm "$BOOT_PATH"
    fi
fi

download_file "$BOOT_URL" "$BOOT_PATH" "bootloaders"

mkdir -p AppDir/usr/lib/penguins-eggs/bootloaders
echo "Extracting bootloaders..."
tar -xzf "$BOOT_PATH" -C AppDir/usr/lib/penguins-eggs/bootloaders --strip-components=1

# Copia package.json
cp package.json AppDir/usr/lib/penguins-eggs/ 2>/dev/null || true

# --- METADATI E INTEGRAZIONE ---
if [ -f "appimage/penguins-eggs.appdata.xml" ]; then
    mkdir -p AppDir/usr/share/metainfo
    CURRENT_DATE=$(date +%Y-%m-%d)
    sed -e "s|%VERSION%|$VERSION|g" \
        -e "s|%DATE%|$CURRENT_DATE|g" \
        "appimage/penguins-eggs.appdata.xml" > AppDir/usr/share/metainfo/net.penguins_eggs.eggs.appdata.xml
fi

cp appimage/AppRun AppDir/
chmod +x AppDir/AppRun

cp appimage/net.penguins_eggs.eggs.desktop AppDir/
cp appimage/net.penguins_eggs.eggs.desktop AppDir/usr/share/applications/

cp appimage/penguins-eggs.png AppDir/
cp appimage/penguins-eggs.png AppDir/usr/share/icons/hicolor/256x256/apps/

# Link per l'eseguibile
ln -sf ../lib/penguins-eggs/dist/bin/dev.js AppDir/usr/bin/eggs

# Copia driver
cp -r appimage/distro-packages AppDir/

# --- CREAZIONE APPIMAGE ---
echo "Creating AppImage..."
ARCH=$ARCH ./appimagetool AppDir "${APP_NAME}-${FULL_VERSION}-${ARCH}.AppImage"

# Test Veloce
echo "AppImage created: ${APP_NAME}-${FULL_VERSION}-${ARCH}.AppImage"
echo "Size: $(du -h "${APP_NAME}-${FULL_VERSION}-${ARCH}.AppImage" | cut -f1)"

# Pulizia finale (opzionale)
rm -f appimagetool