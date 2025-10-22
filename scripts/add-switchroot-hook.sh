#!/bin/sh
# /etc/initramfs-tools/hooks/add-switchroot-hook.sh
# Ensures switch_root is included in the initramfs

PREREQ="" # Nessuna dipendenza specifica necessaria prima di questo hook

case $1 in
prereqs)
  echo "${PREREQ}"
  exit 0
  ;;
esac

# Carica le funzioni helper di initramfs-tools (necessario per copy_exec)
. /usr/share/initramfs-tools/hook-functions

# Copia /sbin/switch_root e le sue dipendenze in /sbin dentro l'initramfs
# copy_exec cerca il binario nel sistema chroot e lo copia nella destinazione
# specificata all'interno dell'initramfs ($DESTDIR/sbin), portandosi dietro
# le librerie necessarie.
copy_exec /sbin/switch_root /sbin || echo "WARNING: Failed to copy /sbin/switch_root" >&2

# Potresti aggiungere anche run-init come fallback se switch_root non fosse trovato,
# ma di solito è un link a switch_root o busybox. copy_exec dovrebbe gestire
# anche i link simbolici.
# copy_exec /sbin/run-init /sbin || echo "WARNING: Failed to copy /sbin/run-init" >&2

exit 0