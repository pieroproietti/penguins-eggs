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

echo "fuse" | tee /etc/modules-load.d/fuse.conf

npm i pnpm -g
mkdir /usr/share/icons

