#!/bin/bash
CHROOT=$(mount | grep proc | grep calamares | awk '{print $3}' | sed -e "s#/proc##g")

if [ -f "$CHROOT"/etc/motd ]; then
    /usr/bin/sed -i '/^eggs-start-message/,/^\eggs-end-message/{/^#/!{/^\$/!d;};}' "$CHROOT"/etc/motd
fi

if [ -f "$CHROOT"/etc/issue ]; then
    /usr/bin/sed -i '/^eggs-start-message/,/^\eggs-end-message/{/^#/!{/^\$/!d;};}' "$CHROOT"/etc/issue
fi
