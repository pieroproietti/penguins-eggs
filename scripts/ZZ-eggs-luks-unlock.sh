#!/bin/sh
# Questo è lo SCRIPT RUNTIME (in live-premount)

set -e

# --- INIZIO BLOCCO LOGGING ---
LOGFILE="/tmp/eggs-premount.log"
FIFO="/tmp/eggs-log.fifo"

# Pulisci vecchi file di log/fifo se esistono
rm -f "$LOGFILE" "$FIFO"

# Crea la named pipe
if ! mkfifo "$FIFO"; then
    echo "EGGS: FATALE: Impossibile creare FIFO $FIFO"
    exit 1 # Non si può loggare
fi

# Avvia tee in background: legge dalla FIFO e appende sia al log che alla console
tee -a "$LOGFILE" < "$FIFO" &
TEE_PID=$!

# Reindirizza tutto lo stdout e stderr futuri dello script alla FIFO
exec > "$FIFO" 2>&1

# Imposta una trap per pulire la FIFO e terminare tee all'uscita dello script
trap 'echo "EGGS: Chiusura log e pulizia FIFO..."; rm -f "$FIFO"; kill "$TEE_PID" 2>/dev/null; exit' EXIT INT TERM
# --- FINE BLOCCO LOGGING ---


echo "EGGS: LOGGING avviato su $LOGFILE"
echo "EGGS: script (v20) in live-premount partito."
echo "EGGS: Assumo che udev e /dev siano pronti..."

# PAUSA AGGIUNTIVA
echo "EGGS: Attesa extra (5 secondi)..."
sleep 5

# 1. Trova live media
echo "EGGS: Ricerca live media..."
mkdir -p /mnt/live-media || echo "EGGS: ERRORE mkdir /mnt/live-media"
mkdir -p /mnt/ext4 || echo "EGGS: ERRORE mkdir /mnt/ext4"
LIVE_DEV=""
MAX_WAIT_DEV=20
COUNT_DEV=0
while [ -z "$LIVE_DEV" ] && [ $COUNT_DEV -lt $MAX_WAIT_DEV ]; do
    #echo "---------- INIZIO CICLO RICERCA ($COUNT_DEV/$MAX_WAIT_DEV) ----------"
    #echo "EGGS: Contenuto attuale di /dev:"
    ls /dev # L'output ora andrà al log E alla console
    
    for dev in /dev/sr* /dev/sd* /dev/vd* /dev/nvme*n*; do
        if [ ! -b "$dev" ]; then continue; fi
        # echo "EGGS: Provo $dev..."
        if mount -o ro "$dev" /mnt/live-media 2>/dev/null; then
            echo "EGGS: Mount $dev OK."
            if [ -f /mnt/live-media/live/root.img ]; then
                echo "EGGS: Found Live media on $dev"
                LIVE_DEV=$dev
                break 2
            else
                echo "EGGS: root.img non trovato su $dev."
                umount /mnt/live-media 2>/dev/null
            fi
        else
             echo "EGGS: Mount $dev fallito."
        fi
    done
    
    # echo "---------- FINE CICLO RICERCA ($COUNT_DEV/$MAX_WAIT_DEV) ----------"
    sleep 1
    COUNT_DEV=$((COUNT_DEV+1))
done

if [ -z "$LIVE_DEV" ]; then
    echo "EGGS: ERRORE FINALE: Impossibile trovare live media dopo $MAX_WAIT_DEV sec."
    ls /dev
    exit 1 # NON usare exec /bin/sh, lascia che live-boot gestisca il fallimento
fi

ROOT_IMG_RO="/mnt/live-media/live/root.img"
ROOT_IMG="/tmp/root.img.rw"

# 2. Sblocca LUKS
echo "EGGS: In attesa della passphrase per sbloccare $ROOT_IMG_RO..."
if ! cryptsetup open "$ROOT_IMG_RO" live-root; then
    echo "EGGS: ERRORE: Sblocco LUKS fallito."
    exit 1
fi
echo "EGGS: LUKS sbloccato. Attesa per /dev/mapper/live-root..."

# Loop di attesa per il device mapper
MAX_WAIT_MAP=10
COUNT_MAP=0
while [ ! -b /dev/mapper/live-root ] && [ $COUNT_MAP -lt $MAX_WAIT_MAP ]; do
    echo "EGGS: Aspetto /dev/mapper/live-root... ($COUNT_MAP/$MAX_WAIT_MAP)"
    sleep 1
    COUNT_MAP=$((COUNT_MAP+1))
done

if [ ! -b /dev/mapper/live-root ]; then
    echo "EGGS: ERRORE: Device /dev/mapper/live-root non apparso dopo $MAX_WAIT_MAP sec."
    ls /dev/mapper
    cryptsetup close live-root || true
    rm "$ROOT_IMG" || true
    exit 1
fi
echo "EGGS: Device mapper pronto."

# 3. Monta l'ext4 (rw)
mount -t ext4 -o rw /dev/mapper/live-root /mnt/ext4

# 4. Monta lo squashfs sulla destinazione finale
echo "EGGS: Montaggio filesystem.squashfs su ${rootmnt}..."
mount -o loop /mnt/ext4/filesystem.squashfs "${rootmnt}"

# 5. Pulisci
umount /mnt/ext4
cryptsetup close live-root
rm "$ROOT_IMG" # Come nota, questa variabile non sembra usata, il log mostrerà l'errore "file not found"
umount /mnt/live-media

# 7. Passa il testimone
export ROOT_MOUNTED=true
echo "EGGS: Fatto. rootfs pronto, avvio del sistema."
echo "EGGS: Log completo salvato in $LOGFILE (in initramfs)."

# L'uscita pulita attiverà la 'trap' per chiudere il logging
exit 0