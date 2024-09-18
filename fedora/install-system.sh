#!/bin/sh
###
# Wrapper for running calamares on Debian live media
###

export QT_AUTO_SCREEN_SCALE_FACTOR=1
# Access control to run calamares as root for xwayland
#export DISPLAY=:0
#sudo mkdir -p /tmp/runtime-root/
sudo chmod 0700 /tmp/runtime-root/
export XDG_RUNTIME_DIR=/tmp/runtime-root/
xhost +SI:localuser:root
sudo -E calamares
xhost -SI:localuser:root

