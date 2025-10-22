#!/bin/sh
# /etc/initramfs-tools/hooks/add-blkid-hook.sh
# Ensures blkid is included in the initramfs

PREREQ=""
case $1 in prereqs) echo "${PREREQ}"; exit 0;; esac

. /usr/share/initramfs-tools/hook-functions

# blkid è solitamente in /sbin
copy_exec /sbin/blkid /sbin || echo "WARNING: Failed to copy /sbin/blkid" >&2

exit 0
