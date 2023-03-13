#!/bin/bash
set -Eeuo pipefail
sudo eggs tools clean -n
sudo eggs tools ppa -n
sudo eggs kill -n
sudo cp eui-users /etc/sudoers.d/
sudo cp eui-start.sh /usr/bin/
DESKTOP=$XDG_CURRENT_DESKTOP
case $DESKTOP in
    "XFCE")
        sudo cp eui-autostart-xfce.desktop /etc/xdg/autostart/
        ;;

    "X-Cinnamon")
        sudo cp eui-autostart-cinnamon.desktop /etc/xdg/autostart/
        ;;

    "ubuntu:GNOME")
        echo "not yet supported!"
        exit 0
        ;;
esac
sudo eggs produce --release -n
sudo rm /etc/sudoers.d/eui-users
sudo rm /usr/bin/eui-start.sh
sudo rm /etc/xdg/autostart/eui-*.desktop
sudo eggs cuckoo
