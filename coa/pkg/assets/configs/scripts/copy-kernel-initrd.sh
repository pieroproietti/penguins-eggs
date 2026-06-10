#!/bin/bash
set -e

# Ottieni la versione del kernel in esecuzione
KERNEL_VERSION=$(chroot /home/eggs/liveroot uname -r 2>/dev/null)

if [ -n "$KERNEL_VERSION" ]; then
    # Kernel: cerca vmlinuz con la versione corrente
    KERNEL_SRC=$(ls -1 /home/eggs/liveroot/boot/vmlinuz-*$KERNEL_VERSION* 2>/dev/null | head -n 1)
    
    # Initramfs: cerca con la stessa versione (supporta initrd.img, initramfs, initrd)
    INITRD_SRC=$(ls -1 /home/eggs/liveroot/boot/initrd.img-*$KERNEL_VERSION* \
                       /home/eggs/liveroot/boot/initramfs-*$KERNEL_VERSION* \
                       /home/eggs/liveroot/boot/initrd-*$KERNEL_VERSION* 2>/dev/null | head -n 1)
    
    # Fallback per nomi specifici (Alpine, Fedora, openSUSE)
    if [ -z "$INITRD_SRC" ]; then
        INITRD_SRC=$(ls -1 /home/eggs/liveroot/boot/initramfs-oa-tools \
                           /home/eggs/liveroot/boot/initramfs-fedora.img \
                           /home/eggs/liveroot/boot/initramfs-opensuse.img 2>/dev/null | head -n 1)
    fi
else
    # Fallback: prendi il primo kernel valido
    KERNEL_SRC=$(ls -v /home/eggs/liveroot/boot/vmlinuz-* 2>/dev/null | grep -v -E '(rescue|fallback|\.old)' | tail -n 1)
    INITRD_SRC=$(ls -1 /home/eggs/liveroot/boot/initrd.img-* \
                       /home/eggs/liveroot/boot/initr*-* 2>/dev/null | grep -v -E '(rescue|fallback)' | head -n 1)
fi

# Copia
[ -n "$KERNEL_SRC" ] && cp "$KERNEL_SRC" /home/eggs/isodir/live/vmlinuz
[ -n "$INITRD_SRC" ] && cp "$INITRD_SRC" /home/eggs/isodir/live/initrd.img
