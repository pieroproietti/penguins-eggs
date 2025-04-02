#!/usr/bin/env bash

set -x
export CMD_PATH=$(cd `dirname $0`; pwd)
export PROJECT_NAME="${CMD_PATH##*/}"
echo $PROJECT_NAME
export NEEDRESTART_MODE=a

# localtime
ln -s /usr/share/zoneinfo/America/New_York /etc/localtime

# Some containers don't have hostname command at begine
echo -e "$(hostname)\n" > /etc/hostname

# using eggs
if [ $1==local ]; then
    echo "TIPS use: eggs love -nv"
    exec bash --login
else
    eggs dad -d
    eggs tools clean -n
    eggs produce --pendrive --verbose -n
    mv /home/eggs/.mnt/*.iso /ci/iso/
    ls -al /ci/iso/
fi
