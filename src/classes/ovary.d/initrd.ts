/**
 * ./src/classes/ovary.d/initrd-arch.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

// packages
import fs from 'fs'
import path from 'node:path'
import shx from 'shelljs'

// classes
import { exec } from '../../lib/utils.js'
import Ovary from '../ovary.js'
import Utils from '../utils.js'
import Diversions from '../diversions.js'

// _dirname
const __dirname = path.dirname(new URL(import.meta.url).pathname)

/**
 * initrdAlpine
 */
export async function initrdAlpine(this: Ovary) {
    Utils.warning(`creating ${path.basename(this.settings.initrdImg)} Alpine on ISO/live`)
    const sidecar = path.resolve(__dirname, `../../../mkinitfs/initramfs-init.in`)
    Utils.warning(`Adding ${sidecar} to /usr/share/mkinitfs/initramfs-init`)
    await exec(`cp ${sidecar} /usr/share/mkinitfs/initramfs-init`)
    let initrdImg = Utils.initrdImg()
    initrdImg = initrdImg.slice(Math.max(0, initrdImg.lastIndexOf('/') + 1))
    const pathConf = path.resolve(__dirname, `../../mkinitfs/live.conf`)
    await exec(`mkinitfs -c ${pathConf} -o ${this.settings.iso_work}live/${initrdImg}`, Utils.setEcho(true))
}


/**
 * initrdArch
 */
export async function initrdArch(this: Ovary) {
    let initrdImg = Utils.initrdImg()
    initrdImg = initrdImg.slice(Math.max(0, initrdImg.lastIndexOf('/') + 1))
    Utils.warning(`creating ${path.basename(this.settings.initrdImg)} using mkinitcpio on ISO/live`)

    const { distroId } = this.settings.distro
    let dirConf = 'arch'
    if (Diversions.isManjaroBased(distroId)) {
        dirConf = 'manjaro'
        if (distroId === "Biglinux" || distroId === "Bigcommunity") {
            dirConf = 'biglinux'
        }
    }
    const pathConf = path.resolve(__dirname, `../../../mkinitcpio/${dirConf}/live.conf`)
    let cmd = `mkinitcpio -c ${pathConf} -g ${this.settings.iso_work}live/${initrdImg}`
    if (Utils.isContainer()) {
        let kernelRelease = (await exec(`pacman -Q linux | awk '{print $2}'`, { capture: true, echo: false, ignore: false })).data
        // Adapting to dir 6.13.8.arch1-1 -> 6.13.8-arch1-1
        kernelRelease = kernelRelease.replace('.arch', '-arch')
        cmd += ` -k ${kernelRelease}`
    }
    console.log(cmd)
    await exec(cmd, this.echo)
}

/**
 * initrdDebian
 */
export async function initrdDebian(this: Ovary, verbose = false) {
    Utils.warning(`creating ${path.basename(this.settings.initrdImg)} using mkinitramfs on ISO/live`)

    let isCrypted = false

    if (fs.existsSync('/etc/crypttab')) {
        isCrypted = true
        await exec('mv /etc/crypttab /etc/crypttab.saved', this.echo)
    }
    let initrdImg = path.basename(Utils.initrdImg())
    let kernelRelease = initrdImg.substring(initrdImg.indexOf('-') + 1)
    
    if (this.kernel!='') {
        kernelRelease=this.kernel
    } 
    console.log(`mkinitramfs -o ${this.settings.iso_work}live/${initrdImg} ${kernelRelease}`)
    await exec(`mkinitramfs -o ${this.settings.iso_work}live/${initrdImg} ${kernelRelease} ${this.toNull}`, this.echo)
    if (isCrypted) {
        await exec('mv /etc/crypttab.saved /etc/crypttab', this.echo)
    }
}

/*
* initrdDracut) Almalinux/Fedora/Openmamba/Opensuse/Rocky/Voidlinux
*/
export async function initrdDracut(this: Ovary) {
    Utils.warning(`creating ${path.basename(this.settings.initrdImg)} using dracut on ISO/live`)
    const confdir = path.resolve(__dirname, `../../../dracut/dracut.conf.d`)
    let initrdImg = path.basename(Utils.initrdImg())
    let kernelRelease=initrdImg.substring(initrdImg.indexOf('-') + 1)
    // remove suffix .img
    kernelRelease = kernelRelease.replace('.img','')
    console.log(`dracut --confdir ${confdir} ${this.settings.iso_work}live/${this.settings.initrdImg}  ${kernelRelease}`)
    await exec(`dracut --confdir ${confdir} ${this.settings.iso_work}live/${this.settings.initrdImg}  ${kernelRelease}`, this.echo)
}
