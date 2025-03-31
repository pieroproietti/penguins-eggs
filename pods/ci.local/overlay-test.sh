#!/usr/bin/env bash

set -x
export CMD_PATH=$PWD
export PROJECT_NAME="${CMD_PATH##*/}"
export NEEDRESTART_MODE=a
export DEBIAN_FRONTEND=noninteractive
grep overlay /proc/filesystems
modprobe overlay
cd $CMD_PATH

mkdir -p $CMD_PATH/lower $CMD_PATH/upper $CMD_PATH/work $CMD_PATH/merged

# Add test files
echo "Lower File" > $CMD_PATH/lower/test.txt
echo "Upper File" > $CMD_PATH/upper/test.txt

mount -t overlay overlay -o lowerdir=$CMD_PATH/lower,upperdir=$CMD_PATH/upper,workdir=$CMD_PATH/work $CMD_PATH/merged

ls $CMD_PATH/merged
cat $CMD_PATH/merged/test.txt

umount $CMD_PATH/merged

rm -rf $CMD_PATH/lower 
rm -rf $CMD_PATH/upper 
rm -rf $CMD_PATH/work 
rm -rf $CMD_PATH/merged
date
