#!/usr/bin/env bash

set -x
export CMD_PATH=$(cd `dirname $0`; pwd)
export PROJECT_NAME="${CMD_PATH##*/}"
echo $PROJECT_NAME
export NEEDRESTART_MODE=a

# using eggs
if [ $1==local ]; then
    mount -t devpts devpts /dev/pts
    echo "TIPS use: eggs love"
else
    eggs dad -d
    eggs tools clean -n
    eggs produce --pendrive --verbose -n
    mv /home/eggs/.mnt/*.iso /ci/iso/
    ls -al /ci/iso/
fi
