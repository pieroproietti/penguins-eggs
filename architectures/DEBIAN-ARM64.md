# Debian Trixie su ARM64 con Penguins-Eggs

In questo documento spiego come installare una `debian-13.3.0-arm64-netinst.iso` tramite QEMU, estrarne il contenuto per installare `eggs` e creare una nuova ISO avviabile e installabile su architettura ARM64 (AArch64).

## 1. Prerequisiti
Assicurati di avere i pacchetti necessari sul sistema host:

```bash
sudo apt install binfmt-support \
            qemu-efi-aarch64 \
            qemu-system-arm \
            qemu-user-static \
            qemu-utils 
```
*(Nota: Su Debian il pacchetto `qemu-system-arm` fornisce solitamente anche il binario `qemu-system-aarch64`).*

## 2. Installazione Base (Debian Netinst)
Prepariamo l'ambiente di lavoro e creiamo un disco virtuale:

```bash
mkdir -p ~/arm64
cd ~/arm64

# Creiamo un disco da 10GB
qemu-img create -f qcow2 debian-arm64.img 10G

# Copiamo le variabili EFI (necessarie per il boot persistente)
# Percorso standard per il firmware UEFI ARM64 su Debian:
cp /usr/share/AAVMF/AAVMF_VARS.fd debian-efi-vars.fd
```

Avviamo l'installazione della ISO originale:
*(Assicurati di avere il file `debian-13.x.x-arm64-netinst.iso` nella cartella)*

```bash
qemu-system-aarch64 \
    -machine virt \
    -cpu max \
    -m 4G \
    -smp 2 \
    -drive if=pflash,format=raw,unit=0,file=/usr/share/AAVMF/AAVMF_CODE.fd,readonly=on \
    -drive if=pflash,format=raw,unit=1,file=./debian-efi-vars.fd \
    -device virtio-blk-device,drive=hd0 \
    -drive file=debian-arm64.img,format=qcow2,id=hd0,if=none \
    -device virtio-blk-device,drive=cd0 \
    -drive file=debian-13.3.0-arm64-netinst.iso,format=raw,id=cd0,media=cdrom,readonly=on,if=none \
    -device virtio-net-device,netdev=net0 \
    -netdev user,id=net0 \
    -nographic
```
*Segui la procedura di installazione Debian standard (via console seriale).*

## 3. Creazione della Chroot
Installato il sistema, usiamo `qemu-nbd` per montare il disco virtuale `.qcow2` ed estrarne il contenuto.

Crea ed esegui questo script (`extract-arm64.sh`):

```bash
# --- CONFIGURAZIONE ---
export IMG=~/arm64/debian-arm64.img
export SRC=/var/tmp/debian-arm64-src
export DEST=~/arm64/chroot

# --- 1. PREPARAZIONE ---
echo "Caricamento modulo NBD e collegamento disco..."
sudo modprobe nbd max_part=8
sudo qemu-nbd --connect=/dev/nbd0 "$IMG"
sleep 1

# --- 2. MONTAGGIO ---
echo "Montaggio partizione Root (assumiamo sia la p3)..."
sudo mkdir -p "$SRC"
sudo mount /dev/nbd0p3 "$SRC"
sleep 1

# --- 3. CLONAZIONE ---
echo "Avvio clonazione con Rsync..."
mkdir -p "$DEST"
sudo rsync -aAXv "$SRC/" "$DEST/"

# --- 4. PULIZIA ---
echo "Smontaggio e disconnessione..."
sudo umount "$SRC"
sudo qemu-nbd --disconnect /dev/nbd0

echo "Fatto! Il filesystem è pronto in: $DEST"
```

## 4. Ingresso in Chroot e Creazione Egg
Entriamo nel sistema per installare eggs. Grazie a `binfmt_misc`, possiamo eseguire binari ARM64 su host x86_64 trasparentemente.

```bash
cd ~/arm64/chroot

# Montaggio filesystem virtuali 
sudo mount -t proc /proc proc/
sudo mount -t sysfs /sys sys/
sudo mount --rbind /dev dev/

# Entriamo in chroot emulato
# Impostiamo una versione kernel ARM64 fittizia
sudo env QEMU_UNAME="6.12.63+deb13-arm64" chroot . /bin/bash
```

Una volta dentro la chroot:

1.  **Installa eggs:** Copia il pacchetto `.deb` di penguins-eggs ed installalo.
2.  **Crea la ISO:**
    ```bash
    eggs produce --release -n
    ```

## 5. Test e Installazione della ISO prodotta
Prepariamo un nuovo disco vuoto per testare l'installazione della ISO appena generata.

```bash
cp /usr/share/AAVMF/AAVMF_VARS.fd naked-efi-vars.fd
qemu-img create -f qcow2 naked-arm64.img 10G
```

Avvio dell'installazione della nostra ISO (`egg-of_debian...iso`).
**Nota:** Usiamo `virtio-scsi` invece di `virtio-blk` affinché l'installer Krill rilevi il disco come `/dev/sda` (standard SCSI), garantendo compatibilità e rilevamento automatico.

```bash
qemu-system-aarch64 \
  -nographic \
  -machine virt \
  -cpu max \
  -m 2G \
  -smp 4 \
  -drive if=pflash,format=raw,unit=0,file=/usr/share/AAVMF/AAVMF_CODE.fd,readonly=on \
  -drive if=pflash,format=raw,unit=1,file=./naked-efi-vars.fd \
  \
  -device virtio-scsi-device,id=scsi0 \
  \
  -drive file=naked-arm64.img,format=qcow2,id=hd0,if=none \
  -device scsi-hd,drive=hd0,bus=scsi0.0 \
  \
  -drive file=egg-of_debian-trixie-naked_arm64_2026-01-11_1831.iso,format=raw,id=cd0,media=cdrom,readonly=on,if=none \
  -device scsi-cd,drive=cd0,bus=scsi0.0 \
  \
  -device virtio-net-device,netdev=net0 \
  -netdev user,id=net0  
```