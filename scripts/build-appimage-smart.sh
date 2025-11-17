#!/bin/bash
set -e

echo "🛠️ Building Penguins Eggs Smart AppImage..."

APP_NAME="penguins-eggs"
VERSION=$(node -p "require('./package.json').version")
ARCH="x86_64"

# Verifica build
if [ ! -f "dist/bin/dev.js" ]; then
    echo "❌ Build not found. Run: pnpm run build"
    exit 1
fi

echo "✅ Build found: dist/bin/dev.js"

# Pulisci e crea struttura
rm -rf AppDir
mkdir -p AppDir/usr/lib/penguins-eggs
mkdir -p AppDir/usr/bin

# Scarica appimagetool
if [ ! -f "appimagetool" ]; then
    echo "📥 Downloading appimagetool..."
    wget -q https://github.com/AppImage/AppImageKit/releases/download/continuous/appimagetool-${ARCH}.AppImage -O appimagetool
    chmod +x appimagetool
fi

# Copia il progetto
echo "📦 Copying project files..."
for dir in dist node_modules assets addons bin conf dracut manpages mkinitcpio mkinitfs scripts src templates; do
    if [ -d "$dir" ]; then
        echo "  📁 $dir"
        cp -r "$dir" AppDir/usr/lib/penguins-eggs/
    fi
done

cp package.json AppDir/usr/lib/penguins-eggs/ 2>/dev/null || true

# Crea AppRun "Smart" che verifica le dipendenze
cat > AppDir/AppRun << 'EOF'
#!/bin/bash
set -e

HERE="$(dirname "$(readlink -f "$0")")"
APP_DIR="$HERE/usr/lib/penguins-eggs"

# Usa solo tool di sistema - più affidabile
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:$HERE/usr/bin"
export NODE_PATH="$APP_DIR/node_modules"

echo "🐧 Penguins Eggs AppImage"
echo "🔧 Checking system dependencies..."

# Lista completa delle dipendenze CRITICHE per penguins-eggs
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

# Lista delle dipendenze RACCOMANDATE
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
            echo "   ✅ $tool: $(command -v "$tool")"
        else
            echo "   ✅ $tool: available"
        fi
        return 0
    else
        if [ "$critical" = "1" ]; then
            echo "   ❌ $tool: MISSING (install: $package)"
        else
            echo "   ⚠️  $tool: missing (optional: $package)"
        fi
        return 1
    fi
}

# Verifica tool critici
echo ""
echo "🚨 CRITICAL dependencies (required for basic functionality):"
MISSING_CRITICAL=0
for tool_info in "${CRITICAL_TOOLS[@]}"; do
    IFS=':' read -r tool package <<< "$tool_info"
    if ! check_tool "$tool" "$package" 1; then
        MISSING_CRITICAL=$((MISSING_CRITICAL + 1))
    fi
done

# Verifica tool raccomandati
echo ""
echo "📦 RECOMMENDED dependencies (additional features):"
for tool_info in "${RECOMMENDED_TOOLS[@]}"; do
    IFS=':' read -r tool package <<< "$tool_info"
    check_tool "$tool" "$package" 0
done

# Se mancano tool critici, mostra come installarli
if [ $MISSING_CRITICAL -gt 0 ]; then
    echo ""
    echo "❌ MISSING $MISSING_CRITICAL critical dependencies!"
    echo ""
    echo "💡 INSTALLATION COMMANDS:"
    echo ""
    
    # Raggruppa per distribuzione
    echo "📋 For Debian/Ubuntu:"
    UBUNTU_PACKAGES=""
    for tool_info in "${CRITICAL_TOOLS[@]}"; do
        IFS=':' read -r tool package <<< "$tool_info"
        if ! command -v "$tool" >/dev/null 2>&1; then
            UBUNTU_PACKAGES="$UBUNTU_PACKAGES $package"
        fi
    done
    echo "   sudo apt-get update && sudo apt-get install$UBUNTU_PACKAGES"
    
    echo ""
    echo "📋 For Fedora:"
    echo "   sudo dnf install squashfs-tools xorriso rsync curl jq git parted cryptsetup dosfstools grub2-tools"
    
    echo ""
    echo "📋 For Arch Linux:"
    echo "   sudo pacman -S squashfs-tools libisoburn rsync curl jq git parted cryptsetup dosfstools grub"
    
    echo ""
    echo "⏳ Continuing in 5 seconds (some features may not work)..."
    sleep 5
