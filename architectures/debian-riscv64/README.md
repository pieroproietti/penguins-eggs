# DEBIAN trixie riscv


## Disco installazione
```
qemu-img create -f qcow2 debian-riscv.img 10G
```

## Installazione
```
qemu-system-riscv64 \
    -machine virt \
    -cpu rv64 \
    -m 2G \
    -smp 2 \
    -drive if=pflash,format=raw,unit=0,file=/usr/share/qemu-efi-riscv64/RISCV_VIRT_CODE.fd,readonly=on \
    -drive if=pflash,format=raw,unit=1,file=./efi-vars.fd \
    -device virtio-blk-device,drive=hd0 \
    -drive file=debian-riscv.img,format=qcow2,id=hd0,if=none \
    -device virtio-blk-device,drive=cd0 \
    -drive file=debian-13.2.0-riscv64-netinst.iso,format=raw,id=cd0,media=cdrom,readonly=on,if=none \
    -device virtio-net-device,netdev=net0 \
    -netdev user,id=net0 \
    -nographic
```
# comendo di avvio sistema installato
```
qemu-system-riscv64 \
    -machine virt \
    -cpu rv64 \
    -m 2G \
    -smp 2 \
    -drive if=pflash,format=raw,unit=0,file=/usr/share/qemu-efi-riscv64/RISCV_VIRT_CODE.fd,readonly=on \
    -drive if=pflash,format=raw,unit=1,file=./efi-vars.fd \
    -device virtio-blk-device,drive=hd0 \
    -drive file=debian-riscv.img,format=qcow2,id=hd0,if=none \
    -device virtio-net-device,netdev=net0 \
    -netdev user,id=net0 \
    -nographic
```

# 1. Crea il disco overlay (usa l'immagine base, scrive solo le differenze su test.qcow2)
qemu-img create -f qcow2 -F qcow2 -b debian-riscv.img debian-test.qcow2

# 2. Copia le variabili EFI (così se rompi il bootloader, l'originale è salvo)
cp efi-vars.fd efi-vars-test.fd

# Comando di avvio per test con ssh
```
qemu-system-riscv64 \
    -machine virt \
    -cpu rv64 \
    -m 4G \
    -smp 2 \
    -drive if=pflash,format=raw,unit=0,file=/usr/share/qemu-efi-riscv64/RISCV_VIRT_CODE.fd,readonly=on \
    -drive if=pflash,format=raw,unit=1,file=./efi-vars-test.fd \
    -device virtio-blk-device,drive=hd0 \
    -drive file=debian-test.qcow2,format=qcow2,id=hd0,if=none \
    -device virtio-net-device,netdev=net0 \
    -netdev user,id=net0,hostfwd=tcp::2222-:22 \
    -nographic
```

# Usiamolo con 

# --- CONFIGURAZIONE ---
export IMG=~/debian-riscv/debian-riscv.img
# Cartella temporanea dove montare il disco QEMU
export SRC=/var/tmp/debian-riscv-src
# Cartella finale dove lavorerai
export DEST=~/debian-riscv/chroot

# --- 1. PREPARAZIONE ---
echo "Caricamento modulo NBD e collegamento disco..."
sudo modprobe nbd max_part=8
sudo qemu-nbd --connect=/dev/nbd0 "$IMG"
sleep 1

# --- 2. MONTAGGIO ---
echo "Montaggio partizione Root (p2)..."
sudo mkdir -p "$SRC"
# CORREZIONE: Il device è in /dev/, non in /tmp/
sudo mount /dev/nbd0p2 "$SRC"
sleep 1

# --- 3. CLONAZIONE ---
echo "Avvio clonazione con Rsync..."
mkdir -p "$DEST"
# CORREZIONE IMPORTANTE: "$SRC/" con lo slash finale copia il CONTENUTO.
# Senza slash, creerebbe una cartella 'debian-riscv-src' dentro 'chroot'.
sudo rsync -aAXv "$SRC/" "$DEST/"

# --- 4. PULIZIA ---
echo "Smontaggio e disconnessione..."
sudo umount "$SRC"
sudo qemu-nbd --disconnect /dev/nbd0

echo "Fatto! Il filesystem è estratto in: $DEST"
# 5. Monta i filesystem di sistema (Necessario per apt/proc)
for i in /dev /dev/pts /proc /sys /run; do sudo mount -B $i $DEST/$i; done
# 4. Entra (Senza copiare nulla!)
sudo chroot $DEST


## Disco installazione
```
qemu-img create -f qcow2 naked-riscv.img 10G
```

## Installazione
```
sudo qemu-system-riscv64 \
    -machine virt \
    -cpu rv64 \
    -m 2G \
    -smp 2 \
    -drive if=pflash,format=raw,unit=0,file=/usr/share/qemu-efi-riscv64/RISCV_VIRT_CODE.fd,readonly=on \
    -drive if=pflash,format=raw,unit=1,file=./efi-vars.fd \
    -device virtio-blk-device,drive=hd0 \
    -drive file=naked-riscv.img,format=qcow2,id=hd0,if=none \
    -device virtio-blk-device,drive=cd0 \
    -drive file=egg-of_debian-trixie-naked_riscv64_2026-01-07_1157.iso,format=raw,id=cd0,media=cdrom,readonly=on,if=none \
    -device virtio-net-device,netdev=net0 \
    -netdev user,id=net0 \
    -nographic
