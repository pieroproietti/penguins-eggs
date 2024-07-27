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

Nella stessa funzione, lo script `sidecar.sh` che viene inserito all'interno della carlella `live` della ISO.


L'avvio del live è possibile solo da sistemi BIOS, il sistema viene avviato ma `initramfs-lts` va in emergency mode.

A questo punto:

```
mkdir /mnt/
mount /dev/sro /mnt
/mnt/live/sidecar.sh
```

Purtroppo mentre `filestem.squashfs` viene correttamente montato RW in `/newroot`, non viene effettuato lo `switch_root /newroot /sbin/init`.


