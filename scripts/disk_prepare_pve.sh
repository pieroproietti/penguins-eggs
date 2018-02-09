#!/bin/bash
#
# parameter: $1 disk example: /dev/sda
#
LVM_PARTNAME=`fdisk $1 -l | grep 8e | awk '{print $1}' | cut -d "/" -f3`
LVM_SIZE=`cat /proc/partitions | grep $LVM_PARTNAME| awk '{print $3}' | grep "[0-9]"`
echo "LVM_SIZE=$LVM_SIZE"
LVM_SIZE=$(($LVM_SIZE/1024))
echo "LVM_SIZE=$LVM_SIZE"

PENGUIN_SWAP="/dev/penguin/swap"
PENGUIN_ROOT="/dev/penguin/root"
PENGUIN_DATA="dev/penguin/data"

# La partizione di root viene posta ad 1/4 della partizione LVM.
# Viene limitata fino ad un massimo di 100 GB

LVM_SWAP_SIZE=$((4*1024))
echo "LVM_SWAP_SIZE=$LVM_SWAP_SIZE"

LVM_ROOT_SIZE=$(($LVM_SIZE/8))
LVM_ROOT_SIZE_MINIMUN=8192
if [ $LVM_ROOT_SIZE  -le $LVM_ROOT_SIZE_MINIMUN ]; then
	LVM_ROOT_SIZE=$LVM_ROOT_SIZE_MINIMUN
fi
echo "LVM_ROOT_SIZE=$LVM_ROOT_SIZE"

LVM_DATA_SIZE=$(($LVM_SIZE-$LVM_SWAP_SIZE-$LVM_ROOT_SIZE))
echo "LVM_DATA_SIZE=$LVM_DATA_SIZE"

LVM_DATA_SIZE=$(($LVM_SIZE-$LVM_SWAP_SIZE-$LVM_ROOT_SIZE))
echo "LVM_DATA_SIZE=$LVM_DATA_SIZE"
GB=1048576
GB=1024

echo "LVM_SIZE=$(($LVM_SIZE/$GB)) GB, $LVM_SIZE"
echo "LVM_SWAP_SIZE=$(($LVM_SWAP_SIZE/$GB)) GB, $LVM_SWAP_SIZE"
echo "LVM_ROOT_SIZE=$(($LVM_ROOT_SIZE/$GB)) GB, $LVM_ROOT_SIZE"
echo "LVM_DATA_SIZE=$(($LVM_DATA_SIZE/$GB)) GB, $LVM_DATA_SIZE"


echo "pvcreate /dev/$LVM_PARTNAME"
echo "vgcreate penguin /dev/$LVM_PARTNAME"
echo "vgchange -an"
echo "lvcreate -L $LVM_SWAP_SIZE  -nswap penguin"
echo "lvcreate -L $LVM_ROOT_SIZE -nroot penguin"
echo "lvcreate -l 100%FREE -ndata penguin"
echo "vgchange -a y penguin"

pvcreate /dev/$LVM_PARTNAME
vgcreate penguin /dev/$LVM_PARTNAME
vgchange -an
lvcreate -L $LVM_SWAP_SIZE  -nswap penguin
lvcreate -L $LVM_ROOT_SIZE -nroot penguin
lvcreate -l 100%FREE -ndata penguin
vgchange -a y penguin
