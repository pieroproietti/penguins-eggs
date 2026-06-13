#!/bin/sh
set -e
make clean package "$@"
#!/bin/sh
set -e

make clean package "$@"

# rileva la distro
. /etc/os-release

case "$ID" in
    alpine)
        sudo apk add --allow-untrusted oa-tools-alpine*.apk
        ;;

    arch)
        sudo pacman -U --noconfirm oa-tools-manjaro*.pkg.tar.zst
        ;;

    debian)
        sudo dpkg -i oa-tools_*.deb
        ;;
    fedora)
        sudo dnf install -y oa-tools-fedora*.rpm
        ;;
    opensuse*)
        sudo zypper install -y oa-tools-opensuse*.rpm
        ;;
    *)
        # fallback su LIKE_ID
        case "$ID_LIKE" in
            *arch*)   sudo pacman -U --noconfirm oa-tools-arch*.pkg.tar.zst ;;
            *debian*|*devuan*|*ubuntu*) sudo dpkg -i oa-tools_*.deb ;;
            *fedora*|*rhel*) sudo dnf install -y oa-tools-fedora*.rpm ;;
            *) echo "Distro non supportata: $ID"; exit 1 ;;
        esac
        ;;
esac


