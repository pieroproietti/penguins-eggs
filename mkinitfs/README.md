# AlpineLinux

Sto cercando una soluzione per montare il mio `filesystem.squasfs` attraverso un apposito `initramfs-lts` custom che viene inserito nella ISO.

Dato che  dobbiamo avere a disposizione squashfs ed overlay per montare il `filesystem.squash`, li ho aggiunti alle features del file utilizzato per la configurazione: `live.conf`

```
# live conf
features="ata base ide scsi usb cdrom virtio blkid squashfs overlay ext4"
```

La creazione di `initramfs-lts` avviene all'interno di `ovary.ts` chiamando il metodo `initrdAlpine()`:

```
  /**
   * initrdAlpine()
   */
  async initrdAlpine() {
    Utils.warning(`creating ${path.basename(this.settings.initrdImg)} Alpine on ISO/live`)
    let initrdImg='initramfs-lts'
    const pathConf = path.resolve(__dirname, `../../mkinitfs/live.conf`)
    const sidecar = path.resolve(__dirname, `../../mkinitfs/sidecar.sh`)
    await exec(`mkinitfs -c ${pathConf} -o ${this.settings.iso_work}live/${initrdImg}`, Utils.setEcho(true))    
    await exec(`cp ${sidecar} ${this.settings.iso_work}live/`)
  }
```

Nella stessa funzione, lo script `sidecar.sh` viene creato e viene inserito all'interno della carlella `live` della ISO.


L'avvio del live è possibile solo da sistemi BIOS, il sistema viene avviato ma `initramfs-lts` va in emergency mode, non è previsto il mount con overlayfs. 

A questo punto, basta montare la ISO, digitare exit per trovarisi in emergency shell e lanciare sidecar.sh:

```
mkdir /mnt/
mount /dev/sr0 /mnt
exit
/mnt/live/sidecar.sh
```

Le istruzioni di `sidecar.sh` utilizzano `/sysroot` come mountpoint per il mount RW del filesystem live e, digitanto ancora `exit` per tornare all'init, verrà correttamente eseguito lo `switch_root` ed il sistema verrà avviato.

Resta da vedere se è possibile includere questo in un vero init.


