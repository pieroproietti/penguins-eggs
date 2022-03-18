#!/usr/bin/env bash

# Here we run as root and we are always on a virgin system

tmp=`mktemp -d`
cd $tmp
git clone --recurse-submodules https://github.com/axel358/Waydroid-Settings waydroid-settings
cd waydroid-settings
git submodule init
git submodule update
cd ..
mv waydroid-settings/ /usr/share/
cp /usr/share/waydroid-settings/waydroid-settings.sh /usr/bin/
chmod +x /usr/bin/waydroid-settings.sh
cp /usr/share/waydroid-settings/icon2.png /usr/lib/waydroid/data/wd-settings-icon.png
cp /usr/share/waydroid-settings/*.desktop /usr/share/applications/
