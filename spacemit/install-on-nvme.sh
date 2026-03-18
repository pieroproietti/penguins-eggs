#!/bin/bash
# Script "Macerie e Ragione" per MuseBook NVMe
# Eseguire dalla cartella penguins-eggs/

DISK="/dev/nvme0n1"
SPACEMIT_DIR="./spacemit"
FACTORY_DIR="./spacemit/factory"

echo "--- Preparazione disco $DISK ---"

# 1. Tabella GPT
sudo sgdisk -Z $DISK
sudo sgdisk -o $DISK

# 2. Scrittura BootInfo (indispensabile per NVMe)
echo "Scrittura BootInfo..."
sudo dd if="$FACTORY_DIR/bootinfo_emmc.bin" of=$DISK bs=512 count=1 conv=notrunc

# 3. Partizionamento (Offset MuseBook verificati)
echo "Creazione partizioni..."
sudo sgdisk -n 1:256:767    -c 1:"fsbl"     -t 1:0700 $DISK
sudo sgdisk -n 2:768:895    -c 2:"env"      -t 2:0700 $DISK
sudo sgdisk -n 3:2048:4095  -c 3:"opensbi"  -t 3:0700 $DISK
sudo sgdisk -n 4:4096:8191  -c 4:"uboot"    -t 4:0700 $DISK
sudo sgdisk -n 5:8192:532479 -c 5:"bootfs"   -t 5:0700 $DISK
sudo sgdisk -n 6:532480:0    -c 6:"rootfs"   -t 6:0700 $DISK

# 4. Scrittura Binari
echo "Scrittura binari..."
sudo dd if="$FACTORY_DIR/FSBL.bin"   of="${DISK}p1" conv=fsync status=none

# Se env.bin esiste lo scriviamo, altrimenti U-Boot userà i txt in bootfs
[ -f "env.bin" ] && sudo dd if="env.bin" of="${DISK}p2" conv=fsync status=none
sudo dd if="$SPACEMIT_DIR/fw_dynamic.itb" of="${DISK}p3" conv=fsync status=none
sudo dd if="$SPACEMIT_DIR/u-boot.itb"    of="${DISK}p4" conv=fsync status=none

# 5. Scrittura Filesystems (I tuoi file .ext4)
echo "Scrittura Filesystems (questo richiederà tempo)..."
[ -f "bootfs.ext4" ] && sudo dd if="bootfs.ext4" of="${DISK}p5" bs=1M status=progress conv=fsync
[ -f "rootfs.ext4" ] && sudo dd if="rootfs.ext4" of="${DISK}p6" bs=1M status=progress conv=fsync

echo "Fatto. Ora il NVMe è speculare al tuo MuseBook originale."
