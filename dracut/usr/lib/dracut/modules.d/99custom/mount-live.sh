#!/bin/sh

mount_live() {
    # Trova il dispositivo CD-ROM
    for device in $(ls /dev/sr*); do
        if mount -r $device /mnt; then
            break
        fi
    done

    # Monta il filesystem squashfs in RO
    if [ -e /mnt/live/filesystem.squashfs ]; then
        mkdir -p /run/rootro
        mount -t squashfs -o ro /mnt/live/filesystem.squashfs /run/rootro
    fi

    # Monta il filesystem union (overlay)
    if [ -d /run/rootro ]; then
        mkdir -p /run/root-rw /run/overlay
        mount -t tmpfs -o rw,noatime,mode=755 tmpfs /run/root-rw
        mount -t overlay -o lowerdir=/run/rootro,upperdir=/run/root-rw,workdir=/run/overlay overlay /sysroot
    fi
}

mount_live
