#!/usr/bin/env bash


set -x
export CMD_PATH=$(cd `dirname $0`; pwd)
export PROJECT_NAME="${CMD_PATH##*/}"
echo $PROJECT_NAME
cd $CMD_PATH
cd ../../
pwd
make
ls -al
sudo dpkg -i ./coa/oa-tools*.deb
sudo apt install -f
sudo coa tools clean
sudo coa remaster

