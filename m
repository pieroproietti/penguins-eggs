#!/bin/sh
set -e
make clean package "$@"

if ls penguins-eggs_*.deb 1>/dev/null 2>&1; then
    sudo dpkg -i penguins-eggs_*.deb
elif ls penguins-eggs-*.pkg.tar.zst 1>/dev/null 2>&1; then
    sudo pacman -U --noconfirm penguins-eggs-*.pkg.tar.zst
elif ls penguins-eggs-*.apk 1>/dev/null 2>&1; then
    sudo apk add --allow-untrusted penguins-eggs-*.apk
elif ls penguins-eggs-*.rpm 1>/dev/null 2>&1; then
    if command -v zypper >/dev/null 2>&1; then
        sudo zypper --no-gpg-checks install -y penguins-eggs-*.rpm
    else
        sudo dnf reinstall -y penguins-eggs-*.rpm
    fi
else
    echo "Nessun pacchetto trovato da installare."
    exit 1
fi
