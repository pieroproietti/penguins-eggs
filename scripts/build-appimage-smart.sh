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

# Copia il progetto
echo "Copying project files..."
for dir in dist node_modules assets addons bin conf dracut manpages mkinitcpio mkinitfs scripts src templates; do
    if [ -d "$dir" ]; then
        echo "  Copying: $dir"
        cp -r "$dir" AppDir/usr/lib/penguins-eggs/
    fi
done

cp package.json AppDir/usr/lib/penguins-eggs/ 2>/dev/null || true

# Verifica che i file siano stati copiati correttamente
echo "Verifying copied files..."
if [ ! -f "AppDir/usr/lib/penguins-eggs/dist/bin/dev.js" ]; then
    echo "ERROR: dist/bin/dev.js not copied to AppDir!"
    exit 1
fi

if [ ! -d "AppDir/usr/lib/penguins-eggs/node_modules" ]; then
    echo "ERROR: node_modules not copied to AppDir!"
    exit 1
fi

echo "SUCCESS: All files copied correctly"

# Crea AppRun con debug
cat > AppDir/AppRun << 'EOF'
#!/bin/bash
set -e

HERE="$(dirname "$(readlink -f "$0")")"
APP_DIR="$HERE/usr/lib/penguins-eggs"

echo "=== PENGUINS EGGS APPIMAGE DEBUG ==="
echo "HERE: $HERE"
echo "APP_DIR: $APP_DIR"
echo "PATH: $PATH"
echo "NODE_PATH: $NODE_PATH"
echo "================================"

# Setup ambiente
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:$HERE/usr/bin"
export NODE_PATH="$APP_DIR/node_modules"

echo "Penguins Eggs AppImage"
echo "Checking system dependencies..."

# Lista dipendenze CRITICHE
CRITICAL_TOOLS=(
    "mksquashfs:squashfs-tools"
    "xorriso:xorriso" 
    "rsync:rsync"
    "curl:curl"
    "jq:jq"
    "git:git"
    "parted:parted"
    "cryptsetup:cryptsetup"
    "mount:mount"
    "umount:mount"
    "mkfs.ext4:e2fsprogs"
    "mkfs.vfat:dosfstools"
    "grub-mkrescue:grub2-common"
)

# Lista dipendenze RACCOMANDATE
RECOMMENDED_TOOLS=(
    "lvm2:lvm2"
    "dmsetup:lvm2"
    "sshfs:sshfs"
    "gpg:gnupg"
    "ipxe:ipxe"
    "isolinux:syslinux"
    "pxelinux:syslinux"
)

# Funzione per verificare un tool
check_tool() {
    local tool=$1
    local package=$2
    local critical=$3
    
    if command -v "$tool" >/dev/null 2>&1; then
        if [ "$critical" = "1" ]; then
            echo "   [OK] $tool: $(command -v "$tool")"
        else
            echo "   [OK] $tool: available"
        fi
        return 0
    else
        if [ "$critical" = "1" ]; then
            echo "   [MISSING] $tool: install $package"
        else
            echo "   [OPTIONAL] $tool: missing ($package)"
        fi
        return 1
    fi
}

# Verifica tool critici
echo ""
echo "CRITICAL dependencies (required for basic functionality):"
MISSING_CRITICAL=0
for tool_info in "${CRITICAL_TOOLS[@]}"; do
    IFS=':' read -r tool package <<< "$tool_info"
    if ! check_tool "$tool" "$package" 1; then
        MISSING_CRITICAL=$((MISSING_CRITICAL + 1))
    fi
done

# Verifica tool raccomandati
echo ""
echo "RECOMMENDED dependencies (additional features):"
for tool_info in "${RECOMMENDED_TOOLS[@]}"; do
    IFS=':' read -r tool package <<< "$tool_info"
    check_tool "$tool" "$package" 0
done

# Se mancano tool critici, mostra come installarli
if [ $MISSING_CRITICAL -gt 0 ]; then
    echo ""
    echo "MISSING $MISSING_CRITICAL critical dependencies!"
    echo ""
    echo "INSTALLATION COMMANDS:"
    echo ""
    
    # Per Debian/Ubuntu
    echo "For Debian/Ubuntu:"
    UBUNTU_PACKAGES=""
    for tool_info in "${CRITICAL_TOOLS[@]}"; do
        IFS=':' read -r tool package <<< "$tool_info"
        if ! command -v "$tool" >/dev/null 2>&1; then
            UBUNTU_PACKAGES="$UBUNTU_PACKAGES $package"
        fi
    done
    echo "   sudo apt-get update && sudo apt-get install$UBUNTU_PACKAGES"
    
    echo ""
    echo "For Fedora:"
    echo "   sudo dnf install squashfs-tools xorriso rsync curl jq git parted cryptsetup dosfstools grub2-tools"
    
    echo ""
    echo "For Arch Linux:"
    echo "   sudo pacman -S squashfs-tools libisoburn rsync curl jq git parted cryptsetup dosfstools grub"
    
    echo ""
    echo "Continuing in 2 seconds..."
    sleep 2
fi

echo ""
echo "Starting Penguins Eggs..."

# DEBUG approfondito
echo "=== DEBUG INFO ==="
echo "Current directory: $(pwd)"
echo "Node.js available: $(command -v node)"
echo "Node.js version: $(node --version 2>/dev/null || echo 'NOT FOUND')"
echo "APP_DIR contents:"
ls -la "$APP_DIR/" | head -5
echo "dist/bin contents:"
ls -la "$APP_DIR/dist/bin/" 2>/dev/null || echo "dist/bin not found"
echo "=================="

# Verifica essenziale
if [ ! -f "$APP_DIR/dist/bin/dev.js" ]; then
    echo "ERROR: dist/bin/dev.js not found in AppImage!"
    echo "Available in AppDir:"
    find "$APP_DIR" -name "*.js" | head -10
    exit 1
fi

if ! command -v node >/dev/null 2>&1; then
    echo "ERROR: Node.js not found in system!"
    exit 1
fi

# Esegui penguins-eggs
echo "Executing: cd '$APP_DIR' && node 'dist/bin/dev.js' $@"
cd "$APP_DIR"
exec node "dist/bin/dev.js" "$@"
EOF
chmod +x AppDir/AppRun

# Crea .desktop e icona
mkdir -p AppDir/usr/share/applications
cat > AppDir/usr/share/applications/penguins-eggs.desktop << EOF
[Desktop Entry]
Name=Penguins Eggs
Comment=Smart CLI tool for Linux remastering with dependency guidance
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
echo "Creating Smart AppImage..."
ARCH=$ARCH ./appimagetool AppDir "${APP_NAME}-${VERSION}-smart-${ARCH}.AppImage"

# Test
echo "Testing Smart AppImage..."
chmod +x "${APP_NAME}-${VERSION}-smart-${ARCH}.AppImage"

echo "=== TESTING APPIMAGE ==="
if ./${APP_NAME}-${VERSION}-smart-${ARCH}.AppImage --version; then
    echo "SUCCESS: Smart AppImage tested successfully!"
    echo ""
    echo "Features:"
    echo "   - Automatic dependency checking"
    echo "   - Installation commands for your distro"
    echo "   - Works on any Linux distribution"
else
    echo "WARNING: AppImage test returned error"
    echo "This may be normal if dependencies are missing"
fi

echo ""
echo "SMART AppImage created: ${APP_NAME}-${VERSION}-smart-${ARCH}.AppImage"
echo "Size: $(du -h "${APP_NAME}-${VERSION}-smart-${ARCH}.AppImage" | cut -f1)"