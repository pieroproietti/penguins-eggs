#!/bin/bash
#
# parameter: $1 partition example: /dev/sda  $2 size in mb
# example: scripts/partition_prepare_lvm.sh /dev/sda  68719
#parted --script --align optimal $1 mkpart primary ext2 512 $2
parted --script --align optimal $1 mkpart primary ext2 512 100%
parted --script $1 set 2 lvm on
sleep 1
