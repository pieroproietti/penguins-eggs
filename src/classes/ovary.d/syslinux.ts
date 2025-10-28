/**
 * ./src/classes/ovary.d/produce.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
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
let bootloaders = '/usr/lib/'


/**
   * syslinux: da syspath
   */
export async function syslinux(this: Ovary, theme = 'eggs') {
    const bootloaders = Diversions.bootloaders(this.familyId)

    let sysPath = path.join(bootloaders, 'syslinux/modules/bios')
    let isoPath = path.join(bootloaders, 'ISOLINUX')

    await exec(`cp ${sysPath}/chain.c32 ${this.settings.iso_work}/isolinux/`, this.echo)
    await exec(`cp ${isoPath}/isohdpfx.bin ${this.settings.iso_work}/isolinux/`, this.echo)

    // just for x64 arch
    await exec(`cp ${isoPath}/isolinux.bin ${this.settings.iso_work}/isolinux/`, this.echo)
    await exec(`cp ${sysPath}/ldlinux.c32 ${this.settings.iso_work}/isolinux/`, this.echo)
    await exec(`cp ${sysPath}/libcom32.c32 ${this.settings.iso_work}/isolinux/`, this.echo)
    await exec(`cp ${sysPath}/libutil.c32 ${this.settings.iso_work}/isolinux/`, this.echo)
    await exec(`cp ${sysPath}/vesamenu.c32 ${this.settings.iso_work}/isolinux/`, this.echo)

    const splashDest = `${this.settings.iso_work}/isolinux/splash.png`
    const isolinuxThemeDest = this.settings.iso_work + 'isolinux/isolinux.theme.cfg'
    const isolinuxDest = `${this.settings.iso_work}/isolinux/isolinux.cfg`

    let splashSrc = '' 
    let isolinuxTemplate = ''
    let isolinuxThemeSrc = ''

    if (this.hidden) {
        splashSrc = path.resolve(__dirname, `../../../addons/${theme}/theme/livecd/generic-splash.png`)
        isolinuxTemplate = path.resolve(__dirname, '../../../addons/eggs/theme/livecd/generic.isolinux.main.cfg')
        isolinuxThemeSrc = path.resolve(__dirname, '../../../addons/eggs/theme/livecd/generic.isolinux.theme.cfg')
    } else {
        isolinuxThemeSrc = path.resolve(__dirname, `../../../addons/${theme}/theme/livecd/isolinux.theme.cfg`)
        if (this.theme.includes('/')) {
            isolinuxThemeSrc = `${theme}/theme/livecd/isolinux.theme.cfg`
        }

        if (!fs.existsSync(isolinuxThemeSrc)) {
            Utils.warning('Cannot find: ' + isolinuxThemeSrc)
            process.exit()
        }

        /**
         * isolinux.cfg from isolinux.main.cfg
         */
        this.settings.iso_work + 'isolinux/isolinux.cfg'
        isolinuxTemplate = `${theme}/theme/livecd/isolinux.main.cfg`
        if (!fs.existsSync(isolinuxTemplate)) {
            isolinuxTemplate = path.resolve(__dirname, '../../../addons/eggs/theme/livecd/isolinux.main.cfg')
        }

        if (!fs.existsSync(isolinuxTemplate)) {
            Utils.warning('Cannot find: ' + isolinuxTemplate)
            process.exit()
        }

        /**
         * splash
         */
        splashSrc = path.resolve(__dirname, `../../../addons/${theme}/theme/livecd/splash.png`)
        if (this.theme.includes('/')) {
            splashSrc = path.resolve(`${theme}/theme/livecd/splash.png`)
        }

        if (!fs.existsSync(splashSrc)) {
            Utils.warning('Cannot find: ' + splashSrc)
            process.exit()
        }
    }
    // Splash
    fs.copyFileSync(splashSrc, splashDest)

    // isolinux.theme.cfg
    fs.copyFileSync(isolinuxThemeSrc, isolinuxThemeDest)

    // isolinux.main.cfg
    const kernel_parameters = Diversions.kernelParameters(this.familyId, this.volid, this.fullcrypt)
    let template = fs.readFileSync(isolinuxTemplate, 'utf8')

    let fullname = this.settings.remix.fullname.toUpperCase() 
    if (this.hidden) {
        fullname = "LINUX"
    }

    const view = {
        fullname: fullname,
        initrdImg: `/live/${path.basename(this.initrd)}`,
        kernel: this.kernel,
        kernel_parameters,
        vmlinuz: `/live/${path.basename(this.vmlinuz)}`
    }
    fs.writeFileSync(isolinuxDest, mustache.render(template, view))

}

