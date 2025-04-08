#!/usr/bin/env bash

set -x
export CMD_PATH=$(cd `dirname $0`; pwd)
export PROJECT_NAME="${CMD_PATH##*/}"
echo $PROJECT_NAME
export NEEDRESTART_MODE=a

# localtime
ln -sf /usr/share/zoneinfo/America/New_York /etc/localtime

# Some containers don't have hostname command
echo -e "$(hostname)\n" > /etc/hostname

eggs love -vn

if [[ "$GITHUB_ACTIONS" = "true" ]]; then
    ls -al /ci/iso/
else
    echo "TIPS use: eggs export iso -c"
    exec bash --login
fi
