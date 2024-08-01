#!/bin/sh -e

# At the end of the boot, initram goes into emergency,
# we give the following commands:
# mkdir /mnt
# mount /dev/sr0 /mnt
# /mnt/live/sidecar.sh
#  

DIRECTORY="/sysroot"
if [ -z "$(find "$DIRECTORY" -mindepth 1)" ]; then
    echo "sidecar: /sysroot is emply!"
    echo "         type 'exit' to return init, then run sidecar.sh again"
    exit 0
fi

# Creating mountpoints
mkdir -p /media/root-ro 
mkdir -p /media/root-rw 

# mount filesystem squashfs on /media/root-ro
mount -t squashfs /mnt/live/filesystem.squashfs /media/root-ro

# Mount tmpfs on /media/root-rw
mount -t tmpfs root-tmpfs /media/root-rw

# Creare i punti di montaggio necessari
mkdir -p /media/root-rw/work 
mkdir -p /media/root-rw/root

# mount  overlayfs on //sysroot
mount -t overlay overlay -o lowerdir=/media/root-ro,upperdir=/media/root-rw/root,workdir=/media/root-rw/work /sysroot

# mount virtual filesystems on //sysroot
#mount -t devtmpfs devtmpfs /sysroot/dev
#mount -t proc proc /sysroot/proc
#mount -t sysfs sysfs /sysroot/sys
#mount -t tmpfs tmpfs /sysroot/run
#cp -r /run/* /sysroot/run

echo "sidecar: /sysroot was mounted!"
echo "         check it then type 'exit' to continue boot"
