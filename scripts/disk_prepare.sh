#!/bin/bash
#
# parameter: $1 device example: /dev/sda
#
lvremove pve
parted --script $1 mklabel msdos
