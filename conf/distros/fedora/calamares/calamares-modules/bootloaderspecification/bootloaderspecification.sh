#!/bin/bash
CHROOT=$(mount | grep proc | grep calamares | awk '{print $3}' | sed -e "s#/proc##g")


# Trova l'ultimo kernel installato (escludendo le voci di 'rescue')
KERNEL_VERSION=$(ls $CHROOT/boot/vmlinuz-* | grep -v rescue | sed 's/.*vmlinuz-//' | sort -V | tail -n 1)

if [ -z "$KERNEL_VERSION" ]; then
    echo "ERRORE: Nessun kernel trovato in /boot"
    exit 1
fi

# Trova l'UUID del device di root
# findmnt è più affidabile di blkid in un chroot
ROOT_UUID=$(findmnt -n -o UUID --target /)

# Prendi l'ID della macchina per il nome del file BLS
MACHINE_ID=$(cat $CHROOT/etc/machine-id)

# Costruisci il percorso completo del file BLS
BLS_FILE="$CHROOT/boot/loader/entries/${MACHINE_ID}-${KERNEL_VERSION}.conf"

echo "Creazione del file BLS in: ${BLS_FILE}"

# Scrivi il contenuto nel file usando un "Here Document" (cat << EOF)
cat > "${BLS_FILE}" << EOF
title Fedora Linux ($KERNEL_VERSION)
version $KERNEL_VERSION
linux /boot/vmlinuz-${KERNEL_VERSION}
initrd /boot/initramfs-${KERNEL_VERSION}.img
options root=UUID=${ROOT_UUID} ro
EOF

echo "File BLS creato con successo."

# --- Fine Script ---