fi

echo ""
echo "🚀 Starting Penguins Eggs..."

# Esegui penguins-eggs
cd "$APP_DIR"
exec node "$APP_DIR/dist/bin/dev.js" "$@"
EOF
chmod +x AppDir/AppRun

# Crea script di installazione automatica
cat > AppDir/usr/lib/penguins-eggs/install-deps.sh << 'EOF'
#!/bin/bash
echo "🐧 Penguins Eggs Dependency Installer"
echo "======================================"

detect_distro() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        echo "$ID"
    else
        echo "unknown"
    fi
}

install_deps_debian() {
    echo "📦 Installing dependencies for Debian/Ubuntu..."
    sudo apt-get update
    sudo apt-get install -y \
        squashfs-tools \
        xorriso \
        rsync \
        curl \
        jq \
        git \
        parted \
        cryptsetup \
        dosfstools \
        grub2-common \
        grub-pc-bin \
        grub-efi-amd64-bin \
        isolinux \
        syslinux \
        syslinux-common \
        ipxe \
        lvm2 \
        sshfs \
        gnupg
}

install_deps_fedora() {
    echo "📦 Installing dependencies for Fedora..."
    sudo dnf install -y \
        squashfs-tools \
        xorriso \
        rsync \
        curl \
        jq \
        git \
        parted \
        cryptsetup \
        dosfstools \
        grub2-tools \
        grub2-tools-extra \
        syslinux \
        ipxe \
        lvm2 \
        sshfs \
        gnupg
}

install_deps_arch() {
    echo "📦 Installing dependencies for Arch Linux..."
    sudo pacman -S --noconfirm \
        squashfs-tools \
        libisoburn \
        rsync \
        curl \
        jq \
        git \
        parted \
        cryptsetup \
        dosfstools \
        grub \
        syslinux \
        ipxe \
        lvm2 \
        sshfs \
        gnupg
}

DISTRO=$(detect_distro)
echo "🔍 Detected distribution: $DISTRO"

case "$DISTRO" in
    ubuntu|debian)
        install_deps_debian
        ;;
    fedora)
        install_deps_fedora
        ;;
    arch|manjaro)
        install_deps_arch
        ;;
    *)
        echo "❌ Unsupported distribution: $DISTRO"
        echo "💡 Please install dependencies manually"
        exit 1
        ;;
esac

echo ""
echo "✅ All dependencies installed successfully!"
echo "🚀 You can now use Penguins Eggs without dependency warnings."
EOF
chmod +x AppDir/usr/lib/penguins-eggs/install-deps.sh

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
  <text x="128" y="110" text-anchor="middle" font-family="Arial" font-size="38" fill="#4A90E2">🐧</text>
  <text x="128" y="235" text-anchor="middle" font-family="Arial" font-size="20" fill="white" font-weight="bold">EGGS</text>
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
echo "🎯 Creating Smart AppImage..."
ARCH=$ARCH ./appimagetool AppDir "${APP_NAME}-${VERSION}-smart-${ARCH}.AppImage"

# Test
echo "🧪 Testing Smart AppImage..."
chmod +x "${APP_NAME}-${VERSION}-smart-${ARCH}.AppImage"

if ./${APP_NAME}-${VERSION}-smart-${ARCH}.AppImage --version; then
    echo "🎉 Smart AppImage tested successfully!"
    echo ""
    echo "💡 Features:"
    echo "   ✅ Automatic dependency checking"
    echo "   📋 Installation commands for your distro"
    echo "   🚀 Works on any Linux distribution"
    echo ""
    echo "🔧 To install all dependencies:"
    echo "   ./${APP_NAME}-${VERSION}-smart-${ARCH}.AppImage install-deps"
else
    echo "⚠️ AppImage created but test failed"
fi

echo ""
echo "✅ SMART AppImage created: ${APP_NAME}-${VERSION}-smart-${ARCH}.AppImage"