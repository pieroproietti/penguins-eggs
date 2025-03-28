#!/usr/bin/env bash
set -x
source ./base-ubuntu-container.sh

cd $CMD_PATH
which podman 
podman --version
df -h
podman run --hostname minimal --privileged --cap-add all --ulimit nofile=32000:32000 --pull=always -v $PWD/mychroot/ci:/ci -v /dev:/dev debian:12.9 /ci/run-on-debian.sh
df -h
date
