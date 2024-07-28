#!/bin/sh -e

# At the end of the boot, initram goes into emergency,
# we give the following commands:
# mkdir /mnt
# mount /dev/sr0 /mnt
# /mnt/live/sidecar
#  

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

# mount  overlayfs on /newroot
mount -t overlay overlay -o lowerdir=/media/root-ro,upperdir=/media/root-rw/root,workdir=/media/root-rw/work /newroot

# mount virtual filesystems on /newroot
mount -t devtmpfs devtmpfs /newroot/dev
mount -t proc proc /newroot/proc
mount -t sysfs sysfs /newroot/sys
mount -t tmpfs tmpfs /newroot/run
#cp -r /run/* /newroot/run

echo "sidecar: /newroot was mounted!"
echo "         check it then type 'exit' to continue boot"
