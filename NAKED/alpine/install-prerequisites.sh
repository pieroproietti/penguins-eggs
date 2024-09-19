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
    syslinux \
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
