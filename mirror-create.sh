#!/usr/bin/env bash

disk0=/dev/sda
disk1=/dev/sdb

# Creazione delle partizioni
parted --script ${installDevice} mklabel msdos
parted --script --align optimal ${installDevice} mkpart primary biosgrub   1MiB  510 MiB
parted --script --align optimal ${installDevice} mkpart primary ext4       1MiB     100%
parted ${installDevice} set 1 boot on
parted ${installDevice} set 1 esp on

mdadm --create --verbose /dev/md0 --level=1 --raid-devices=2 /dev/sda1 /dev/sdb1
mdadm --create --verbose /dev/md1 --level=1 --raid-devices=2 /dev/sda2 /dev/sdb2