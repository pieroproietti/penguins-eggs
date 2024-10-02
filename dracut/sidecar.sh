#!/bin/bash
clear
echo "Penguins' eggs: sidecar.sh"
echo "=========================="
sleep 2

# filesystem squashfs is mounted on 
# /run/rootfsbase

# mount tmpfs on /media/root-rw
mkdir -p /run/root-rw 
mount -t tmpfs root-tmpfs /run/root-rw

# creare i punti di montaggio necessari
mkdir -p /run/root-rw/work 
mkdir -p /run/root-rw/root

# mount  overlayfs on /sysroot
mount -t overlay overlay -o lowerdir=/run/rootfsbase,upperdir=/run/root-rw/root,workdir=/run/root-rw/work /sysroot
