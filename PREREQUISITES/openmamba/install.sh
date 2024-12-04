!#/bin/bash

# check if we are on openmamba
if [ ! -f /etc/openmamba-release ]; then
    echo "This script is only for OpenSUSE"
    exit
fi


# check if we are root
if [ "$EUID" -ne 0 ]
  then echo "Please run as root"
  exit
fi

dnf install -y \
    bash-completion \
    cryptsetup \
    curl \
    dosfstools \
    dracut \
    fuse \
    git \
    grub2-efi-x64 \
    grub2-efi-x64-modules \
    grub2-tools-extra \
    jq \
    lvm2 \
    nodejs \
    rsync \
    squashfs \
    sshfs \
    wget \
    xdg-user-dirs \
    xorriso

# Install pnpm
npm i pnpm -g

