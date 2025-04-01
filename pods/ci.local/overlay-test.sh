#!/usr/bin/env bash

set -x
export CMD_PATH=$(cd `dirname $0`; pwd)
export PROJECT_NAME="${CMD_PATH##*/}"
export NEEDRESTART_MODE=a
export DEBIAN_FRONTEND=noninteractive

cd $CMD_PATH

if [ -f /etc/os-release ]; then
    . /etc/os-release
    if [[ "$ID" == "almalinux" ]]; then
        echo "install the package of capsh"

    elif [[ "$ID" == "arch" ]]; then
        echo "install the package of capsh"
        pacman -S --needed --noconfirm libcap
        pacman -S --needed --noconfirm linux
        pacman -S --needed --noconfirmkmod
        
    elif [[ "$ID" == "debian" ]]; then
        echo "install the package of capsh"
        apt update -y
        apt install linux-image-amd64 -y
        apt install -y kmod
        apt install -y libcap2-bin
        
    elif [[ "$ID" == "devuan" ]]; then
        echo "install the package of capsh"
        apt update -y
        apt install linux-image-amd64 -y
        apt install -y kmod
        apt install -y libcap2-bin
        
    elif [[ "$ID" == "fedora" ]]; then
        echo "install the package of capsh"
        
    elif [[ "$ID" == "rocky" ]]; then
        echo "install the package of capsh"
        
    elif [[ "$ID" == "ubuntu" ]]; then
        echo "install the package of capsh"
        apt update -y
        apt install linux-image-amd64 -y
        apt install -y kmod
        apt install -y libcap2-bin
        
    else
        echo "distro not supported"
        exit 1
    fi
fi

grep overlay /proc/filesystems
modprobe overlay

capsh --print

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
