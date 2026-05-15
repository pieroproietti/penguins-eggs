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
# Analisi della densità dei file (non lo spazio, ma il numero di oggetti)
echo "--- ANALISI DENSITÀ FILE ---"
for d in /$(ls /); do 
    if [ -d "$d" ]; then
        echo "$(sudo find "$d" -xdev | wc -l) oggetti in $d"
    fi
done | sort -rn
# Termina immediatamente il workflow con successo per leggere il log
echo "--- FINE ANALISI: USCITA PREVENTIVA ---"
exit 0
sudo coa remaster

