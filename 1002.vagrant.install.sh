#!/usr/bin/env bash

set -eux

echo "=== Install dependencies ==="

sudo apt-get update

sudo apt-get install -y \
    wget \
    curl \
    gnupg2 \
    software-properties-common \
    virtualbox

echo "=== Install Vagrant ==="

VAGRANT_VERSION="2.4.3"

wget -q \
  https://releases.hashicorp.com/vagrant/${VAGRANT_VERSION}/vagrant_${VAGRANT_VERSION}-1_amd64.deb

sudo dpkg -i vagrant_${VAGRANT_VERSION}-1_amd64.deb

echo "=== Verify ==="

vagrant --version
VBoxManage --version

vagrant up
vagrant ssh uname -a

