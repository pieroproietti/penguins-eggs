/**
 * ./src/classes/ovary.d/produce.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import mustache from 'mustache'

// packages
import fs from 'node:fs'
import path from 'node:path'

// backup

// interfaces

// libraries
import { exec } from '../../lib/utils.js'
import Diversions from './../diversions.js'

// classes
import Ovary from './../ovary.js'
import Utils from './../utils.js'

// _dirname
const __dirname = path.dirname(new URL(import.meta.url).pathname)

/**
   * syslinux: da syspath
   */
export async function syslinux(this: Ovary, theme = 'eggs') {

    let syspath = path.resolve(__dirname, `../../../syslinux`)
    await exec(`cp ${syspath}/chain.c32 ${this.settings.iso_work}/isolinux/`, this.echo)
    await exec(`cp ${syspath}/isohdpfx.bin ${this.settings.iso_work}/isolinux/`, this.echo)
    // just fo x64 arch
    await exec(`cp ${syspath}/isolinux.bin ${this.settings.iso_work}/isolinux/`, this.echo)
    await exec(`cp ${syspath}/ldlinux.c32 ${this.settings.iso_work}/isolinux/`, this.echo)
    await exec(`cp ${syspath}/libcom32.c32 ${this.settings.iso_work}/isolinux/`, this.echo)
    await exec(`cp ${syspath}/libutil.c32 ${this.settings.iso_work}/isolinux/`, this.echo)
    await exec(`cp ${syspath}/vesamenu.c32 ${this.settings.iso_work}/isolinux/`, this.echo)

    const isolinuxThemeDest = this.settings.iso_work + 'isolinux/isolinux.theme.cfg'
    let isolinuxThemeSrc = path.resolve(__dirname, `../../../addons/${theme}/theme/livecd/isolinux.theme.cfg`)
    if (this.theme.includes('/')) {
        isolinuxThemeSrc = `${theme}/theme/livecd/isolinux.theme.cfg`
    }

    if (!fs.existsSync(isolinuxThemeSrc)) {
        Utils.warning('Cannot find: ' + isolinuxThemeSrc)
        process.exit()
    }

    fs.copyFileSync(isolinuxThemeSrc, isolinuxThemeDest)


    /**
     * isolinux.cfg from isolinux.main.cfg
     */
    const isolinuxDest = `${this.settings.iso_work}/isolinux/isolinux.cfg`
    this.settings.iso_work + 'isolinux/isolinux.cfg'
    let isolinuxTemplate = `${theme}/theme/livecd/isolinux.main.cfg`
    if (!fs.existsSync(isolinuxTemplate)) {
        isolinuxTemplate = path.resolve(__dirname, '../../../addons/eggs/theme/livecd/isolinux.main.cfg')
    }

    if (!fs.existsSync(isolinuxTemplate)) {
        Utils.warning('Cannot find: ' + isolinuxTemplate)
        process.exit()
    }

    const kernel_parameters = Diversions.kernelParameters(this.familyId, this.volid)
    const template = fs.readFileSync(isolinuxTemplate, 'utf8')
    const view = {
        fullname: this.settings.remix.fullname.toUpperCase(),
        initrdImg: `/live/${path.basename(this.initrd)}`,
        kernel: this.kernel,
        kernel_parameters,
        vmlinuz: `/live/${path.basename(this.vmlinuz)}`
    }
    fs.writeFileSync(isolinuxDest, mustache.render(template, view))

    /**
     * splash
     */
    const splashDest = `${this.settings.iso_work}/isolinux/splash.png`
    let splashSrc = path.resolve(__dirname, `../../../addons/${theme}/theme/livecd/splash.png`)
    if (this.theme.includes('/')) {
        splashSrc = path.resolve(`${theme}/theme/livecd/splash.png`)
    }

    if (!fs.existsSync(splashSrc)) {
        Utils.warning('Cannot find: ' + splashSrc)
        process.exit()
    }

    fs.copyFileSync(splashSrc, splashDest)
}

