#!/bin/bash
#
# parameter: $1 partition example: /dev/sda
#
parted --script $1 mkpart primary ext4 1 512
parted --script --align optimal  $1 set 1 boot on
sleep 1
