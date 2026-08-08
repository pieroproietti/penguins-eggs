### 🧱 Tutti i problemi risolti nel sorgente di Penguin's Eggs (main):

  1. Gestione del Kernel in U-Boot (Symlink Fix):
      • In Krill: Al termine dell'installazione su RISC-V, Krill converte automaticamente tutti i symlink del kernel in
      /boot (bootfs p5) in file veri e propri (vmlinuz-6.6.63 e initrd.img-6.6.63), rendendoli leggibili da U-Boot.
      • In env_k1-x.mustache: Aggiunto il controllo per tentare il caricamento sia da vmlinuz-6.6.63 che da vmlinuz.
  2. Partizionatore Spacemit a 6 Volumi:
      • Gestione precisa degli offset dei settori GPT con first-lba: 256 (fsbl, env, opensbi, uboot, bootfs p5, rootfs p6).
      • Fallback trasparente su sfdisk se sgdisk non è installato.
      • Aggiunto gdisk come dipendenza pacchetto per riscv64.
  3. Selezione Dischi Smart:
      • Esclusione dei chip Flash mtdblock0, dischi di memoria RAM e deprioritizzazione del supporto Live MMC durante la
      selezione del target NVMe.
  4. Fstab & Device Tree:
      • Generazione automatica UUID in /etc/fstab e selezione prioritaria del DTB k1-x_MUSE-Book.dtb.

  ──────
  Non appena la build su GitHub termina di preparare il pacchetto .deb, avremo la versione completa ed ufficiale pronta per
  creare l'immagine ISO/IMG definitiva ed autonoma!
