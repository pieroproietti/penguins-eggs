#!/bin/env bash
if mountpoint -q "/lib/live/mount"; then 
    # if isLive

    # try to read /etc/hostname from /dev/sda
    sudo mount "/dev/sda2" "/mnt"
    OS_HOSTNAME=$(/usr/bin/cat /mnt/etc/hostname)
    sudo umount "/dev/sda2"
    sudo echo "I will completely format local system: ${OS_HOSTNAME}"
    echo -n "Wait a minute for installation or CTRL-C to abort.";
    for _ in {1..60}; do read -rs -n1 -t1 || printf ".";done;echo

    # install system
    sudo eggs install -unrd .local
else  
    # isInstalled
    sudo rm /etc/sudoers.d/eui-users
    sudo rm /usr/bin/eui-start.sh
    sudo rm /etc/xdg/autostart/eui.desktop
fi


