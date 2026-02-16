# Guida Tecnica: Forzare il Boot da USB su Spacemit Muse Book (K1 SoC)

Questa guida riassume i passaggi per configurare un laptop basato su SoC Spacemit K1 (RISC-V) per avviarsi da USB, superando le limitazioni del firmware di fabbrica che ignora i tasti di boot standard e le ISO generiche.

## Il Problema
* Nessun Menu di Boot: I tasti standard (ESC, F7, F11, Spazio) spesso non interrompono il boot automatico.

* U-Boot Bloccato: La configurazione di avvio è cablata nel codice e la partizione delle variabili d'ambiente (env) è spesso non inizializzata, rendendo inefficace `fw_setenv`.

* ISO Incompatibili: Le immagini ISO standard (UEFI/Grub) non contengono il Device Tree (DTB) specifico per il laptop, quindi il bootloader le ignora o mostra schermo nero.

## Parte 1: Abilitare la modifica dell'ordine di avvio (Host Side)
L'obiettivo è scrivere fisicamente nella memoria flash le istruzioni per dare priorità alla USB (usb0) rispetto al disco interno (nvme0/mmc).

1. Individuare la partizione ENV Su questi dispositivi, le variabili U-Boot risiedono solitamente in /dev/mtd3.

```
cat /proc/mtd
```
Cerca la riga: mtd3: ... "env"

2. Configurare gli strumenti U-Boot Creare il file /etc/fw_env.config per dire al sistema dove leggere/scrivere:

```
echo "/dev/mtd3 0x0 0x10000 0x1000" | sudo tee /etc/fw_env.config
```
3. Creare e Flashare la nuova configurazione
Poiché fw_setenv fallisce su partizioni vuote, bisogna creare un'immagine binaria e scriverla con dd.

Crea un file my_boot.txt con il contenuto:

```
boot_targets=usb0 nvme0 mmc0 pxe
bootdelay=5
```
Converti in binario (richiede u-boot-tools):
```
mkenvimage -s 65536 -o env.bin my_boot.txt
```

Passaggio Critico: Cancella la partizione e scrivi (richiede mtd-utils):
```
sudo flash_erase /dev/mtd3 0 0
sudo dd if=env.bin of=/dev/mtd3
```

Verifica: ```sudo strings /dev/mtd3 | grep boot_targets```

Parte 2: Preparazione della USB (La "Chirurgia")

Le ISO standard non partono? (verificare) Bisogna creare una chiavetta "manualmente" che usi Extlinux e contenga il Device Tree corretto.

1. Partizionamento La chiavetta deve avere una partizione che occupi tutto lo spazio (attenzione a lsblk, a volte le partizioni ISO sono minuscole).

Filesystem consigliato: FAT32 (massima compatibilità con U-Boot) o EXT4 (se U-Boot lo supporta, meglio per i permessi).

2. Copia dei File

Montare la ISO originale e copiare tutto il contenuto (vmlinuz, initrd, cartella live) nella root della USB.

3. Il "Trapianto" del Device Tree (DTB) Per far funzionare schermo e periferiche, copiare il file .dtb dal sistema funzionante alla USB.

Sorgente (esempio): /boot/spacemit/6.6.63/k1-x_MUSE-Book.dtb

Destinazione: / (root della USB).

4. Creazione menu Extlinux Creare il file /extlinux/extlinux.conf sulla USB:

```
label custom-live
  kernel /live/vmlinuz-6.6.63
  initrd /live/initrd.img-6.6.63
  fdt /k1-x_MUSE-Book.dtb
  append boot=live components quiet splash console=ttyS0,115200n8 console=tty0
```
(Nota: fdt è il comando fondamentale che manca nelle installazioni standard).

Diagnostica: Perché potrebbe non partire?
Se dopo tutto questo riparte il disco interno:

Filesystem: U-Boot potrebbe saper leggere solo FAT32 per il file extlinux.conf iniziale, anche se il kernel Linux supporta EXT4.

Porta USB: Spesso su questi SoC solo una porta è scansionata all'avvio (solitamente la USB 3.0 Type-A, oppure la OTG).

Bootcmd: In alcune versioni di U-Boot, la variabile bootcmd è hardcodata e ignora boot_targets. In quel caso serve un cavo seriale per il debug.


# Creazione img al posto di ISO
Per risv64 dovrei creare una img al posto di una iso, in pratica si tratta di sostituire xorriso con uno script adatto che copi la struttura, aggiunga DTB_FILE ed extlinux.

