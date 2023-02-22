#!/bin/env bash
eggs kill
cp eui.sudoers /etc/sudoers.d/
cp eui-start.sh /usr/bin/
cp eui.desktop /etc/xdg/autostart/
eggs produce
#rm /etc/sudoers.d/eui.sudoers 
#rm /usr/bin/eui-start.sh
#rm /etc/xdg/autostart/eui.desktop
eggs cuckoo
