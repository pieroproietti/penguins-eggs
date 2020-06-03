#!/bin/bash
#
# parameter: $1 device example: /dev/sda"
#

if [ -z "$1" ]; then
    echo "usage: $0 \$1 "
    echo "where: \$1 is /dev/sda, /dev/sdb, etc"
    exit
fi
lvremove pve
parted --script $1 mklabel msdos
