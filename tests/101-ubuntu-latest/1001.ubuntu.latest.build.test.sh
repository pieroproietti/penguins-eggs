#!/usr/bin/env bash


set -x
export CMD_PATH=$(cd `dirname $0`; pwd)
export PROJECT_NAME="${CMD_PATH##*/}"
echo $PROJECT_NAME
cd $CMD_PATH
cd ../../
pwd
make

sudo rsync -avzP ./coa/coa /usr/bin/coa
sudo rsync -avzP ./oa/oa /usr/bin/oa
sudo apt update -y
sudo apt install squashfs-tools xorriso live-boot live-boot-initramfs-tools dosfstools mtools rsync git sudo -y
oa --help
coa --help
cd $CMD_PATH
cd ../../
./coa/coa build
ls -al
sudo coa remaster --mode clone
