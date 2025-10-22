#!/bin/sh
# /etc/initramfs-tools/hooks/add-rsync-hook.sh
# Ensures rsync is included in the initramfs

PREREQ=""
case $1 in prereqs) echo "${PREREQ}"; exit 0;; esac

. /usr/share/initramfs-tools/hook-functions

# rsync è solitamente in /usr/bin
copy_exec /usr/bin/rsync /bin || echo "WARNING: Failed to copy /usr/bin/rsync" >&2

exit 0
