!#/bin/bash

zypper install \
    bash-completion \
    cryptsetup \
    curl \
    dosfstools \
    dracut \
    dracut-tools \
    fuse \
    git \
    jq \
    lsb-release \
    lvm2 \
    nodejs \
    npm \
    parted \
    rsync \
    squashfs \
    sshfs \
    syslinux \
    xdg-user-dirs \
    xorriso

# Install pnpm
npm i pnpm -g
