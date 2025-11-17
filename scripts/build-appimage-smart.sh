#!/bin/bash
set -e

echo "Building Penguins Eggs Smart AppImage..."

APP_NAME="penguins-eggs"
VERSION=$(node -p "require('./package.json').version")
ARCH="x86_64"

# Verifica build
if [ ! -f "dist/bin/dev.js" ]; then
    echo "ERROR: Build not found. Run: pnpm run build"
    exit 1
fi

echo "SUCCESS: Build found: dist/bin/dev.js"

# Pulisci e crea struttura
rm -rf AppDir
mkdir -p AppDir/usr/lib/penguins-eggs
mkdir -p AppDir/usr/bin

# Scarica appimagetool
if [ ! -f "appimagetool" ]; then
    echo "Downloading appimagetool..."
    wget -q https://github.com/AppImage/AppImageKit/releases/download/continuous/appimagetool-${ARCH}.AppImage -O appimagetool
    chmod +x appimagetool
fi

# Copia il progetto - VERIFICA OGNI DIRECTORY
echo "Copying project files..."
for dir in dist node_modules assets addons bin conf dracut manpages mkinitcpio mkinitfs scripts src templates; do
    if [ -d "$dir" ]; then
        echo "  Copying: $dir"
        cp -r "$dir" AppDir/usr/lib/penguins-eggs/
    else
        echo "  WARNING: Directory $dir not found"
    fi
done

# Copia file essenziali
cp package.json AppDir/usr/lib/penguins-eggs/ 2>/dev/null || echo "WARNING: package.json not found"

# VERIFICA CRITICA che i file siano stati copiati
echo ""
echo "Verifying critical files..."
CRITICAL_ERROR=0

if [ ! -f "AppDir/usr/lib/penguins-eggs/dist/bin/dev.js" ]; then
    echo "ERROR: dist/bin/dev.js not found in AppDir!"
    CRITICAL_ERROR=1
else
    echo "SUCCESS: dist/bin/dev.js found"
fi

if [ ! -d "AppDir/usr/lib/penguins-eggs/node_modules" ]; then
    echo "ERROR: node_modules directory not found in AppDir!"
    CRITICAL_ERROR=1
else
    echo "SUCCESS: node_modules found ($(ls AppDir/usr/lib/penguins-eggs/node_modules | wc -l) items)"
fi

if [ $CRITICAL_ERROR -eq 1 ]; then
    echo "CRITICAL: Required files missing. Cannot build AppImage."
    exit 1
fi

# Crea AppRun SEMPLIFICATO - prima risolviamo l'esecuzione base
cat > AppDir/AppRun << 'EOF'
#!/bin/bash
set -e

HERE="$(dirname "$(readlink -f "$0")")"
APP_DIR="$HERE/usr/lib/penguins-eggs"

echo "=== PENGUINS EGGS APPIMAGE ==="
echo "AppDir: $APP_DIR"

# Setup ambiente base
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:$HERE/usr/bin"

# Verifica NODE_MODULES
if [ -d "$APP_DIR/node_modules" ]; then
    export NODE_PATH="$APP_DIR/node_modules"
    echo "NODE_PATH set: $NODE_PATH"
else
    echo "WARNING: node_modules not found at $APP_DIR/node_modules"
    echo "Contents of AppDir:"
    ls -la "$APP_DIR/" 2>/dev/null | head -10
fi

# Verifica file essenziali
if [ ! -f "$APP_DIR/dist/bin/dev.js" ]; then
    echo "ERROR: dist/bin/dev.js not found!"
    echo "Available files in dist/bin/:"
    ls -la "$APP_DIR/dist/bin/" 2>/dev/null || echo "dist/bin/ not found"
    exit 1
fi

if ! command -v node >/dev/null 2>&1; then
    echo "ERROR: Node.js not found in system!"
    exit 1
fi

echo "Node.js: $(node --version)"
echo "Starting Penguins Eggs..."
echo "================================"

# Esegui direttamente - niente dipendenze check per ora
cd "$APP_DIR"
exec node "dist/bin/dev.js" "$@"
EOF
chmod +x AppDir/AppRun

# Crea .desktop e icona
mkdir -p AppDir/usr/share/applications
cat > AppDir/usr/share/applications/penguins-eggs.desktop << EOF
[Desktop Entry]
Name=Penguins Eggs
Comment=CLI tool for Linux remastering
Exec=eggs
Icon=penguins-eggs
Type=Application
Categories=System;
Terminal=true
Keywords=remaster;live;iso;linux;
EOF

mkdir -p AppDir/usr/share/icons/hicolor/256x256/apps
cat > AppDir/usr/share/icons/hicolor/256x256/apps/penguins-eggs.svg << 'EOF'
<svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
  <rect width="256" height="256" fill="#4A90E2"/>
  <circle cx="128" cy="100" r="45" fill="white"/>
  <ellipse cx="128" cy="190" rx="65" ry="45" fill="white"/>
  <text x="128" y="110" text-anchor="middle" font-family="Arial" font-size="38" fill="#4A90E2">EGGS</text>
  <text x="128" y="235" text-anchor="middle" font-family="Arial" font-size="20" fill="white" font-weight="bold">Penguins</text>
</svg>
EOF

if command -v convert &> /dev/null; then
    convert -background none -size 256x256 \
            AppDir/usr/share/icons/hicolor/256x256/apps/penguins-eggs.svg \
            AppDir/usr/share/icons/hicolor/256x256/apps/penguins-eggs.png
    rm AppDir/usr/share/icons/hicolor/256x256/apps/penguins-eggs.svg
else
    mv AppDir/usr/share/icons/hicolor/256x256/apps/penguins-eggs.svg \
       AppDir/usr/share/icons/hicolor/256x256/apps/penguins-eggs.png
fi

# Link simbolici
ln -sf usr/share/icons/hicolor/256x256/apps/penguins-eggs.png AppDir/penguins-eggs.png
ln -sf usr/share/applications/penguins-eggs.desktop AppDir/penguins-eggs.desktop
ln -sf ../AppRun AppDir/usr/bin/eggs

# Crea AppImage
echo ""
echo "Creating Smart AppImage..."
ARCH=$ARCH ./appimagetool AppDir "${APP_NAME}-${VERSION}-smart-${ARCH}.AppImage"

# Test
echo ""
echo "Testing Smart AppImage..."
chmod +x "${APP_NAME}-${VERSION}-smart-${ARCH}.AppImage"

if ./${APP_NAME}-${VERSION}-smart-${ARCH}.AppImage --version; then
    echo "SUCCESS: AppImage working correctly!"
else
    echo "ERROR: AppImage test failed"
    exit 1
fi

echo ""
echo "AppImage created: ${APP_NAME}-${VERSION}-smart-${ARCH}.AppImage"
echo "Size: $(du -h "${APP_NAME}-${VERSION}-smart-${ARCH}.AppImage" | cut -f1)"