# DEBIAN trixie riscv
In questo README spiego come installare debian-13.2.0-riscv64-netinst.iso attraverso qemu, quindi installeremo eggs ed andremo a creare una ISO installabile.

# Installazione debian-13.2.0-riscv64-netinst.iso
Avremo bisogno di creare un volume da 10 GB:
```
qemu-img create -f qcow2 debian-riscv.img 10G
```

Installiamo, se non presente, il pacchetto qemu-efi-riscv64:
```
sudo apt install qemu-efi-riscv64
```

e copiamo /usr/share/qemu-efi-riscv64/RISCV_VIRT_VARS.fd  in  efi-vars.fd
```
cp /usr/share/qemu-efi-riscv64/RISCV_VIRT_VARS.fd efi-vars.fd
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


# Creazione della chroot
Per far funzionare la chroot abbiamo bisogno del pacchetto  binfmt-support, se non gia installato:
```
apt install binfmt-support
```


Copia ed incolla il seguente codice:
```
# --- CONFIGURAZIONE ---
export IMG=~/riscv/debian-riscv.img
# Cartella temporanea dove montare il disco QEMU
export SRC=/var/tmp/debian-riscv-src
# Cartella finale dove lavorerai
export DEST=~/riscv/chroot

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
```

A questo punto la nostra chroot e pronta, per avviarla dobbiamo montare i file system virtuali ed avviarla.
```
cd chroot
cd g4mount-vfs-here
sudo QEMU_UNAME="6.12.57+deb13-riscv64" chroot . /bin/bash
```
Copiamo il pacchetto penguins-eggs della chroot sotto /tmp ed installiamo eggs:
```
apt install /tmp/penguins-eggs-...
```

Siamo pronti a creare la ISO con le solite modalita:
```
eggs love -n
```

Una volta che la ISO e pronta, proviamo ad installarla


## Disco installazione
```
qemu-img create -f qcow2 naked-riscv.img 10G
```

## Installazione
Poiche eggs krill "vede" solo i /dev/sd* gli faremo vedere il disco come scsi

```
qemu-system-riscv64 \
  -nographic \
  -machine virt \
  -m 4G \
  -smp 4 \
  -drive if=pflash,format=raw,unit=0,file=/usr/share/qemu-efi-riscv64/RISCV_VIRT_CODE.fd,readonly=on \
  -drive if=pflash,format=raw,unit=1,file=./efi-vars.fd \
  \
  -device virtio-scsi-device,id=scsi0 \
  \
  -drive file=naked-riscv.img,format=qcow2,id=hd0,if=none \
  -device scsi-hd,drive=hd0,bus=scsi0.0 \
  \
  -drive file=egg-of_debian-trixie-naked_riscv64_2026-01-08_1149.iso,format=raw,id=cd0,media=cdrom,readonly=on,if=none \
  -device scsi-cd,drive=cd0,bus=scsi0.0 \
  \
  -device virtio-net-device,netdev=net0 \
  -netdev user,id=net0  
  ```