```
Bash
#!/bin/bash

# 1. Configurazione
IMG_NAME="eggs-musebook-riscv64.img"
IMG_SIZE="4096" # Dimensione in MB (4GB)
SRC_DIR="./output_eggs" # La cartella dove eggs ha messo vmlinuz, initrd, filesystem.squashfs, etc.
DTB_FILE="./k1-x_MUSE-Book.dtb" # Il file DTB che hai estratto dal notebook

echo "--- 1. Creazione contenitore vuoto ($IMG_SIZE MB) ---"
dd if=/dev/zero of=$IMG_NAME bs=1M count=$IMG_SIZE status=progress

echo "--- 2. Partizionamento (Creiamo una partizione EXT4 che occupa tutto) ---"
# Usiamo sfdisk per automatizzare fdisk. Crea una partizione Linux standard.
echo "type=83" | sfdisk $IMG_NAME

echo "--- 3. Setup del dispositivo di Loopback ---"
# Collega il file .img a un dispositivo virtuale /dev/loopX
LOOP_DEV=$(sudo losetup -fP --show $IMG_NAME)
echo "Immagine montata su: $LOOP_DEV"

echo "--- 4. Formattazione in EXT4 ---"
# Formattiamo la prima partizione del loop device (es. /dev/loop0p1)
sudo mkfs.ext4 -L "MUSEBOOT" -m 0 "${LOOP_DEV}p1"

echo "--- 5. Montaggio e Copia dei File ---"
sudo mkdir -p /mnt/tmpeggs
sudo mount "${LOOP_DEV}p1" /mnt/tmpeggs

# A. Copia la cartella 'live' generata da eggs
echo "Copia del sistema live..."
sudo cp -r $SRC_DIR/live /mnt/tmpeggs/

# B. Copia il DTB (Fondamentale!)
echo "Copia del Device Tree..."
sudo cp $DTB_FILE /mnt/tmpeggs/

# C. Creazione Extlinux
echo "Creazione configurazione di boot..."
sudo mkdir -p /mnt/tmpeggs/extlinux
cat <<EOF | sudo tee /mnt/tmpeggs/extlinux/extlinux.conf
label eggs-live
  kernel /live/vmlinuz-6.6.63
  initrd /live/initrd.img-6.6.63
  fdt /k1-x_MUSE-Book.dtb
  append boot=live components quiet splash console=ttyS0,115200n8 console=tty0
EOF

echo "--- 6. Chiusura e Pulizia ---"
sudo umount /mnt/tmpeggs
sudo losetup -d $LOOP_DEV
rmdir /mnt/tmpeggs

echo "FATTO! L'immagine $IMG_NAME è pronta per essere flashata."
```

## Modifiche ad eggs

produce --dtb path-file-dtb

se path-file-dtb esiste, allora continua e formato img.

Si interviene solo su produce e xorriso, la cartella ISO viene smembrata:
* ISO/isolinux 
* ISO/boot/grub/efi.img

# Partizione 1 BOOT (FAT32)
* ISO/EFI  -> BOOT/EFI
* ISO/live/vmlinu? -> BOOT/live/vmlinu?

## File da aggiungere (Generati/Copiati da Eggs durante la build):
* k1-x_MUSE-Book.dtb (o altri DTB) → Root della partizione.
* extlinux/extlinux.conf → Generato al volo (per Spacemit/U-Boot).
```
label eggs
  kernel /vmlinuz-6.12...
  initrd /initrd.img-6.12...
  fdt /k1-x_MUSE-Book.dtb
  append boot=live components splash ...
```
* config.txt + Firmware → (Solo se stai facendo la build per Raspberry Pi).


# Partizione 2 (ext4)
ISO/live/filesystem.squashfs -> ROOT/live/filesystem.squashfs


L'immagine originale di Bianbu usa un GPT "ibrido" o modificato dove il settore 0 contiene dati vitali per il boot (SDC...). Usando cp boot_header.bin "$IMG_NAME", portiamo dietro tutto:

La firma SDC al settore 0.

L'SPL già pronto.

U-Boot già pronto.

sfdisk poi si occuperà solo di dire al kernel dove trovare le partizioni 5 e 6, ma senza toccare i byte magici iniziali.

Vuoi provare a generare il boot_header.bin e vedere se con questo metodo il Musebook finalmente "sente" la SD? Se così funziona, avremo un template universale per tutte le tue build RISC-V.

```
sudo dd if=bianbu-25.04-desktop-k1-v3.0.1-release-20250815185656.img \
        of=boot_header.bin bs=512 count=8192
```

Cosa abbiamo ottenuto con questo codice:

Compatibilità Totale: Copiando i primi 8192 settori, portiamo con noi la firma SDC, l'SPL e l'U-Boot originale. Il Musebook non potrà più ignorare la SD.

Semplificazione: Non abbiamo più bisogno dei singoli comandi dd per spl.bin e uboot.itb, poiché sono già inclusi nel pacchetto boot_header.bin.

Flessibilità: Lo script crea comunque le tue partizioni Eggs (BOOT e ROOT) e le formatta ex-novo, garantendo che i tuoi file siano puliti.

[Miniera d'oro](https://www.workswithriscv.guide/wiki/hardware/K1/bianbu-multiboot.html)