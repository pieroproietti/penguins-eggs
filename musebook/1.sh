# 1. Crea il file vuoto
echo "Creazione file immagine..."
truncate -s 4G eggs-musebook.img

# 2. Crea la nuova tabella GPT
echo "Creazione tabella partizioni..."
sgdisk -o eggs-musebook.img

# 3. Definisci le partizioni di sistema (SPL, Env, U-Boot, Reserved)
# Queste devono coincidere ESATTAMENTE con l'hardware
sgdisk -n 1:256:767    -c 1:"spl"      -t 1:8300 eggs-musebook.img
sgdisk -n 2:768:895    -c 2:"env"      -t 2:8300 eggs-musebook.img
sgdisk -n 3:2048:4095  -c 3:"uboot"    -t 3:8300 eggs-musebook.img
sgdisk -n 4:4096:8191  -c 4:"reserved" -t 4:8300 eggs-musebook.img

# 4. Definisci le partizioni Utente (Boot e Root)
# Partizione 5: BOOT (256MB)
sgdisk -n 5:8192:532479 -c 5:"boot" -t 5:8300 eggs-musebook.img

# Partizione 6: ROOT (Tutto il resto)
sgdisk -n 6:532480:0    -c 6:"rootfs" -t 6:8300 eggs-musebook.img

# 5. Inietta i Bootloader (Il trapianto)
echo "Scrittura Bootloader..."
dd if=spl.bin of=eggs-musebook.img bs=512 seek=256 conv=notrunc status=none
dd if=uboot.itb of=eggs-musebook.img bs=512 seek=2048 conv=notrunc status=none

echo "Immagine creata e bootloader flashati!"

