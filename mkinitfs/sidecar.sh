#!/bin/sh

# Montare i filesystem necessari
#mount -t proc proc /proc
#mount -t sysfs sysfs /sys

# Attendere che i dispositivi siano pronti
#sleep 3

# Rilevare il CD con la label 'colibri'
# L'istruzione è corretta
CDROM=$(blkid -l -o device -t LABEL=colibri)
if [ -z "$CDROM" ]; then
    echo "CD con label 'colibri' non trovato!"
    # exec sh
fi

# Montare il CD
#mount -r $CDROM /mnt

# Creare i punti di montaggio necessari
mkdir -p /media/root-ro 
mkdir -p /media/root-rw 

# Montare il filesystem squashfs
mount -t squashfs /mnt/live/filesystem.squashfs /media/root-ro

# Montare il filesystem tmpfs per la parte writable
mount -t tmpfs root-tmpfs /media/root-rw

mkdir -p /media/root-rw/work 
mkdir -p /media/root-rw/root

# Montare overlayfs
mount -t overlay overlay -o lowerdir=/media/root-ro,upperdir=/media/root-rw/root,workdir=/media/root-rw/work /newroot

# Creare i punti di montaggio per i filesystem virtuali nel nuovo root
mkdir -p /newroot/dev /newroot/proc /newroot/sys /newroot/run

# Montare i filesystem virtuali nel nuovo root
#mount --move /dev /newroot/dev
#mount --move /proc /newroot/proc
#mount --move /sys /newroot/sys
#mount --move /run /newroot/run

mount -t devtmpfs devtmpfs /newroot/dev
mount -t proc proc /newroot/proc
mount -t sysfs sysfs /newroot/sys
mount -t tmpfs tmpfs /newroot/run
// copia di run
cp -r /run/* /newroot/run

# Eseguire switch_root e continuare il boot
exec switch_root /newroot /sbin/init

