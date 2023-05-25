```
archisobasedir=blend archisodevice=UUID=${ARCHISO_UUID}
```

Punti scelta

* initrdCreate() 
        -> sceglie il mkinitcpio
```
    if (this.settings.distro.distroId === 'Arch' ||
      this.settings.distro.distroId === 'RebornOS' ||
      this.settings.distro.distroId === 'EndeavourOS') {
      await exec(`mkinitcpio -c ${path.resolve(__dirname, '../../mkinitcpio/archlinux/mkinitcpio-produce.conf')} -g ${this.settings.work_dir.pathIso}/live/${initrdImg}`, Utils.setEcho(true))
    } else if (this.settings.distro.distroId === 'blendOS') {
      await exec(`mkinitcpio -c ${path.resolve(__dirname, '../../mkinitcpio/blendos/mkinitcpio-produce.conf')} -g ${this.settings.work_dir.pathIso}/live/${initrdImg}`, Utils.setEcho(true))
    } else if (this.settings.distro.distroId === 'ManjaroLinux') {
      await exec(`mkinitcpio -c ${path.resolve(__dirname, '../../mkinitcpio/manjaro/mkinitcpio-produce.conf')} -g ${this.settings.work_dir.pathIso}/live/${initrdImg}`, Utils.setEcho(true))
    } else if (this.settings.distro.distroId === 'Crystal') {
      await exec(`mkinitcpio -c ${path.resolve(__dirname, '../../mkinitcpio/crystal/mkinitcpio-produce.conf')} -g ${this.settings.work_dir.pathIso}/live/${initrdImg}`, Utils.setEcho(true))
    }
```



kernel_parameters it's used for:
* makeEFI()  -> crea grub.cfg
* isolinux() -> crea isolinux.cfg


    /**
     * kernel_parameters are used by miso, archiso
     */
    let kernel_parameters = `boot=live components locales=${process.env.LANG}`
    if (this.familyId === 'archlinux') {
      const volid = Utils.getVolid(this.settings.remix.name)
      if (this.settings.distro.distroId === 'ManjaroLinux') {
        kernel_parameters += ` misobasedir=manjaro misolabel=${volid}`
      } else if (this.settings.distro.distroId === 'blendOS') {
        kernel_parameters += ` archisobasedir=blend archisodevice=UUID=$ARCHISO_UUID cow_spacesize=4G`
      } else if (
        this.settings.distro.distroId === 'Arch' ||
        this.settings.distro.distroId === 'EndeavourOS' ||
        this.settings.distro.distroId === 'RebornOS'
      ) {
        kernel_parameters += ` archisobasedir=arch archisolabel=${volid} cow_spacesize=4G`
      }
    }
