#!/usr/bin/env bash

export CMD_PATH=$(cd `dirname $0`; pwd)
export PROJECT_NAME="${CMD_PATH##*/}"
echo $PROJECT_NAME
cd $CMD_PATH

cd ../../
pwd
make
rsync -avzP ./coa/coa $CMD_PATH/
rsync -avzP ./oa/oa $CMD_PATH/

set -eux
cd $CMD_PATH
echo "=== Install dependencies ==="

sudo apt-get update

sudo apt-get install -y \
    wget \
    curl \
    gnupg2 \
    software-properties-common \
    virtualbox

echo "=== Install Vagrant ==="

VAGRANT_VERSION="2.4.9"

wget -q \
  https://releases.hashicorp.com/vagrant/${VAGRANT_VERSION}/vagrant_${VAGRANT_VERSION}-1_amd64.deb

sudo dpkg -i vagrant_${VAGRANT_VERSION}-1_amd64.deb

echo "=== Verify ==="

vagrant --version
VBoxManage --version
cd $CMD_PATH
ls -al
sudo modprobe -r kvm_amd
sudo modprobe -r kvm
vagrant up
sleep 10
vagrant ssh -c "uname -a"
vagrant ssh -c "/vagrant/oa --help"
vagrant ssh -c "/vagrant/coa --help"
