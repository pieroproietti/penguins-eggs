#!/usr/bin/env bash

set -x
source ./10000-ubuntu-ci-server.sh

cd $CMD_PATH
which podman 
podman --version
df -h

cd $CMD_PATH

# install penguins-eggs from tarballs no needing here really, but...
cd ./mychroot/ci

# packages to be added tarballs
sudo ./minimal/debian-tarballs-requirements.sh

# installing ggs
sudo ./penguins-eggs-tarballs-install.sh
sudo eggs dad -d
sudo eggs produce --pendrive -n --verbose

df -h
date
