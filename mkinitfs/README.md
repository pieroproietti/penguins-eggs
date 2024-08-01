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
mount /dev/sr0 /mnt
/mnt/live/sidecar.sh
```

Purtroppo mentre `filestem.squashfs` viene correttamente montato RW in `/sysroot`, non viene effettuato lo `switch_root /newroot /sbin/init`.

La causa è il PID, deve essere uguale ad 1.

A questo punto, riflettendo sul funzionamento dell'emergency mode, ho realizzato che la soluzione non è quella di eseguire lo switch_root con `sidecar.sh`, ma digitare `exit` per tornare al processo init chiamante.

A questo punto però è sorto un altro problema: `init` mi segnala che non riesce a trovare `/sbin/init` nella nuova root.

```
/sbin/init not found in new root. Launching emergency recovery shell
Type exit to continue boot.
```

Questo succede perchè ad un certo punto init tenta di montare in `/sysroot` il dispositivo sul quale è registrato e non è pensata per overlayfs. Tuttavia, eseguendo un `exit` prima di avviare `mnt/live/sidecar.sh` ci troveremo nella parte finale dell'init - dopo che questo tentativo è stato già effettuato.

A questo punto le istruzioni di `sidecar.sh` utilizzeranno `/sysroot` come mountpoint per il mount RW del filesystem live, e digitanto ancora `exit` verrà corrrettmanete eseguito lo `switch_root` ed il sistema verrà finalmente caricato.

