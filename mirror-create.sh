#!/usr/bin/env bash


createPartition(){
    # Creazione delle partizioni disk0
    parted --script $1 mklabel msdos
    parted --script --align optimal $1 mkpart primary ext3       1MiB     4GB
    parted --script --align optimal $1 mkpart primary ext4       4GB      100%
    parted $1 set 1 boot on
    parted $1 set 1 esp on

}


disk0=/dev/sda
disk1=/dev/sdb

createPartition $disk0
createPartition $disk1

mdadm --create --verbose /dev/md0 --level=1 --raid-devices=2 /dev/sda1 /dev/sdb1
mdadm --create --verbose /dev/md1 --level=1 --raid-devices=2 /dev/sda2 /dev/sdb2
