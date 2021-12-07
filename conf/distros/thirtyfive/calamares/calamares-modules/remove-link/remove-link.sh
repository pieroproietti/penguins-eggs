#!/bin/bash
CHROOT=$(mount | grep proc | grep calamares | awk '{print $3}' | sed -e "s#/proc##g")
rm $CHROOT/usr/share/applications/install-debian.desktop
