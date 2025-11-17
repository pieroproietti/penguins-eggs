#!/bin/bash
set -e

echo "🛠️ Building Penguins Eggs AppImage (Ultra simple method)..."

APP_NAME="penguins-eggs"
VERSION=$(node -p "require('./package.json').version")
ARCH="x86_64"

# Verifica build
if [ ! -f "dist/bin/dev.js" ]; then
    echo "❌ Build not found. Run: pnpm run build"
    exit 1
fi

echo "✅ Build found: dist/bin/dev.js"

# Pulisci
rm -rf AppDir
mkdir -p AppDir/usr/lib/penguins-eggs

# Scarica appimagetool
if [ ! -f "appimagetool" ]; then
    echo "📥 Downloading appimagetool..."
    wget -q https://github.com/AppImage/AppImageKit/releases/download/continuous/appimagetool-${ARCH}.AppImage -O appimagetool
    chmod +x appimagetool
fi

# Copia MANUALMENTE solo le directory necessarie
echo "📦 Copying files manually..."
for dir in dist node_modules assets addons bin conf dracut manpages mkinitcpio mkinitfs scripts src templates; do
    if [ -d "$dir" ]; then
        echo "  📁 $dir"
        cp -r "$dir" AppDir/usr/lib/penguins-eggs/
    fi
done

# Copia file di configurazione
cp package.json AppDir/usr/lib/penguins-eggs/ 2>/dev/null || true
cp pnpm-lock.yaml AppDir/usr/lib/penguins-eggs/ 2>/dev/null || true

# Crea AppRun
cat > AppDir/AppRun << 'EOF'
#!/bin/bash
HERE="$(dirname "$(readlink -f "$0")")"
APP_DIR="$HERE/usr/lib/penguins-eggs"
export NODE_PATH="$APP_DIR/node_modules"
cd "$APP_DIR"
exec node "$APP_DIR/dist/bin/dev.js" "$@"
EOF
chmod +x AppDir/AppRun

# Crea .desktop e icona
mkdir -p AppDir/usr/share/applications
cat > AppDir/usr/share/applications/penguins-eggs.desktop << EOF
[Desktop Entry]
Name=Penguins Eggs
Comment=Utility CLI per creare distribuzioni Linux live personalizzate
Exec=eggs
Icon=penguins-eggs
Type=Application
Categories=System;
Terminal=true
Keywords=remaster;live;iso;linux;
EOF

mkdir -p AppDir/usr/share/icons/hicolor/256x256/apps
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" | base64 -d > AppDir/usr/share/icons/hicolor/256x256/apps/penguins-eggs.png

# Crea i link simbolici - CREA PRIMA LA DIRECTORY usr/bin!
mkdir -p AppDir/usr/bin
ln -sf usr/share/icons/hicolor/256x256/apps/penguins-eggs.png AppDir/penguins-eggs.png
ln -sf usr/share/applications/penguins-eggs.desktop AppDir/penguins-eggs.desktop
ln -sf ../AppRun AppDir/usr/bin/eggs

# Crea AppImage
echo "🎯 Creating AppImage..."
ARCH=$ARCH ./appimagetool AppDir "${APP_NAME}-${VERSION}-${ARCH}.AppImage"

# Test finale
echo "🧪 Testing AppImage..."
chmod +x "${APP_NAME}-${VERSION}-${ARCH}.AppImage"

if ./${APP_NAME}-${VERSION}-${ARCH}.AppImage --version; then
    echo "🎉 AppImage tested successfully!"
    echo ""
    echo "🚀 You can now use: ./${APP_NAME}-${VERSION}-${ARCH}.AppImage [command]"
    echo "💡 Examples:"
    echo "   ./${APP_NAME}-${VERSION}-${ARCH}.AppImage --help"
    echo "   ./${APP_NAME}-${VERSION}-${ARCH}.AppImage produce --fast"
    echo "   ./${APP_NAME}-${VERSION}-${ARCH}.AppImage calamares --help"
else
    echo "⚠️ AppImage created but test failed"
    echo "💡 Try running: ./${APP_NAME}-${VERSION}-${ARCH}.AppImage --help"
fi

echo ""
echo "✅ AppImage created: ${APP_NAME}-${VERSION}-${ARCH}.AppImage"
echo "📏 Size: $(du -h "${APP_NAME}-${VERSION}-${ARCH}.AppImage" | cut -f1)"
