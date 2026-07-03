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
        sudo apk add --allow-untrusted penguins-eggs-*.apk
        ;;

    arch)
        sudo pacman -U --noconfirm penguins-eggs-*.pkg.tar.zst
        ;;

    debian)
        sudo dpkg -i penguins-eggs_*.deb
        ;;
    fedora)
        sudo dnf reinstall -y penguins-eggs-*.rpm
        ;;
    opensuse*)
        sudo zypper --no-gpg-checks install -y penguins-eggs-*.rpm
        ;;
    *)
        # fallback su LIKE_ID
        case "$ID_LIKE" in
            *arch*)   sudo pacman -U --noconfirm penguins-eggs-*.pkg.tar.zst ;;
            *debian*|*devuan*|*ubuntu*) sudo dpkg -i penguins-eggs_*.deb ;;
            *fedora*|*rhel*) sudo dnf install -y penguins-eggs-*.rpm ;;
            *) echo "Distro non supportata: $ID"; exit 1 ;;
        esac
        ;;
esac


