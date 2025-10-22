#!/bin/sh
# v21f - Manual loop, No Cleanup, NO ROOT_MOUNTED export

set -e

# --- Logging Setup ---
LOGFILE="/tmp/eggs-premount.log"; FIFO="/tmp/eggs-log.fifo"; rm -f "$LOGFILE" "$FIFO"; mkfifo "$FIFO" || exit 1; tee -a "$LOGFILE" < "$FIFO" & TEE_PID=$!; exec > "$FIFO" 2>&1; trap 'echo "EGGS: Chiusura log e pulizia FIFO..."; rm -f "$FIFO"; kill "$TEE_PID" 2>/dev/null; exit' EXIT INT TERM
# --- Logging End ---

echo "EGGS: LOGGING avviato su $LOGFILE"
echo "EGGS: script (v21f - No ROOT_MOUNTED) in live-premount partito."
modprobe dm_mod 2>/dev/null || true
modprobe dm_crypt 2>/dev/null || true
modprobe loop 2>/dev/null || true
sleep 5

# 1. Trova live media
# ... (come prima) ...
echo "EGGS: Ricerca live media..."
mkdir -p /mnt/live-media /mnt/ext4
LIVE_DEV=""
MAX_WAIT_DEV=20; COUNT_DEV=0
while [ -z "$LIVE_DEV" ] && [ $COUNT_DEV -lt $MAX_WAIT_DEV ]; do ls /dev > /dev/null; for dev in /dev/sr* /dev/sd* /dev/vd* /dev/nvme*n*; do if [ ! -b "$dev" ]; then continue; fi; if mount -o ro "$dev" /mnt/live-media 2>/dev/null; then if [ -f /mnt/live-media/live/root.img ]; then echo "EGGS: Found Live media on $dev"; LIVE_DEV=$dev; break 2; else umount /mnt/live-media 2>/dev/null; fi; fi; done; sleep 1; COUNT_DEV=$((COUNT_DEV+1)); done
if [ -z "$LIVE_DEV" ]; then echo "EGGS: ERRORE FINALE: Impossibile trovare live media dopo $MAX_WAIT_DEV sec."; ls /dev; exit 1; fi

ROOT_IMG_RO="/mnt/live-media/live/root.img"
echo "EGGS: File LUKS sorgente: $ROOT_IMG_RO"

# 2a. Associa manualmente il loop device
echo "EGGS: Associazione manuale loop device per $ROOT_IMG_RO..."
LOOP_DEV_OUTPUT=$(/sbin/losetup -f --show "$ROOT_IMG_RO" 2>/dev/null)
LOSETUP_EXIT_STATUS=$?
if [ $LOSETUP_EXIT_STATUS -ne 0 ] || [ -z "$LOOP_DEV_OUTPUT" ] || ! [ -b "$LOOP_DEV_OUTPUT" ]; then echo "EGGS: ERRORE: Associazione loop device fallita! (Exit Status: $LOSETUP_EXIT_STATUS)"; /sbin/losetup -f --show "$ROOT_IMG_RO" || true; ls /dev/loop*; exit 1; fi
LOOP_DEV="$LOOP_DEV_OUTPUT"
echo "EGGS: Loop device associato: $LOOP_DEV"

# 2b. Sblocca LUKS usando il loop device creato
echo "EGGS: In attesa della passphrase per sbloccare $LOOP_DEV..."
if ! cryptsetup open "$LOOP_DEV" live-root; then echo "EGGS: ERRORE: Sblocco LUKS fallito su $LOOP_DEV."; /sbin/losetup -d "$LOOP_DEV" || true; exit 1; fi
echo "EGGS: LUKS sbloccato ($LOOP_DEV -> live-root). Attesa per /dev/mapper/live-root..."

# Attesa mapper (come prima)
# ... [while loop] ...
if [ ! -b /dev/mapper/live-root ]; then echo "EGGS: ERRORE: Device /dev/mapper/live-root non apparso."; ls /dev/mapper; cryptsetup close live-root || true; /sbin/losetup -d "$LOOP_DEV" || true; exit 1; fi
echo "EGGS: Device mapper pronto."

# 3. Monta l'ext4 (ro) (come prima)
mount -t ext4 -o ro /dev/mapper/live-root /mnt/ext4
echo "EGGS: /dev/mapper/live-root montato su /mnt/ext4 (ro)."

# 4. Monta lo squashfs sulla destinazione finale (ro) (come prima)
echo "EGGS: Controllo variabile rootmnt: '${rootmnt}'"; if [ -z "${rootmnt}" ]; then echo "EGGS: ERRORE: \$rootmnt non definita!"; exit 1; fi; if [ ! -d "${rootmnt}" ]; then echo "EGGS: ERRORE: Directory '${rootmnt}' non esiste!"; ls /; exit 1; fi; echo "EGGS: Montaggio filesystem.squashfs su ${rootmnt} (ro)..."; if ! mount -t squashfs -o ro,loop /mnt/ext4/filesystem.squashfs "${rootmnt}"; then echo "EGGS: ERRORE: mount squashfs FALLITO!"; exit 1; fi; echo "EGGS: SquashFS montato con successo (ro)."; mount | grep "${rootmnt}"

# --- MODIFICA QUI ---
# 5. Passa il testimone a live-boot (SENZA ESPORTARE ROOT_MOUNTED)
# echo "EGGS: Esporto ROOT_MOUNTED=true..."
# export ROOT_MOUNTED=true # <-- COMMENTATO/RIMOSSO
echo "EGGS: Fatto. rootfs montato su ${rootmnt}, lascio continuare live-boot."
echo "EGGS: Log completo salvato in $LOGFILE (in initramfs)."

exit 0