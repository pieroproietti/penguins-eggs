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

La causa è il PID, deve essere uguale ad 1.

A questo punto, riflettendo sul funzionamento dell'emergency mode, ho realizzato che la soluzione non era quella di eseguire lo switch_root da sidecar.sh, ma semplicemente quella di digitare `exit` per tornare alla init chiamante.

A questo punto, però è sorto un altro problema: mi segnala che non riesce a trovare /sbin/init nella nuova root.

/sbin/init, in effetti esiste ed è un semplice link a /bin/busybox. 

Ho provato anche a copiare busybox ridenominandolo `/sbin/init` ma, purtroppo, per qualche oscura ragione non lo trova lo stesso.
