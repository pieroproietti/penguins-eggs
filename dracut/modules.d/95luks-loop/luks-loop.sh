# /percorso/sorgenti/modules.d/95luks-loop/luks-loop.sh

#!/bin/bash
set -x

# Leggi i parametri, esci se non ci sono
luks_img=$(getarg rd.luks.loop)
luks_uuid=$(getarg eggs.luks.uuid)
[ -z "$luks_img" ] || [ -z "$luks_uuid" ] && exit 0

# Attendi pazientemente che il file .img sia disponibile
# (a volte il montaggio del live system richiede un secondo)
i=0
while [ ! -f "$luks_img" ]; do
    sleep 1
    i=$((i+1))
    [ $i -gt 10 ] && exit 1 # Timeout dopo 10 secondi
done

# Collega l'immagine al primo dispositivo di loop libero
loop_dev=$(losetup -f --show "$luks_img")
[ -z "$loop_dev" ] && exit 1

# Sblocca il contenitore LUKS
crypt_name="crypted"
cryptsetup luksOpen "$loop_dev" "$crypt_name" --uuid "$luks_uuid"

# Controlla che l'operazione sia riuscita
if [ ! -b "/dev/mapper/$crypt_name" ]; then
    echo "FALLIMENTO: Impossibile sbloccare il dispositivo LUKS!"
    losetup -d "$loop_dev"
    exit 1
fi

exit 0