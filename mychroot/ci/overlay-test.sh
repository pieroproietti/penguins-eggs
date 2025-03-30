#!/usr/bin/env bash

set -x
export CMD_PATH=$(cd `dirname $0`; pwd)
export PROJECT_NAME="${CMD_PATH##*/}"
export NEEDRESTART_MODE=a
export DEBIAN_FRONTEND=noninteractive
grep overlay /proc/filesystems
modprobe overlay

mkdir -p /lower /upper /work /merged

# Add test files
echo "Lower File" > /lower/test.txt
echo "Upper File" > /upper/test.txt

mount -t overlay overlay -o lowerdir=/lower,upperdir=/upper,workdir=/work /merged

ls /merged
cat /merged/test.txt

umount /merged

rm -rf /lower 
rm -rf /upper 
rm -rf /work 
rm -rf /merged
date
