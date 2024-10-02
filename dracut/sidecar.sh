#!/bin/bash
clear
echo "Penguins' eggs: sidecar"
echo "======================="
sleep 5

# mount filesystem squashfs on /media/root-ro
mkdir -p /media/root-ro 
mount -t squashfs /run/initramfs/live/live/filesystem.squashfs /media/root-ro

# mount tmpfs on /media/root-rw
mkdir -p /media/root-rw 
mount -t tmpfs root-tmpfs /media/root-rw

# creare i punti di montaggio necessari
mkdir -p /media/root-rw/work 
mkdir -p /media/root-rw/root

# mount  overlayfs on /sysroot
mount -t overlay overlay -o lowerdir=/media/root-ro,upperdir=/media/root-rw/root,workdir=/media/root-rw/work /sysroot
