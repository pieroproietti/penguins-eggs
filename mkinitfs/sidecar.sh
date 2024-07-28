#!/bin/sh
#
# At the end of the boot, initram goes into emergency,
# we give the following commands:
# mkdir /mnt
# mount /dev/sr0 /mnt
#
# Then /mnt/live/sidecar.sh is launched.
#  

# Creare i punti di montaggio necessari
mkdir -p /media/root-ro 
mkdir -p /media/root-rw 

# Montare il filesystem squashfs
mount -t squashfs /mnt/live/filesystem.squashfs /media/root-ro

# Montare il filesystem tmpfs per la parte writable
mount -t tmpfs root-tmpfs /media/root-rw

# Creare i punti di montaggio necessari
mkdir -p /media/root-rw/work 
mkdir -p /media/root-rw/root

# Montare overlayfs
mount -t overlay overlay -o lowerdir=/media/root-ro,upperdir=/media/root-rw/root,workdir=/media/root-rw/work /newroot

# mount virtual filesystems
mount -t devtmpfs devtmpfs /newroot/dev
mount -t proc proc /newroot/proc
mount -t sysfs sysfs /newroot/sys
mount -t tmpfs tmpfs /newroot/run
cp -r /run/* /newroot/run

echo "sidecar: /newroot was mounted correctly"
echo "         Type 'exit' to continue boot"





