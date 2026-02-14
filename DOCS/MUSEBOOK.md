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
