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
    await exec(`mkinitcpio -c ${pathConf} -g ${this.settings.iso_work}live/${initrdImg}`, this.echo)
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

    await exec(`mkinitramfs -o ${this.settings.iso_work}/live/initrd.img-$(uname -r) ${this.toNull}`, this.echo)
    if (isCrypted) {
        await exec('mv /etc/crypttab.saved /etc/crypttab', this.echo)
    }
}

/*
* initrdDracut) Fedora/Openmamba/Opensuse/Voidlinux
*/
export async function initrdDracut(this: Ovary) {
    Utils.warning(`creating ${path.basename(this.settings.initrdImg)} using dracut on ISO/live`)
    const kernelVersion = shx.exec('uname -r', { silent: true }).stdout.trim()
    const confdir = path.resolve(__dirname, `../../../dracut/dracut.conf.d`)
    await exec(`dracut --confdir ${confdir} ${this.settings.iso_work}live/${this.settings.initrdImg}`, this.echo)
}
