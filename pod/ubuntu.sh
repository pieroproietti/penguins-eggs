#!/usr/bin/env bash

set -x
export CMD_PATH=$(cd `dirname $0`; pwd)
export PROJECT_NAME="${CMD_PATH##*/}" 
cd $CMD_PATH

# define YOLK if host=ubuntu
if [ -f /etc/os-release ]; then
    . /etc/os-release
    if [[ "$ID" == "ubuntu" ]]; then
        DEST="/var/local/yolk"
        if [ ! -d $DEST ]; then
            sudo mkdir -p $DEST
        fi
        YOLK="-v $DEST:$DEST"
    fi
fi

IMAGE=ubuntu
source podman.command.sh
