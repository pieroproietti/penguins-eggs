  ### 🔬 Come funziona l'architettura di boot del MuseBook (Spacemit K1):

  1. La Boot ROM hardware (BROM nel chip RISC-V):
  La ROM di avvio del chip K1 conosce unicamente tre bus per la fase di accensione:
      • eMMC interna (mmcblk0)
      • Slot MicroSD (mmcblk1 / /dev/sdb)
      • SPI Flash (mtdblock0)

  La BROM del chip non possiede i driver PCIe / NVMe integrati nella ROM di silicio, per cui all'accensione non è in grado
  di vedere il controller NVMe.

  2. La catena di avvio corretta per sfruttare il NVMe:
      • Fase 1 (eMMC o MicroSD): La scheda MMC (o l'eMMC interna) fa da "chiave d'accensione". Deve contenere il primo
      stadio U-Boot e la partizione bootfs con il file env_k1-x.txt.
      • Fase 2 (Passaggio di testimone a U-Boot): Quando U-Boot parte dalla MMC, esegue nvme scan, rileva l'SSD NVMe e
      carica il kernel/initrd da NVMe, passando l'argomento:
      root=/dev/nvme0n1p6 rootwait rw
      • Fase 3 (Kernel ed esecuzione): Il sistema operativo viene eseguito a tutti gli effetti al 100% dal NVMe
      (sfruttandone la velocità in lettura/scrittura).

  ──────
  ### 💡 Come procediamo per farlo funzionare:

  Se reinserisci la scheda MMC (o usiamo l'eMMC interna per U-Boot), dobbiamo semplicemente assicurarci che il file env_k1-
  x.txt sulla partizione 5 della MMC contenga la riga di boot per l'NVMe:

    bootcmd= \
        setenv fdtfile k1-x_MUSE-Book.dtb; \
        nvme scan; \
        if load nvme 0:5 ${kernel_addr_r} vmlinuz; then \
            setenv devtype nvme; setenv devnum 0; setenv bootpart 5; \
            setenv boot_type "root=/dev/nvme0n1p6 rootwait rw"; \
        elif load mmc 1:5 ${kernel_addr_r} vmlinuz; then \
            setenv devtype mmc; setenv devnum 1; setenv bootpart 5; \
            setenv boot_type "boot=live components"; \
        fi; \
        load ${devtype} ${devnum}:${bootpart} ${fdt_addr_r} spacemit/6.6.63/${fdtfile}; \
        load ${devtype} ${devnum}:${bootpart} ${ramdisk_addr_r} initrd.img; \
        setenv bootargs "earlycon=sbi console=tty0 console=ttyS0,115200 quiet splash ${boot_type} locales=en_US.UTF-8
  clk_ignore_unused swiotlb=65536"; \
        booti ${kernel_addr_r} ${ramdisk_addr_r}:${filesize} ${fdt_addr_r}

  In questo modo:

  • Lasciando la scheda MMC nello slot, il MuseBook si accende, legge U-Boot dalla MMC, carica all'istante il kernel e la
  rootfs dal NVMe ed esegue l'intero sistema operativo a massima velocità dal disco NVMe.


Io non ho capito a cosa serve la eMMC e se la possiamo cancellare/modificare

dpkg-reconfigure console-setup
dpkg-reconfigure locales
