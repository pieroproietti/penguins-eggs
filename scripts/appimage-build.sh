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

# Verifica FUSE
echo "Checking system requirements..."
if ! ldconfig -p | grep -q libfuse.so.2; then
    echo "WARNING: libfuse2 not found. AppImage may not run properly."
    echo "Please install FUSE:"
    echo "  Debian/Ubuntu: sudo apt-get install fuse libfuse2"
    echo "  Fedora:        sudo dnf install fuse fuse-libs"
    echo "  Arch:          sudo pacman -S fuse2"
    echo ""
    echo "Continuing with build anyway..."
fi

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

# Copia il progetto
echo "Copying project files..."
for dir in dist node_modules assets addons bin conf dracut manpages mkinitcpio mkinitfs scripts src templates; do
    if [ -d "$dir" ]; then
        echo "  Copying: $dir"
        cp -r "$dir" AppDir/usr/lib/penguins-eggs/
    fi
done

cp package.json AppDir/usr/lib/penguins-eggs/ 2>/dev/null || true

# Crea AppRun
cat > AppDir/AppRun << 'EOF'
#!/bin/bash
set -e

HERE="$(dirname "$(readlink -f "$0")")"
APP_DIR="$HERE/usr/lib/penguins-eggs"

# Setup ambiente
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:$HERE/usr/bin"
export NODE_PATH="$APP_DIR/node_modules"

# Esegui penguins-eggs
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
echo "Creating AppImage..."
ARCH=$ARCH ./appimagetool AppDir "${APP_NAME}-${VERSION}-${ARCH}.AppImage"

# Test (se FUSE è installato)
echo "Testing AppImage..."
chmod +x "${APP_NAME}-${VERSION}-${ARCH}.AppImage"

if ldconfig -p | grep -q libfuse.so.2; then
    if ./${APP_NAME}-${VERSION}-${ARCH}.AppImage --version; then
        echo "SUCCESS: AppImage working correctly!"
    else
        echo "WARNING: AppImage test failed (may be due to missing FUSE)"
    fi
else
    echo "WARNING: Cannot test AppImage without FUSE"
    echo "Install: sudo pacman -S fuse2"
fi

echo ""
echo "AppImage created: ${APP_NAME}-${VERSION}-${ARCH}.AppImage"
echo "Size: $(du -h "${APP_NAME}-${VERSION}-${ARCH}.AppImage" | cut -f1)"