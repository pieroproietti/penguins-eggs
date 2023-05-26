```
archisobasedir=blend archisodevice=UUID=${ARCHISO_UUID}
```

Tutto in ovary.ts ai punti:

* initrdCreate() 
        -> sceglie il mkinitcpio
```
    let initrdImg = Utils.initrdImg()
    initrdImg = initrdImg.slice(Math.max(0, initrdImg.lastIndexOf('/') + 1))
    Utils.warning(`Creating ${initrdImg} in ${this.settings.work_dir.pathIso}/live/`)
    const distroId = this.settings.distro.distroId
    let fileConf = 'archlinux'
    if (distroId === 'Arch' || distroId === 'EndeavourOS' || distroId === 'RebornOS') {
      fileConf = 'archlinux'
    } else if (distroId === 'blendOS') {
      fileConf = 'blendos'
    } else if (distroId === 'Crystal') {
      fileConf = 'crystal'
    } else if (distroId === 'ManjaroLinux') {
      fileConf = 'manjaro'
    }
    let pathConf = path.resolve(__dirname, `../../mkinitcpio/${fileConf}/mkinitcpio-produce.conf`)
    await exec(`mkinitcpio -c ${pathConf}`, Utils.setEcho(true))
```



kernel_parameters it's used for:
* makeEFI()  -> crea grub.cfg
* isolinux() -> crea isolinux.cfg

  /**
   * 
   * @returns kernelParameters
   */
  kernelParameters(): string {
    const distroId = this.settings.distro.distroId
    let kp = `boot=live components locales=${process.env.LANG}`
    if (this.familyId === 'archlinux') {
      const volid = Utils.getVolid(this.settings.remix.name)
      if ( distroId === 'Arch' || distroId === 'EndeavourOS' || distroId === 'RebornOS') {
        kp += ` archisobasedir=arch archisolabel=${volid}`
      } else if (distroId === 'blendOS') {
        kp += ` archisobasedir=blend archisodevice=${volid}`
      } else if (distroId === 'ManjaroLinux') {
        kp += ` misobasedir=manjaro misolabel=${volid}`
      }
      kp +=  ` cow_spacesize=4G`
    }
    return kp
  }
