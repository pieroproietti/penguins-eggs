#!/bin/bash
CHROOT=$(mount | grep proc | grep calamares | awk '{print $3}' | sed -e "s#/proc##g")

if [ -f "$CHROOT"/etc/motd ]; then
    sed -i '/^eggs-start-message/,/^\eggs-end-message/{/^#/!{/^\$/!d;};}' "$CHROOT"/etc/motd
fi

if [ -f "$CHROOT"/etc/issue ]; then
    sed -i '/^eggs-start-message/,/^\eggs-end-message/{/^#/!{/^\$/!d;};}' "$CHROOT"/etc/issue
fi

# remove calamares link desktop
rm -f $CHROOT/usr/share/applications/install-system.desktop

# remove CLI autologin if exists
rm -f $CHROOT/etc/systemd/system/getty@.service.d/override.conf

# remove 10-installer if exists
rm -f $CHROOT/etc/sudoers.d/10-installer

