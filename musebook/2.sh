# 1. Monta l'immagine su un loop device libero
# --show ci dice quale device ha usato (es. /dev/loop0)
LOOPDEV=$(sudo losetup -fP --show eggs-musebook.img)
echo "Immagine montata su: $LOOPDEV"

# 2. Formatta la partizione di BOOT (p5) in EXT4
sudo mkfs.ext4 -L "MUSE_BOOT" ${LOOPDEV}p5

# 3. Formatta la partizione di ROOT (p6) in EXT4
sudo mkfs.ext4 -L "MUSE_ROOT" ${LOOPDEV}p6

# 4. Prepara le cartelle di montaggio
sudo mkdir -p /mnt/eggs_target
sudo mount ${LOOPDEV}p6 /mnt/eggs_target
sudo mkdir -p /mnt/eggs_target/boot
sudo mount ${LOOPDEV}p5 /mnt/eggs_target/boot

echo "Pronto per la copia dei file in /mnt/eggs_target"

