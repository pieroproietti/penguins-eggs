#!/bin/bash
# Download Alpine minirootfs and Linux kernel source into build/
set -e

ALPINE_VER="3.21.0"
ALPINE_ARCH="x86_64"
ALPINE_FILE="alpine-minirootfs-${ALPINE_VER}-${ALPINE_ARCH}.tar.gz"
ALPINE_URL="http://dl-cdn.alpinelinux.org/alpine/v${ALPINE_VER%.*}/releases/${ALPINE_ARCH}/${ALPINE_FILE}"

LINUX_VER="linux-6.10.14"
LINUX_URL="http://cdn.kernel.org/pub/linux/kernel/v6.x/${LINUX_VER}.tar.xz"

cd "$(dirname "$0")/build"

if [ ! -d alpine-minirootfs ]; then
    echo "Fetching Alpine minirootfs ${ALPINE_VER}..."
    wget -c4 "$ALPINE_URL"
    mkdir alpine-minirootfs
    tar -C ./alpine-minirootfs -xf "$ALPINE_FILE"
fi

if [ ! -d linux ]; then
    echo "Fetching Linux kernel ${LINUX_VER}..."
    wget -c4 "$LINUX_URL"
    tar -xf "${LINUX_VER}.tar.xz"
    ln -s "$LINUX_VER" linux
fi
