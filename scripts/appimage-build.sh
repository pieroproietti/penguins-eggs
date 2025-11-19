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

if [ ! -f "appimage/penguins-eggs.desktop" ]; then
    echo "ERROR: appimage/penguins-eggs.desktop not found"
    exit 1
fi

# Verifica FUSE
echo "Checking system requirements..."
if ! ldconfig -p | grep -q libfuse.so.2; then
    echo "WARNING: libfuse2 not found. AppImage may not run properly."
    echo "Please install FUSE:"
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
for dir in dist node_modules assets addons bin conf dracut mkinitcpio mkinitfs scripts src templates; do
    if [ -d "$dir" ]; then
        echo "  Copying: $dir"
        cp -r "$dir" AppDir/usr/lib/penguins-eggs/
    fi
done

# Bootloaders
mkdir -p AppDir/usr/lib/penguins-eggs/bootloaders
echo "Downloading bootloaders..."
wget -O bootloaders.tar.gz "https://github.com/pieroproietti/penguins-bootloaders/releases/download/v25.9.8/bootloaders.tar.gz"
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
    CURRENT_DATE=$(date +%Y-%m-%d)
    sed -e "s|%VERSION%|$VERSION|g" \
        -e "s|%DATE%|$CURRENT_DATE|g" \
        "appimage/penguins-eggs.appdata.xml" > AppDir/usr/share/metainfo/penguins-eggs.appdata.xml
    
    echo "AppData metadata updated: version $VERSION, date $CURRENT_DATE"
else
    echo "WARNING: AppData file not found at appimage/penguins-eggs.appdata.xml"
fi


# AppRun
cp appimage/AppRun AppDir/
chmod +x AppDir/AppRun

# penguins-eggs.desktop
cp appimage/penguins-eggs.desktop AppDir/
cp appimage/penguins-eggs.desktop AppDir/usr/share/applications/

# penguins-eggs.png
cp appimage/penguins-eggs.png AppDir/
cp appimage/penguins-eggs.png AppDir/usr/share/icons/hicolor/256x256/apps/

# Link per l'eseguibile
ln -sf ../lib/penguins-eggs/dist/bin/dev.js AppDir/usr/bin/eggs

# Verifica file richiesti
echo "Checking required AppDir files:"
ls -la AppDir/AppRun
ls -la AppDir/penguins-eggs.desktop
ls -la AppDir/penguins-eggs.png

# Crea AppImage
echo "Creating AppImage..."
ARCH=$ARCH ./appimagetool AppDir "${APP_NAME}-${VERSION}-${ARCH}.AppImage"

# Test
echo "Testing AppImage..."
chmod +x "${APP_NAME}-${VERSION}-${ARCH}.AppImage"

if command -v fusermount &> /dev/null || command -v fusermount3 &> /dev/null; then
    if ./"${APP_NAME}-${VERSION}-${ARCH}.AppImage" --version; then
        echo "SUCCESS: AppImage working correctly!"
    else
        echo "WARNING: AppImage test failed"
    fi
else
    echo "WARNING: Cannot test AppImage without FUSE"
fi

echo ""
echo "AppImage created: ${APP_NAME}-${VERSION}-${ARCH}.AppImage"
echo "Size: $(du -h "${APP_NAME}-${VERSION}-${ARCH}.AppImage" | cut -f1)"