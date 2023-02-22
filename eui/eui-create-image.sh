#!/bin/env bash
sudo eggs kill -n
sudo cp eui-users /etc/sudoers.d/
sudo cp eui-start.sh /usr/bin/
sudo cp eui.desktop /etc/xdg/autostart/
sudo eggs produce -n
sudo rm /etc/sudoers.d/eui-users
sudo rm /usr/bin/eui-start.sh
sudo rm /etc/xdg/autostart/eui.desktop
sudo eggs cuckoo
