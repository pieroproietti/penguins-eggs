#!/bin/bash
set -e

# --- CONFIGURAZIONE ---
NODE_VERSION="22.21.0"
BOOTLOADERS_TAG="v26.1.16"
ARCH="x86_64"
APP_NAME="penguins-eggs"
CACHE_DIR="cache"

# --- COMPRESSIONE: GZIP ---
# Gzip è veloce per lo sviluppo e 100% compatibile con tutti i runtime.
# Risolve l'errore "supports only xz, zlib".
COMP_METHOD="gzip"

# Verifica dipendenza
if ! command -v mksquashfs >/dev/null 2>&1; then
    echo "ERROR: 'mksquashfs' not found. Install squashfs-tools."
    exit 1
fi

mkdir -p "$CACHE_DIR"
echo "Building Penguins Eggs AppImage (GZIP Dev Edition)..."

download_file() {
    local url="$1"
    local dest="$2"
    local name="$3"
    if [ -f "$dest" ]; then echo "Using cached $name."; return 0; fi
    echo "Downloading $name..."
    if command -v wget >/dev/null 2>&1; then
        wget --no-check-certificate -nv --show-progress "$url" -O "$dest" || { rm -f "$dest"; return 1; }
    elif command -v curl >/dev/null 2>&1; then
        curl -L -f -o "$dest" "$url" || { rm -f "$dest"; return 1; }
    else
        echo "Error: curl/wget not found."; exit 1
    fi
}

VERSION=$(node -p "require('./package.json').version")
if [ -f "release" ]; then RELEASE=$(cat release | tr -d '[:space:]'); else RELEASE="1"; fi
FULL_VERSION="${VERSION}-${RELEASE}"

# Verifica build
if [ ! -f "dist/bin/dev.js" ]; then echo "ERROR: Build not found."; exit 1; fi
if [ ! -d "appimage" ]; then echo "ERROR: appimage dir missing."; exit 1; fi

# Pulisci e crea struttura
rm -rf AppDir
mkdir -p AppDir/usr/lib/penguins-eggs
mkdir -p AppDir/usr/bin
mkdir -p AppDir/usr/share/applications
mkdir -p AppDir/usr/share/icons/hicolor/256x256/apps

# --- 1. PREPARAZIONE RUNTIME STANDARD (Compatibile) ---
# Usiamo il runtime C classico che supporta GZIP
RUNTIME_URL="https://github.com/AppImage/AppImageKit/releases/download/continuous/runtime-${ARCH}"
RUNTIME_PATH="$CACHE_DIR/runtime-${ARCH}"

download_file "$RUNTIME_URL" "$RUNTIME_PATH" "runtime"
chmod +x "$RUNTIME_PATH"
cp "$RUNTIME_PATH" runtime

# Copia file progetto
echo "Copying project files..."
for dir in dist node_modules assets addons bin conf dracut eui manpages mkinitcpio mkinitfs scripts src templates; do
    if [ -d "$dir" ]; then cp -r "$dir" AppDir/usr/lib/penguins-eggs/; fi
done

# --- NODE.JS ---
NODE_FILE="node-v$NODE_VERSION-linux-x64.tar.xz"
NODE_PATH="$CACHE_DIR/$NODE_FILE"
download_file "https://nodejs.org/dist/v$NODE_VERSION/$NODE_FILE" "$NODE_PATH" "Node.js"
tar -xf "$NODE_PATH"
mkdir -p AppDir/usr/lib/penguins-eggs/node
cp -r node-v$NODE_VERSION-linux-x64/* AppDir/usr/lib/penguins-eggs/node/
rm -rf node-v$NODE_VERSION-linux-x64

# --- BOOTLOADERS ---
BOOT_FILE="bootloaders-${BOOTLOADERS_TAG}.tar.gz"
BOOT_PATH="$CACHE_DIR/$BOOT_FILE"
download_file "https://github.com/pieroproietti/penguins-bootloaders/releases/download/${BOOTLOADERS_TAG}/bootloaders.tar.gz" "$BOOT_PATH" "bootloaders"
mkdir -p AppDir/usr/lib/penguins-eggs/bootloaders
tar -xzf "$BOOT_PATH" -C AppDir/usr/lib/penguins-eggs/bootloaders --strip-components=1

# --- CONFIGURAZIONE FILE ---
cp package.json AppDir/usr/lib/penguins-eggs/ 2>/dev/null || true
if [ -f "appimage/penguins-eggs.appdata.xml" ]; then
    mkdir -p AppDir/usr/share/metainfo
    sed -e "s|%VERSION%|$VERSION|g" -e "s|%DATE%|$(date +%Y-%m-%d)|g" "appimage/penguins-eggs.appdata.xml" > AppDir/usr/share/metainfo/net.penguins_eggs.eggs.appdata.xml
fi

cp appimage/AppRun AppDir/
chmod +x AppDir/AppRun
cp appimage/net.penguins_eggs.eggs.desktop AppDir/usr/share/applications/
cp appimage/penguins-eggs.png AppDir/usr/share/icons/hicolor/256x256/apps/
ln -sf ../lib/penguins-eggs/dist/bin/dev.js AppDir/usr/bin/eggs
cp -r appimage/distro-packages AppDir/

# --- 2. CREAZIONE APPIMAGE (Metodo Manuale GZIP) ---
echo "Creating filesystem ($COMP_METHOD)..."
TARGET_NAME="${APP_NAME}-${FULL_VERSION}-${ARCH}.AppImage"
rm -f "$TARGET_NAME" data.squashfs

# Creiamo il file system usando mksquashfs e GZIP
mksquashfs AppDir data.squashfs -root-owned -noappend -comp "$COMP_METHOD" -b 1M

# Uniamo Runtime + Filesystem
echo "Assembling AppImage..."
cat runtime data.squashfs > "$TARGET_NAME"
chmod +x "$TARGET_NAME"

# Pulizia
rm -f data.squashfs runtime

echo "------------------------------------------------"
echo "SUCCESS! AppImage created (GZIP)."
echo "File: $TARGET_NAME"
echo "Size: $(du -h "$TARGET_NAME" | cut -f1)"
echo "------------------------------------------------"
