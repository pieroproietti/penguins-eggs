#!/bin/bash
sed -i 's|\(/ \+btrfs \+defaults,.*\)compress=zstd|\1compress=lzo|g' /etc/fstab
