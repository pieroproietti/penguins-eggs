#!/bin/bash
CHROOT=$(mount | grep proc | grep krill | awk '{print $3}' | sed -e "s#/proc##g")
rm $CHROOT/usr/share/applications/install-system.desktop
rm $CHROOT/usr/share/applications/penguins-krill.desktop
rm $CHROOT/usr/share/applications/penguins-clinstaller.desktop
