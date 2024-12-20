#!/usr/bin/env bash

# remove RAID
mdadm --stop /dev/md*

#devices
disk0=/dev/sda
disk1=/dev/sdb

#disk0
parted --script ${disk0} mklabel msdos
parted --script ${disk0} mkpart primary ext2 1 512
parted --script --align optimal ${disk0} mkpart primary ext2 512 100%
parted --script ${installDevice} set 1 boot on


parted --script ${disk1} mklabel msdos
parted --script ${disk1} mkpart primary ext2 1 512
parted --script --align optimal ${disk0} mkpart primary ext2 512 100%
parted --script ${disk1} set 1 boot on

mdadm --create --verbose /dev/md0 --level=1 --raid-devices=2 /dev/sda2 /dev/sdb2
parted --script /dev/md0 set 1 lvm on

pvcreate /dev/md0
vgcreate pve /dev/md0
vgchange -an
lvcreate -L  -nswap pve
lvcreate -L 100%FREE -nroot pve
vgchange -a y pve

EFI_NAME='none'
BOOT_NAME='/dev/sda1'
BOOT_FSTYPE='ext2'
BOOT_MOUNTPOINT='/boot'

ROOT_NAME='/dev/pve/root'
ROOT_FSTYPE='ext4'
ROOT_MOUNT_POINT='/'

SVAP_NAME='/dev/pve/swap'
