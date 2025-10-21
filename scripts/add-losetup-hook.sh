#!/bin/sh
# /etc/initramfs-tools/hooks/add-losetup-hook.sh
# Assicura che losetup sia incluso nell'initramfs

PREREQ=""

case $1 in
prereqs)
  echo "${PREREQ}"
  exit 0
  ;;
esac

. /usr/share/initramfs-tools/hook-functions

# Copia losetup e le sue dipendenze nell'initramfs
copy_exec /usr/sbin/losetup /sbin || echo "WARNING: Failed to copy losetup" >&2

exit 0
