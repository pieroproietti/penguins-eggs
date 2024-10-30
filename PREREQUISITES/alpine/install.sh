#!/bin/ash

# This script installs prerequisites for penguins-eggs
# on alpine linux, it is intended for development purposes 
# only

# check if we are root
if [ "$(id -u)" -ne 0 ]; then
    echo "This script must be run as root"
    exit 1
fi

# check if we are on alpine
if [ ! -f /etc/alpine-release ]; then
    echo "This script is intended for alpine linux only"
    exit 1
fi

# controlla la release
if [ "$(lsb_release -rs)" != "3.20.3" ]; then
    echo "This script is intended for alpine 3.20.3 only"
    exit 1
fi

# copy on /etc/apk/repositories
cat <<EOF > /etc/apk/repositories
#/media/cdrom/apks
http://dl-cdn.alpinelinux.org/alpine/v3.20/main
http://dl-cdn.alpinelinux.org/alpine/v3.20/community
@testing https://dl-cdn.alpinelinux.org/alpine/edge/testing
@edge https://dl-cdn.alpinelinux.org/alpine/edge/community
EOF

# update
apk update

# install-prerequisites
apk add \
    alpine-conf \
    apk-tools \
    bash-completion \
    cryptsetup \
    curl \
    docs \
    dosfstools \
    fuse \
    git \
    jq \
    lsb-release \
    lsblk \
    lvm2 \
    man-pages \
    mandoc \
    mandoc-apropos \
    mkinitfs \
    musl-locales \
    musl-utils \
    nano \
    nodejs \
    npm \
    parted \
    rsync \
    shadow \
    squashfs-tools \
    sshfs \
    wget \
    xdg-user-dirs \
    xorriso

# fuse
echo "fuse" | tee /etc/modules-load.d/fuse.conf

# install pnpm
npm i pnpm -g

# create dirs
mkdir /usr/share/icons
mkdir /usr/share/applications

# ln sudo
ln -s /usr/bin/doas /usr/bin/sudo

# install grub
apk add \
    grub \
    grub-bios \
    grub-efi \
    efibootmgr

grub-install /dev/sda

# bash
chsh -s /bin/bash

# create /usr/sbin/shutdown
if [ ! -e /usr/sbin/shutdown ]; then
echo "creating /usr/sbin/shutdown"
cat << 'EOF' > /tmp/shutdown
#!/usr/bin/env bash
/sbin/poweroff
EOF
chmod +x /tmp/shutdown
mv /tmp/shutdown /usr/sbin
fi
