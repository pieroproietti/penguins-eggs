#!/bin/sh
# /etc/initramfs-tools/hooks/add-udevadm-hook.sh
# Ensures udevadm is included in the initramfs

PREREQ=""
case $1 in prereqs) echo "${PREREQ}"; exit 0;; esac

. /usr/share/initramfs-tools/hook-functions

# Cerca udevadm nei percorsi comuni e copialo
copy_exec /sbin/udevadm /sbin || copy_exec /usr/bin/udevadm /bin || echo "WARNING: Failed to copy udevadm" >&2

exit 0
