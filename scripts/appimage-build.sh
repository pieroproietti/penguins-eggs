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

# Bootloaders
mkdir -p AppDir/usr/lib/penguins-eggs/bootloaders
echo "Downloading bootloaders..."
wget -O bootloaders.tar.gz "https://github.com/pieroproietti/penguins-bootloaders/releases/download/v25.9.8/bootloaders.tar.gz"
echo "Extracting bootloaders..."
tar -xzf bootloaders.tar.gz -C AppDir/usr/lib/penguins-eggs/bootloaders --strip-components=1
rm -f bootloaders.tar.gz

# Copia package.json
cp package.json AppDir/usr/lib/penguins-eggs/ 2>/dev/null || true

# Crea AppRun
cat > AppDir/AppRun << 'EOF'
#!/bin/bash
set -e

HERE="$(dirname "$(readlink -f "$0")")"
APP_DIR="$HERE/usr/lib/penguins-eggs"

export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:$HERE/usr/bin"
export NODE_PATH="$APP_DIR/node_modules"

# Usa una directory scrivibile per il file first-run
FIRST_RUN_DIR="${XDG_CACHE_HOME:-$HOME/.cache}/penguins-eggs"
FIRST_RUN_FILE="$FIRST_RUN_DIR/first-run"

# Setup automatico al primo avvio
if [ ! -f "$FIRST_RUN_FILE" ]; then
    echo "First run detected. Creating wrapper in ~/.local/bin/..."
    
    # Crea wrapper per eseguire 'eggs' direttamente
    mkdir -p "$HOME/.local/bin"
    cat > "$HOME/.local/bin/eggs" << 'WRAPPER'
#!/bin/bash
exec "$(dirname "$(readlink -f "$0")")/../.AppImage" "$@"
WRAPPER
    chmod +x "$HOME/.local/bin/eggs"
    echo "Wrapper created at: $HOME/.local/bin/eggs"
    echo "You can now run 'eggs' directly from terminal"
    
    # Setup check
    cd "$APP_DIR"
    node -e "
        const {Setup} = require('./dist/classes/setup.js');
        const setup = new Setup();
        if (!setup.checkPrerequisites()) {
            console.log('WARNING: System needs setup for full functionality.');
            console.log('Run: eggs setup');
            console.log('Continuing with basic features...');
        }
    " || echo "Setup check failed, continuing with basic features..."
    
    mkdir -p "$FIRST_RUN_DIR"
    touch "$FIRST_RUN_FILE"
fi

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

# Crea icona
mkdir -p AppDir/usr/share/icons/hicolor/256x256/apps
if command -v convert &> /dev/null; then
    convert -size 256x256 xc:#4A90E2 \
            -fill white -gravity center -pointsize 24 -annotate +0+0 "EGGS\nPenguins" \
            AppDir/usr/share/icons/hicolor/256x256/apps/penguins-eggs.png
else
    # Crea un'icona semplice con base64
    echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" | base64 -d > AppDir/usr/share/icons/hicolor/256x256/apps/penguins-eggs.png 2>/dev/null || true
    echo "WARNING: Using minimal fallback icon"
fi

# COPIA i file nella ROOT di AppDir (non link simbolici)
cp AppDir/usr/share/applications/penguins-eggs.desktop AppDir/
cp AppDir/usr/share/icons/hicolor/256x256/apps/penguins-eggs.png AppDir/

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