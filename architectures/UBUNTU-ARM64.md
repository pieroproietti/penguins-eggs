# Ubuntu Resolute su ARM64 con Penguins-Eggs

**Nota**: Ho dovuto interrompere questa procedura per eccessiva lentezza. Sto un un 8 x Intel(R) Core(TM) i7-6700 CPU @ 3.40GHz (1 Socket) ed utilizzo una VM con 8 GB RAM e x86-64-v2-AES 2 Sockets e 2 Cores.

In questo documento spiego come installare una `resolute-live-server-arm64.iso` tramite QEMU, estrarne il contenuto, installare `eggs` e creare una nuova ISO avviabile e installabile su architettura ARM64 (AArch64).

## 1. Prerequisiti
Assicurati di avere i pacchetti necessari sul sistema host:

```bash
sudo apt install binfmt-support \
            qemu-efi-aarch64 \
            qemu-system-arm \
            qemu-user-static \
            qemu-utils 
```

## 2. Installazione Base (resolute-live-server-arm64.iso)
Prepariamo l'ambiente di lavoro e creiamo un disco virtuale:

```bash
mkdir -p ~/arm64
cd ~/arm64

# Creiamo un disco da 10GB
qemu-img create -f qcow2 ubuntu-arm64.img 10G

# Copiamo le variabili EFI (necessarie per il boot)
# Su Ubuntu/Debian il firmware ARM64 si trova in AAVMF
cp /usr/share/AAVMF/AAVMF_VARS.fd ubuntu-efi-vars.fd
```

Avviamo l'installazione della ISO originale:
*(Assicurati di avere il file `resolute-live-server-arm64.iso` nella cartella)*.
**Nota:** Usiamo `-cpu cortex-a57` invece di `max` per migliorare le performance di emulazione durante l'installazione pesante.

```bash
qemu-system-aarch64 \
    -machine virt \
    -cpu cortex-a57 \
    -m 4G \
    -smp 2 \
    -drive if=pflash,format=raw,unit=0,file=/usr/share/AAVMF/AAVMF_CODE.fd,readonly=on \
    -drive if=pflash,format=raw,unit=1,file=./ubuntu-efi-vars.fd \
    -device virtio-blk-device,drive=hd0 \
    -drive file=ubuntu-arm64.img,format=qcow2,id=hd0,if=none \
    -device virtio-blk-device,drive=cd0 \
    -drive file=resolute-live-server-arm64.iso,format=raw,id=cd0,media=cdrom,readonly=on,if=none \
    -device virtio-net-device,netdev=net0 \
    -netdev user,id=net0 \
    -device virtio-rng-pci \
    -nographic
```

*Segui la procedura di installazione Ubuntu.*

## 3. Creazione della Chroot
Installato il sistema, usiamo `qemu-nbd` per montare il disco virtuale `.qcow2` ed estrarne il contenuto.

Crea ed esegui questo script (`extract-arm64.sh`):

```bash
# --- CONFIGURAZIONE ---
export IMG=~/arm64/ubuntu-arm64.img
export SRC=/var/tmp/resolute-arm64-src
export DEST=~/arm64/chroot

# --- 1. PREPARAZIONE ---
echo "Caricamento modulo NBD e collegamento disco..."
sudo modprobe nbd max_part=8
sudo qemu-nbd --connect=/dev/nbd0 "$IMG"
sleep 1

# --- 2. MONTAGGIO ---
echo "Montaggio partizione Root (assumiamo sia la p2)..."
sudo mkdir -p "$SRC"
sudo mount /dev/nbd0p2 "$SRC"
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
Entriamo nel sistema per installare eggs.

```bash
cd ~/arm64/chroot

# Montaggio filesystem virtuali 
sudo mount -t proc /proc proc/
sudo mount -t sysfs /sys sys/
sudo mount --rbind /dev dev/

# Entriamo in chroot emulato
# Nota: Usiamo 'env' per passare le variabili attraverso sudo
# La versione kernel è un esempio verosimile per Ubuntu Noble/Resolute
sudo env QEMU_CPU="max" QEMU_UNAME="6.8.0-31-generic" \
    chroot . /usr/bin/script -qc "/bin/bash --login" /dev/null
```

Una volta dentro la chroot:

1.  **Installa eggs:** Copia il pacchetto `.deb` di penguins-eggs ed installalo.
2.  **Crea la ISO:**
    ```bash
    eggs produce -n
    ```

## 5. Test e Installazione della ISO prodotta
Prepariamo un nuovo disco vuoto per testare l'installazione della ISO appena generata.

```bash
cp /usr/share/AAVMF/AAVMF_VARS.fd naked-efi-vars.fd
qemu-img create -f qcow2 naked-arm64.img 10G
```

Avvio dell'installazione della nostra ISO (`egg-of_ubuntu...iso`).
**Nota:** Usiamo `virtio-scsi` per compatibilità con l'installer Calamares/Krill integrato.

```bash
qemu-system-aarch64 \
  -nographic \
  -machine virt \
  -cpu cortex-a57 \
  -m 4G \
  -smp 3 \
  -drive if=pflash,format=raw,unit=0,file=/usr/share/AAVMF/AAVMF_CODE.fd,readonly=on \
  -drive if=pflash,format=raw,unit=1,file=./naked-efi-vars.fd \
  \
  -device virtio-scsi-device,id=scsi0 \
  \
  -drive file=naked-arm64.img,format=qcow2,id=hd0,if=none \
  -device scsi-hd,drive=hd0,bus=scsi0.0 \
  \
  -drive file=egg-of_ubuntu-resolute-naked_arm64_XXXX.iso,format=raw,id=cd0,media=cdrom,readonly=on,if=none \
  -device scsi-cd,drive=cd0,bus=scsi0.0 \
  \
  -device virtio-net-device,netdev=net0 \
  -netdev user,id=net0  
```