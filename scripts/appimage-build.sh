#!/bin/bash
set -e

echo "Building Penguins Eggs AppImage..."

APP_NAME="penguins-eggs"
VERSION=$(node -p "require('./package.json').version")
ARCH="x86_64"

# Verifica build
if [ ! -f "dist/bin/dev.js" ]; then
    echo "ERROR: Build not found. Run: pnpm run build"
    exit 1
fi

echo "SUCCESS: Build found: dist/bin/dev.js"

# Verifica esistenza cartella appimage
if [ ! -d "appimage" ]; then
    echo "ERROR: appimage/ directory not found"
    echo "Please create appimage/ with required files"
    exit 1
fi

# Verifica file richiesti in appimage/
if [ ! -f "appimage/AppRun" ]; then
    echo "ERROR: appimage/AppRun not found"
    exit 1
fi

if [ ! -f "appimage/net.penguins_eggs.eggs.desktop" ]; then
    echo "ERROR: appimage/net.penguins_eggs.eggs.desktop not found"
    exit 1
fi

# Verifica FUSE
echo "Checking system requirements..."
if ! ldconfig -p | grep -q libfuse.so.2; then
    echo "WARNING: libfuse2 not found. AppImage may not run properly."
    echo "Please install FUSE:"
    echo "  Alpine:        sudo apk add fuse"
    echo "  Arch:          sudo pacman -S fuse2"
    echo "  Debian/Ubuntu: sudo apt-get install fuse libfuse2"
    echo "  Fedora/RHEL:   sudo dnf install fuse fuse-libs"
    echo "  Opensuse:      sudo zypper install fuse fuse-libs"
    echo ""
    echo "Continuing with build anyway..."
fi

# Pulisci e crea struttura
rm -rf AppDir
mkdir -p AppDir/usr/lib/penguins-eggs
mkdir -p AppDir/usr/bin
mkdir -p AppDir/usr/share/applications
mkdir -p AppDir/usr/share/icons/hicolor/256x256/apps

# Scarica appimagetool
if [ ! -f "appimagetool" ]; then
    echo "Downloading appimagetool..."
    wget -q https://github.com/AppImage/AppImageKit/releases/download/continuous/appimagetool-${ARCH}.AppImage -O appimagetool
    chmod +x appimagetool
fi

# Copia il progetto
echo "Copying project files..."
for dir in dist node_modules assets addons bin conf dracut eui manpages mkinitcpio mkinitfs scripts src templates; do
    if [ -d "$dir" ]; then
        echo "  Copying: $dir"
        cp -r "$dir" AppDir/usr/lib/penguins-eggs/
    fi
done

# Scarica e installa Node.js
NODE_VERSION="22.21.1"
echo "Downloading Node.js v$NODE_VERSION..."
wget -q https://nodejs.org/dist/latest-v22.x/node-v$NODE_VERSION-linux-x64.tar.xz -O nodejs.tar.xz
tar -xf nodejs.tar.xz
mkdir -p AppDir/usr/lib/penguins-eggs/node
cp -r node-v$NODE_VERSION-linux-x64/* AppDir/usr/lib/penguins-eggs/node/
rm -rf node-v$NODE_VERSION-linux-x64 nodejs.tar.xz

# Bootloaders
mkdir -p AppDir/usr/lib/penguins-eggs/bootloaders
echo "Downloading bootloaders..."
wget -q -O bootloaders.tar.gz "https://github.com/pieroproietti/penguins-bootloaders/releases/download/v25.9.8/bootloaders.tar.gz"
echo "Extracting bootloaders..."
tar -xzf bootloaders.tar.gz -C AppDir/usr/lib/penguins-eggs/bootloaders --strip-components=1
rm -f bootloaders.tar.gz

# Copia package.json
cp package.json AppDir/usr/lib/penguins-eggs/ 2>/dev/null || true

# COPIA i file dall'appimage/

# Copia e aggiorna metadati AppData
if [ -f "appimage/penguins-eggs.appdata.xml" ]; then
    mkdir -p AppDir/usr/share/metainfo
    
    # Aggiorna automaticamente versione e data
    # NOTA: Salvo il file con il NUOVO nome ID per coerenza con AppStream
    CURRENT_DATE=$(date +%Y-%m-%d)
    sed -e "s|%VERSION%|$VERSION|g" \
        -e "s|%DATE%|$CURRENT_DATE|g" \
        "appimage/penguins-eggs.appdata.xml" > AppDir/usr/share/metainfo/net.penguins_eggs.eggs.appdata.xml
    
    echo "AppData metadata updated: version $VERSION, date $CURRENT_DATE"
else
    echo "WARNING: AppData file not found at appimage/penguins-eggs.appdata.xml"
fi


# AppRun
cp appimage/AppRun AppDir/
chmod +x AppDir/AppRun

# net.penguins_eggs.eggs.desktop
# Copia nella root (richiesto da AppImage) e in applications (richiesto da standard Linux)
cp appimage/net.penguins_eggs.eggs.desktop AppDir/
cp appimage/net.penguins_eggs.eggs.desktop AppDir/usr/share/applications/

# penguins-eggs.png
cp appimage/penguins-eggs.png AppDir/
cp appimage/penguins-eggs.png AppDir/usr/share/icons/hicolor/256x256/apps/

# Link per l'eseguibile
ln -sf ../lib/penguins-eggs/dist/bin/dev.js AppDir/usr/bin/eggs

# Copia i driver (meta-packages per varie distro)
cp -r appimage/distro-packages AppDir/

# Verifica file richiesti
echo "Checking required AppDir files:"
ls -la AppDir/AppRun
ls -la AppDir/net.penguins_eggs.eggs.desktop
ls -la AppDir/penguins-eggs.png

# Crea AppImage
echo "Creating AppImage..."
# Opzionale: Definisce l'architettura esplicitamente per appimagetool
ARCH=$ARCH ./appimagetool AppDir "${APP_NAME}-${VERSION}-${ARCH}.AppImage"

# Test
echo "Testing AppImage..."
chmod +x "${APP_NAME}-${VERSION}-${ARCH}.AppImage"

if command -v fusermount &> /dev/null || command -v fusermount3 &> /dev/null; then
    # Esegue un test veloce (verifica che parta)
    if ./"${APP_NAME}-${VERSION}-${ARCH}.AppImage" --version; then
        echo "SUCCESS: AppImage working correctly!"
    else
        echo "WARNING: AppImage test failed (exit code not 0)"
    fi
else
    echo "WARNING: Cannot test AppImage without FUSE"
fi

echo ""
echo "AppImage created: ${APP_NAME}-${VERSION}-${ARCH}.AppImage"
echo "Size: $(du -h "${APP_NAME}-${VERSION}-${ARCH}.AppImage" | cut -f1)"