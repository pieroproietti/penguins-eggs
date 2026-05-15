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
sudo coa tools clean

echo "--- CACCIA AL CICCIONE (Conteggio Inode) ---"
# Usiamo du con --inodes per contare gli oggetti reali, non lo spazio
sudo du --inodes -d 1 / 2>/dev/null | sort -rn

echo "--- ANALISI SPECIFICA PER /root e /var ---"
# Se il sospetto è /root o /var, guardiamo un livello più sotto
sudo du --inodes -d 1 /root /var /home 2>/dev/null | sort -rn

echo "--- FINE ANALISI: USCITA PREVENTIVA ---"
exit 0

sudo coa remaster

