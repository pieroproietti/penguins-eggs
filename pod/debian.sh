#!/usr/bin/env bash

set -x

# remove previous images
podman rmi $(podman images --quiet) -f

export CMD_PATH=$(cd `dirname $0`; pwd)
export PROJECT_NAME="${CMD_PATH##*/}" 
echo $PROJECT_NAME
cd $CMD_PATH

# replace tarballs
TARBALLS="eggs-v10.0.60-*-linux-x64.tar.gz "
rm ../mychroot/ci/$TARBALLS
cp ../dist/$TARBALLS ../mychroot/ci/

# se debian monta /var/local/yolk
if [ -f /etc/os-release ]; then
    . /etc/os-release
    if [[ "$ID" == "debian" ]]; then
        podman run --hostname minimal \
                    --privileged \
                    --ulimit nofile=32000:32000 \
                    --pull=always \
                    -it \
                    -v $PWD/mychroot/ci:/ci \
                    -v /dev:/dev \
                    -v /var/local/yolk:/var/local/yolk \
                    debian:12.9 \
                    bash
    elif [[ "$ID" == "ubuntu" ]]; then
        podman run --hostname minimal --privileged --cap-add all --ulimit nofile=32000:32000 --pull=always -it -v $PWD/mychroot/ci:/ci -v /dev:/dev debian:12.9 bash
    elif [[ "$ID" == "arch" ]]; then
        podman run --hostname minimal --privileged --cap-add all --ulimit nofile=32000:32000 --pull=always -it -v $PWD/mychroot/ci:/ci -v /dev:/dev debian:12.9 bash
    else
        echo "Sistema diverso: $ID"
    fi
fi


cd $CMD_PATH
which podman 
podman --version
df -h

# se l'host non è debian

# # when you are in the container, just run as the following:
# cd /ci/
# ls -al
# ./debian-12.9-install.sh
# #do something

# #end it
# exit
df -h
date
