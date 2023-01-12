#!/bin/bash
CHROOT=$(mount | grep proc | grep calamares | awk '{print $3}' | sed -e "s#/proc##g")

if [ -f "$CHROOT"/etc/motd ]; then
    sed -i '/^eggs-start-message/,/^\eggs-end-message/{/^#/!{/^\$/!d;};}' "$CHROOT"/etc/motd
fi

if [ -f "$CHROOT"/etc/issue ]; then
    sed -i '/^eggs-start-message/,/^\eggs-end-message/{/^#/!{/^\$/!d;};}' "$CHROOT"/etc/issue
fi

rm -f $CHROOT/usr/share/applications/install-debian.desktop
rm -f $CHROOT/etc/systemd/system/getty@.service.d/override.conf # remove cli-autologin
