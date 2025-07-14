#!/bin/bash
CHROOT=$(mount | grep proc | grep calamares | awk '{print $3}' | sed -e "s#/proc##g")

dbus-uuidgen > $CHROOT/etc/machine-id && mkdir -p $CHROOT/var/lib/dbus && ln -sf $CHROOT/etc/machine-id $CHROOT/var/lib/dbus/machine-id