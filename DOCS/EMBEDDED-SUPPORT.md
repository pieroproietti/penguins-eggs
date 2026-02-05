# PENGUINS-EGGS: IMPLEMENTAZIONE SUPPORTO EMBEDDED (RISC-V / ARM)
# Target: Spacemit K1 (Muse Book), Raspberry Pi, e UEFI generico.

## 1. INTRODUZIONE E CONTESTO
Le immagini ISO ibride standard (ISO9660) non sono compatibili con i bootloader embedded (U-Boot, RPi Firmware) che mancano di driver per CD-ROM/ISO.
Questi dispositivi richiedono:
1.  Un filesystem leggibile nativamente (FAT32 o EXT4).
2.  Una tabella delle partizioni reale (MBR o GPT).
3.  File specifici nella root (Device Tree `.dtb`, `extlinux.conf`, o firmware proprietari).

Questo documento descrive l'aggiornamento di `eggs produce` per generare immagini `.img` grezze invece di ISO quando necessario.

---

## 2. MODIFICHE ALLA CLI (`produce`)

### Nuova Logica
Il comando `eggs produce` accetterà un nuovo flag:

* **Flag:** `--img <path/to/file.dtb>`
* **Comportamento:**
    1.  **Standard (Nessun flag):** Genera `.iso` con xorriso (comportamento attuale).
    2.  **Embedded (`--img` rilevato):**
        * Verifica esistenza file DTB.
        * **Switch Formato:** Output forzato a `.img` (Raw Disk Image).
        * Attiva la pipeline di partizionamento ed estrazione descritta sotto.

---

## 3. ARCHITETTURA DEL FILESYSTEM "UNIVERSALE"
Per garantire compatibilità trasversale (PC UEFI, RISC-V U-Boot, Raspberry Pi), l'immagine `.img` adotterà uno schema a doppia partizione.

| Partizione | Tipo | Label | FS | Dimensione | Contenuto Principale |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **P1** | Primaria | `BOOT` | **FAT32** | ~512 MB | Bootloader configs, Kernel, Initrd, DTB, EFI. |
| **P2** | Primaria | `ROOT` | **EXT4** | Auto (Restante) | Il sistema operativo (`filesystem.squashfs`). |

### Mappatura Sorgente (ISO_BUILD) -> Destinazione (IMG)

#### Partizione 1: BOOT (FAT32)
*La "Chiave Inglese": deve contenere i file di avvio per ogni architettura.*
1.  **UEFI (PC):** `ISO/EFI/` -> `P1:/EFI/`
2.  **Kernel:** `ISO/live/vmlinuz-*` -> `P1:/live/vmlinuz`
3.  **Initrd:** `ISO/live/initrd.img-*` -> `P1:/live/initrd.img`
4.  **Hardware (RISC-V):** File passato da `--dtb` -> `P1:/<nome>.dtb`
5.  **Config (RISC-V):** Generazione dinamica di `P1:/extlinux/extlinux.conf`
6.  **Firmware (RPi - Opzionale):** `bootcode.bin`, `start.elf`, `config.txt` -> `P1:/`

#### Partizione 2: ROOT (EXT4)
*Il Payload.*
1.  **System:** `ISO/live/filesystem.squashfs` -> `P2:/live/filesystem.squashfs`

---

## 4. LOGICA DI IMPLEMENTAZIONE (SCRIPTING)

Pseudo-codice per la generazione dell'immagine `.img` post-compilazione.

```bash
#!/bin/bash
# Variabili input
SRC_DIR="./eggs_iso_build_path"  # Cartella temporanea di build
DTB_PATH="$1"                    # Dal flag --dtb
IMG_NAME="eggs-output.img"

# 1. Rilevamento Versioni Kernel
KERNEL_BIN=$(basename $(find "$SRC_DIR/live" -name "vmlinuz-*" | head -n1))
INITRD_BIN=$(basename $(find "$SRC_DIR/live" -name "initrd.img-*" | head -n1))
DTB_NAME=$(basename "$DTB_PATH")

# 2. Calcolo Spazio
# ROOT necessita dimensione squashfs + margine (es. 1GB)
ROOT_SIZE=$(du -sm "$SRC_DIR/live/filesystem.squashfs" | cut -f1)
TOTAL_SIZE=$((ROOT_SIZE + 1536)) # 1GB margine + 512MB Boot

echo "Creating raw image: ${TOTAL_SIZE}MB..."
dd if=/dev/zero of="$IMG_NAME" bs=1M count=0 seek=$TOTAL_SIZE status=none

# 3. Partizionamento Ibrido
# P1: 512MB FAT32 (Bootable)
# P2: Resto EXT4 (Linux)
sfdisk "$IMG_NAME" <<EOF
,512M,c,*
,,83
EOF

# 4. Loopback Setup
LOOP_DEV=$(sudo losetup -fP --show "$IMG_NAME")

# 5. Formattazione
sudo mkfs.vfat -F 32 -n "BOOT" "${LOOP_DEV}p1"
sudo mkfs.ext4 -L "ROOT" -m 0 -q "${LOOP_DEV}p2"

# 6. Mount & Copia
sudo mkdir -p /mnt/tmp_boot /mnt/tmp_root
sudo mount "${LOOP_DEV}p1" /mnt/tmp_boot
sudo mount "${LOOP_DEV}p2" /mnt/tmp_root

# --- COPIA P1 (BOOT) ---
sudo mkdir -p /mnt/tmp_boot/live
sudo cp "$SRC_DIR/live/$KERNEL_BIN" /mnt/tmp_boot/live/
sudo cp "$SRC_DIR/live/$INITRD_BIN" /mnt/tmp_boot/live/
sudo cp -r "$SRC_DIR/EFI" /mnt/tmp_boot/
sudo cp "$DTB_PATH" /mnt/tmp_boot/

# --- COPIA P2 (ROOT) ---
sudo mkdir -p /mnt/tmp_root/live
sudo cp "$SRC_DIR/live/filesystem.squashfs" /mnt/tmp_root/live/

# 7. Generazione EXTLINUX (U-Boot Logic)
sudo mkdir -p /mnt/tmp_boot/extlinux
cat <<EOF | sudo tee /mnt/tmp_boot/extlinux/extlinux.conf >/dev/null
label eggs-linux
  kernel /live/$KERNEL_BIN
  initrd /live/$INITRD_BIN
  fdt /$DTB_NAME
  append boot=live components quiet splash console=ttyS0,115200n8 console=tty0 root=LABEL=ROOT
EOF

# 8. Cleanup
sudo umount /mnt/tmp_boot /mnt/tmp_root
sudo losetup -d "$LOOP_DEV"
rmdir /mnt/tmp_boot /mnt/tmp_root