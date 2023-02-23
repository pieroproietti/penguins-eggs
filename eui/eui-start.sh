#!/bin/env bash
if mountpoint -q "/lib/live/mount"; then 

    # if isLive
    echo "E G G S: the reproductive system of penguins"
    echo
    echo "WARNING: A fully automated system installation is about to start,"
    echo "         ALL data on the hard drive present will be ERASED!"
    echo

    # try to read /etc/hostname from /dev/sda
    sudo mount "/dev/sda2" "/mnt"
    OS_HOSTNAME=$(/usr/bin/cat /mnt/etc/hostname)
    sudo umount "/dev/sda2"

    echo "I will completely format local system: ${OS_HOSTNAME}"
    echo
    echo "Installation will start in one minute, press CTRL-C to abort!"
    echo 
    echo -n "Waiting... ";
    for _ in {1..60}; do read -rs -n1 -t1 || printf ".";done;echo

    # install system
    sudo eggs install -unrd .local
else  
    # isInstalled
    sudo rm -f /etc/sudoers.d/eui-users
    sudo rm -f /usr/bin/eui-start.sh
    sudo rm -f /etc/xdg/autostart/eui.desktop
fi


