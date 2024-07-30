#!/bin/bash

mount_cdrom_and_overlay() {
    local cdrom_device=""
    local loop_device=""
    
    # Trova il dispositivo del CD-ROM
    for device in /dev/sr*; do
        if [ -b "$device" ]; then
            cdrom_device="$device"
            break
        fi
    done
    
    if [ -z "$cdrom_device" ]; then
        echo "CD-ROM device not found"
        return 1
    fi
    
    # Monta il CD-ROM
    mount -o ro "$cdrom_device" /mnt
    if [ $? -ne 0 ]; then
        echo "Failed to mount CD-ROM"
        return 1
    fi
    
    # Trova il file system.squashfs e montalo
    if [ -f /mnt/live/filesystem.squashfs ]; then
        loop_device=$(losetup -f)
        losetup "$loop_device" /mnt/live/filesystem.squashfs
        mount -o ro "$loop_device" /sysroot
        if [ $? -ne 0 ]; then
            echo "Failed to mount filesystem.squashfs"
            return 1
        fi
    else
        echo "filesystem.squashfs not found"
        return 1
    fi
    
    # Monta l'overlay
    mount -t overlay overlay -o lowerdir=/sysroot,upperdir=/mnt/upper,workdir=/mnt/work /newroot
    if [ $? -ne 0 ]; then
        echo "Failed to setup overlay filesystem"
        return 1
    fi

    return 0
}

mount_cdrom_and_overlay
