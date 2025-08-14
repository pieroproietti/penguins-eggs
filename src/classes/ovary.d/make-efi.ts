/**
 * ./src/classes/ovary.d/make-efi.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import mustache from 'mustache'

// packages
import fs from 'node:fs'
import path from 'node:path'

// classes
import { exec } from '../../lib/utils.js'
import Ovary from '../ovary.js'
import Diversions from '../diversions.js'
import Utils from '../utils.js'

// _dirname
const __dirname = path.dirname(new URL(import.meta.url).pathname)

/**
 * 
 * @param this 
 * @param theme 
 */
export async function makeEfi (this:Ovary, theme ='eggs') {
    const bootloaders = Diversions.bootloaders(this.familyId)

    /**
     * All distros families will user: not signed
     */
    let signed = false
    let grubEfi = path.resolve(bootloaders, `grub/x86_64-efi/monolithic/grubx64.efi`)
    let shimEfi = path.resolve(bootloaders, `shim/shimx64.efi`)

    /**
     * Except family debian
     */
    if (this.familyId === 'debian') {
        signed = true
        if (process.arch === 'x64') {
            grubEfi = path.resolve(bootloaders, `grub/x86_64-efi-signed/grubx64.efi.signed`)
            shimEfi = path.resolve(bootloaders, `shim/shimx64.efi.signed`)
        } else if (process.arch === 'ia32') {
            grubEfi = path.resolve(bootloaders, `grub/i386-efi-signed/grubia32.efi.signed`)
            shimEfi = path.resolve(bootloaders, `shim/shimia32.efi.signed`)
        } else if (process.arch === 'arm64') {
            grubEfi = path.resolve(bootloaders, `grub/arm64-efi-signed/grubaa64.efi.signed`)
            shimEfi = path.resolve(bootloaders, `shim/shimaa64.efi.signed`)
        }
    }

    if (signed) {
        Utils.warning(`Live system is ${this.distroId}/${process.arch}, can boot with Secure Boot enabled`)
    } else {
        Utils.warning(`Live system is ${this.distroId}/${process.arch}, You must disable Secure Boot to boot it!`)
    }
    // 2 secondi per leggere...
    await new Promise(resolve => setTimeout(resolve, 2000))

    const isoDir = this.settings.iso_work
    await exec(`mkdir ${isoDir}/boot/grub/ -p`, this.echo)
    await exec(`cp -r ${bootloaders}/grub/x86_64-efi ${isoDir}/boot/grub/`, this.echo)

    // creo e copio grub[arch].efi e shim[arch].efi as boot[arch].efi
    await exec(`mkdir ${isoDir}/EFI/boot -p`, this.echo)
    await exec(`cp ${shimEfi} ${isoDir}/EFI/boot/${bootEfiName()}`, this.echo)
    await exec(`cp ${grubEfi} ${isoDir}/EFI/boot/${grubEfiName()}`, this.echo)

    // Definisci il percorso del file di configurazione temporaneo
    const grubCfg = `${isoDir}/EFI/boot/grub.cfg`;
    await exec(`mkdir -p ${path.dirname(grubCfg)}`, this.echo);

    // Prepara i dati per il template di GRUB
    const grubTemplatePath = path.resolve(__dirname, '../../../addons/eggs/theme/livecd/grub.main.cfg'); // Assicurati che il percorso sia corretto
    const template = fs.readFileSync(grubTemplatePath, 'utf8');
    const kernel_parameters = Diversions.kernelParameters(this.familyId, this.volid);

    const view = {
        fullname: this.settings.remix.fullname.toUpperCase(),
        initrdImg: `/live/${path.basename(this.initrd)}`,
        vmlinuz: `/live/${path.basename(this.vmlinuz)}`,
        kernel_parameters,
    };

    // Genera il contenuto del grub.cfg finale
    let grubText = `# GRUB 2.12+ configuration for UEFI (Single file method)\n`;
    grubText += `\n`;

    // Comando essenziale per trovare la ISO e impostare la radice ($root)
    grubText += `search --no-floppy --set=root --label ${this.volid}\n`;
    grubText += `\n`;

    // Renderizza il menu usando il template
    grubText += mustache.render(template, view);

    // Scrivi il file di configurazione finale
    Utils.write(grubCfg, grubText);

    // copy splash to efiWorkDir
    const splashDest = `${isoDir}/boot/grub/splash.png`
    let splashSrc = path.resolve(__dirname, `../../../addons/${theme}/theme/livecd/splash.png`)
    if (this.theme.includes('/')) {
        splashSrc = `${theme}/theme/livecd/splash.png`
    }

    if (!fs.existsSync(splashSrc)) {
        Utils.warning(`warning: ${splashSrc} does not exists`)
        process.exit(1)
    }
    await exec(`cp ${splashSrc} ${splashDest}`, this.echo)

    // select themeSrc
    let themeSrc = path.resolve(__dirname, `../../../addons/${theme}/theme/livecd/grub.theme.cfg`)
    if (this.theme.includes('/')) {
        themeSrc = `${theme}/theme/livecd/grub.theme.cfg`
    }

    // copy theme
    const themeDest = `${isoDir}/boot/grub/theme.cfg`
    if (!fs.existsSync(themeSrc)) {
        Utils.error(`error: ${themeSrc} does not exist`)
        process.exit(1)
    }
    fs.copyFileSync(themeSrc, themeDest)

    // selecting available fonts
    if (fs.existsSync('/usr/share/grub/font.pf2')) {
        await exec(`cp /usr/share/grub/font.pf2 ${isoDir}boot/grub/font.pf2`, this.echo)
    } else if (fs.existsSync('/usr/share/grub/unicode.pf2')) {
        await exec(`cp /usr/share/grub/unicode.pf2 ${isoDir}boot/grub/font.pf2`, this.echo)
    } else if (fs.existsSync('/usr/share/grub/ascii.pf2')) {
        await exec(`cp /usr/share/grub/ascii.pf2 ${isoDir}boot/grub/font.pf2`, this.echo)
    }

    /**
     * config.cfg
     */
    await exec(`cp ${path.resolve(__dirname, `../../../assets/config.cfg`)} ${isoDir}/boot/grub`)
}


/**
 * FUNCTIONS
 */

/**
 * 
 * @returns 
 */
function bootEfiName(): string {
    let ben = ''
    if (process.arch === 'x64') {
        ben = 'bootx64.efi'
    } else if (process.arch === 'ia32') {
        ben = 'bootia32.efi'
    } else if (process.arch === 'arm64') {
        ben = 'bootaa64.efi'
    }
    return ben
}

/**
 * 
 * @returns 
 */
function grubEfiName(): string {
    let gen = ''
    if (process.arch === 'x64') {
        gen = 'grubx64.efi'
    } else if (process.arch === 'ia32') {
        gen = 'grubia32.efi'
    } else if (process.arch === 'arm64') {
        gen = 'grubaa64.efi'
    }
    return gen
}

