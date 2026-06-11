#!/bin/sh
set -e
make clean package "$@"
#!/bin/sh
set -e

make clean package "$@"

# rileva la distro
. /etc/os-release

case "$ID" in
    debian|ubuntu|linuxmint|devuan)
        sudo dpkg -i oa-tools_*.deb
        ;;
    arch|manjaro)
        sudo pacman -U --noconfirm oa-tools_*.pkg.tar.zst
        ;;
    fedora)
        sudo dnf install -y oa-tools_*.rpm
        ;;
    opensuse*|sles)
        sudo zypper install -y oa-tools_*.rpm
        ;;
    alpine)
        sudo apk add --allow-untrusted oa-tools_*.apk
        ;;
    *)
        # fallback su LIKE_ID
        case "$ID_LIKE" in
            *debian*) sudo dpkg -i oa-tools_*.deb ;;
            *arch*)   sudo pacman -U --noconfirm oa-tools_*.pkg.tar.zst ;;
            *fedora*|*rhel*) sudo dnf install -y oa-tools_*.rpm ;;
            *) echo "Distro non supportata: $ID"; exit 1 ;;
        esac
        ;;
esac


