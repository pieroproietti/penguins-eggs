# Debian Trixie su RISC-V con Penguins-Eggs

In questo documento spiego come installare una `debian-13.2.0-riscv64-netinst.iso` tramite QEMU, estrarne il contenuto per installare `eggs` e creare una nuova ISO avviabile e installabile su architettura RISC-V.

## 1. Prerequisiti
Assicurati di avere i pacchetti necessari sul sistema host:

```bash
sudo apt install binfmt-support \
            qemu-efi-riscv64 \
            qemu-system-riscv64 \
            qemu-user-static \
            qemu-utils 
```

## 2. Installazione Base (resolute-live-server-riscv64.iso)
Prepariamo l'ambiente di lavoro e creiamo un disco virtuale:

```bash
mkdir -p ~/riscv
cd ~/riscv

# Creiamo un disco da 10GB
qemu-img create -f qcow2 ubuntu-riscv.img 10G

# Copiamo le variabili EFI (necessarie per il boot)
cp /usr/share/qemu-efi-riscv64/RISCV_VIRT_VARS.fd ubuntu-efi-vars.fd
```

Avviamo l'installazione della ISO originale:
*(Assicurati di avere il file `resolute-live-server-riscv64.iso` nella cartella)*

```bash
qemu-system-riscv64 \
    -machine virt \
    -cpu rva23s64 \
    -m 4G \
    -smp 2 \
    -drive if=pflash,format=raw,unit=0,file=/usr/share/qemu-efi-riscv64/RISCV_VIRT_CODE.fd,readonly=on \
    -drive if=pflash,format=raw,unit=1,file=./ubuntu-efi-vars.fd \
    -device virtio-blk-device,drive=hd0 \
    -drive file=ubuntu-riscv.img,format=qcow2,id=hd0,if=none \
    -device virtio-blk-device,drive=cd0 \
    -drive file=resolute-live-server-riscv64.iso,format=raw,id=cd0,media=cdrom,readonly=on,if=none \
    -device virtio-net-device,netdev=net0 \
    -netdev user,id=net0 \
    -nographic
```

*Segui la procedura di installazione.*

## 3. Creazione della Chroot
Installato il sistema, usiamo `qemu-nbd` per montare il disco virtuale `.qcow2` ed estrarne il contenuto.

Crea ed esegui questo script (`extract.sh`):

```bash
# --- CONFIGURAZIONE ---
export IMG=~/riscv/resolute-riscv.img
export SRC=/var/tmp/resolute-riscv-src
export DEST=~/riscv/chroot

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
Entriamo nel sistema per installare eggs. Grazie al flag `F` di `binfmt_misc` su UBUNTU, non serve copiare qemu-static dentro la chroot.

```bash
cd ~/riscv/chroot

# Montaggio filesystem virtuali 
sudo mount -t proc /proc proc/
sudo mount -t sysfs /sys sys/
sudo mount --rbind /dev dev/

# Entriamo in chroot emulato
# Nota: La versione del kernel in QEMU_UNAME è fittizia per ingannare uname
sudo QEMU_CPU="max" QEMU_UNAME="6.17.0-5-generic" \
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
cp /usr/share/qemu-efi-riscv64/RISCV_VIRT_VARS.fd naked-efi-vars.fd
qemu-img create -f qcow2 naked-riscv.img 10G
```

Avvio dell'installazione della nostra ISO (`egg-of_debian...iso`).
**Nota:** Usiamo `virtio-scsi` invece di `virtio-blk` affinché l'installer Krill rilevi il disco come `/dev/sda` (standard SCSI), garantendo compatibilità e rilevamento automatico.

```bash
qemu-system-riscv64 \
  -nographic \
  -machine virt \
  -m 4G \
  -smp 3 \
  -drive if=pflash,format=raw,unit=0,file=/usr/share/qemu-efi-riscv64/RISCV_VIRT_CODE.fd,readonly=on \
  -drive if=pflash,format=raw,unit=1,file=./naked-efi-vars.fd \
  \
  -device virtio-scsi-device,id=scsi0 \
  \
  -drive file=naked-riscv.img,format=qcow2,id=hd0,if=none \
  -device scsi-hd,drive=hd0,bus=scsi0.0 \
  \
  -drive file=egg-of_ubuntu-resolute-naked_riscv64_2026-01-10_.iso,format=raw,id=cd0,media=cdrom,readonly=on,if=none \
  -device scsi-cd,drive=cd0,bus=scsi0.0 \
  \
  -device virtio-net-device,netdev=net0 \
  -netdev user,id=net0  
```

qemu-system-riscv64 \
    -machine virt \
    -cpu max,v=true,vlen=128,vext_spec=v1.0,zba=true,zbb=true,zbc=true,zbs=true,zicond=true \
    -m 4G -smp 4 \
    -drive if=pflash,format=raw,unit=0,file=/usr/share/qemu-efi-riscv64/RISCV_VIRT_CODE.fd,readonly=on \
    -drive if=pflash,format=raw,unit=1,file=./resolute-efi-vars.fd \
    -device virtio-blk-device,drive=hd0 \
    -drive file=naked-riscv.img,format=qcow2,id=hd0,if=none \
    -device virtio-blk-device,drive=cd0 \
    -drive file=egg-of_ubuntu-resolute-naked_riscv64_2026-01-10_0949.iso,format=raw,id=cd0,media=cdrom,readonly=on,if=none \
    -netdev user,id=net0,hostfwd=tcp::2222-:22 \
    -device virtio-net-device,netdev=net0 \
    -nographic
