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
 * * @param this 
 * @param theme 
 */
export async function makeEfi(this: Ovary, theme = 'eggs') {
    const bootloaders = Diversions.bootloaders(this.familyId)

    /**
     * Define default paths based on arch
     */
    let signed = false
    let grubEfi = ''
    let shimEfi = ''

    // Default paths based on architecture
    if (process.arch === 'x64') {
        grubEfi = path.resolve(bootloaders, `grub/x86_64-efi/monolithic/grubx64.efi`)
        shimEfi = path.resolve(bootloaders, `shim/shimx64.efi`)
    } else if (process.arch === 'ia32') {
        grubEfi = path.resolve(bootloaders, `grub/i386-efi/monolithic/grubia32.efi`)
        shimEfi = path.resolve(bootloaders, `shim/shimia32.efi`) // raramente usato non firmato
    } else if (process.arch === 'arm64') {
        grubEfi = path.resolve(bootloaders, `grub/arm64-efi/monolithic/grubaa64.efi`)
        shimEfi = path.resolve(bootloaders, `shim/shimaa64.efi`)
    } else if (process.arch === 'riscv64') {
        // Percorso per RISC-V (assumendo struttura simile)
        // Nota: Assicurati che Diversions.bootloaders punti al posto giusto o che i file esistano lì
        grubEfi = path.resolve(bootloaders, `grub/riscv64-efi/monolithic/grubriscv64.efi`)
        shimEfi = '' // Solitamente niente SHIM su RISC-V per ora
    }

    /**
     * Gestione Secure Boot (Debian/Ubuntu/Devuan)
     */
    if (this.familyId === "debian") {
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
        } else if (process.arch === 'riscv64') {
            // Per ora niente firma su RISC-V Debian, fallback su unsigned
            signed = false
            grubEfi = path.resolve(bootloaders, `grub/riscv64-efi/monolithic/grubriscv64.efi`)
            shimEfi = ''
        }
    }

    // Safety check se i file non esistono (es. grub riscv non trovato)
    if (!fs.existsSync(grubEfi) && process.arch === 'riscv64') {
         // Fallback tentativo path alternativo o warning
         Utils.warning(`Warning: ${grubEfi} not found. Checking alternate paths...`)
    }

    if (signed) {
        Utils.warning(`Your live system ${this.distroId}/${process.arch} can boot with Secure Boot enabled`)
    } else {
        Utils.warning(`You must disable Secure Boot to boot live system ${this.distroId}/${process.arch}`)
    }
    // 2 secondi per leggere...    
    await new Promise(resolve => setTimeout(resolve, 2000))


    const efiPath = path.join(this.settings.config.snapshot_mnt, '/efi/')
    const efiWorkDir = path.join(efiPath, '/work/')
    const efiMemdiskDir = path.join(efiPath, '/memdisk/')
    const efiImgMnt = path.join(efiPath, 'mnt')
    const isoDir = this.settings.iso_work

    // create (ISO)/boot/grub
    await exec(`mkdir ${isoDir}/boot/grub/${Utils.uefiFormat()} -p`, this.echo)

    // create (ISO)/EFI
    await exec(`mkdir ${isoDir}/EFI/boot -p`, this.echo)
    
    // Copy EFI binaries to ISO root
    if (shimEfi && fs.existsSync(shimEfi)) {
        await exec(`cp ${shimEfi} ${isoDir}/EFI/boot/${bootEfiName()}`, this.echo)
    }
    // Se non c'è shim (es. RISC-V), copiamo grub direttamente come boot<arch>.efi?
    // Solitamente se c'è shim: bootx64.efi = shim, grubx64.efi = grub
    // Se NO shim: bootx64.efi = grub
    if (!shimEfi || !fs.existsSync(shimEfi)) {
        await exec(`cp ${grubEfi} ${isoDir}/EFI/boot/${bootEfiName()}`, this.echo)
    } else {
        await exec(`cp ${grubEfi} ${isoDir}/EFI/boot/${grubEfiName()}`, this.echo)
    }

    // clean/create all in efiPath
    if (fs.existsSync(efiPath)) {
        await exec(`rm -rf ${efiPath}`)
    }
    await exec(`mkdir ${efiPath}`, this.echo)
    await exec(`mkdir ${efiMemdiskDir}`, this.echo)
    await exec(`mkdir ${efiImgMnt}`, this.echo)
    await exec(`mkdir ${efiWorkDir}`, this.echo)

    /**
     * create efi.img logic
     */

    // Seeker GRUB config: cerca il file .disk/id/UUID
    let seeker = ''
    seeker += `search --file --no-floppy --set=root /.disk/id/${this.uuid}\n`
    seeker += "set prefix=($root)/boot/grub\n"
    seeker += "source $prefix/${grub_cpu}-efi/grub.cfg\n"
    
    // Fallback generico se la source fallisce (utile per debug)
    seeker += "configfile ($root)/boot/grub/grub.cfg\n"

    /**
     * creating grub.cfg (1) seeker for usb on (efi.img)/boot/grub/grub.cfg
     */
    Utils.warning("creating grub.cfg seeker USB on (efi.img)/boot/grub")
    await exec(`mkdir ${path.join(efiMemdiskDir, "/boot/grub -p")}`, this.echo)
    const cfgSeekerUsb = `${efiMemdiskDir}/boot/grub/grub.cfg`
    let cfgSeekerUsbText = ''
    cfgSeekerUsbText += `# grub.cfg seeker\n`
    cfgSeekerUsbText += `# created on ${efiMemdiskDir}, path ${cfgSeekerUsb}\n`
    cfgSeekerUsbText += `\n`
    cfgSeekerUsbText += seeker
    Utils.write(cfgSeekerUsb, cfgSeekerUsbText)

    /**
     * create grub.cfg (bridge) on (ISO)/boot/grub/x86_64-efi/grub.cfg
     */
    Utils.warning(`creating grub.cfg bridge to main. (ISO)/boot/grub/${Utils.uefiFormat()}`)
    let cfgBridge = path.join(isoDir, '/boot/grub/', Utils.uefiFormat(), '/grub.cfg')
    let cfgBridgeText = `# grub.cfg bridge\n`
    if (!this.hidden) {
        cfgBridgeText += `# created on ${cfgBridge}\n`
    }
    cfgBridgeText += `\n`
    // Qui è dove l'architettura specifica punta al grub generico
    cfgBridgeText += `source /boot/grub/grub.cfg\n`
    fs.writeFileSync(cfgBridge, cfgBridgeText)

    /**
     * grub bait
     */
    let pathBait = path.join(isoDir, '/EFI/debian')
    if (this.distroLike === 'Ubuntu') {
        pathBait = path.join(isoDir, '/EFI/ubuntu')
    }
    await exec(`mkdir ${pathBait} -p`, this.echo)
    Utils.warning(`creating grub.cfg seeker ISO/DVD on (ISO)/EFI/${path.basename(pathBait)}`)
    let cfgBait = path.join(pathBait, '/grub.cfg')
    let cfgBaitText = ''
    cfgBaitText += `\n`
    cfgBaitText += seeker
    Utils.write(cfgBait, cfgBaitText)


    /**
     * README.md
     */
    let baitReadme = path.join(pathBait, '/README.md')
    let baitReadmeText = ``
    if (this.distroLike !== 'Debian' && this.distroLike !== 'Ubuntu') {
        baitReadmeText += `# penguins-eggs\n`
        baitReadmeText += '\n'
        baitReadmeText += `This is just an hack, to let ${this.distroId} boot using Debian trixie bootloaders\n`
        fs.writeFileSync(baitReadme, baitReadmeText)
    }

    /**
     * creating structure efiWorkDir
     */
    await exec(`mkdir -p ${efiWorkDir}/boot/grub`, this.echo) // qua va grub.cfg 2
    await exec(`mkdir -p ${efiWorkDir}/EFI/boot`)

    /**
     * create tarred efiMemdiskDir (Legacy/Memdisk method)
     */
    const currentDir = process.cwd()
    process.chdir(efiMemdiskDir)
    await exec('tar -cvf memdisk boot', this.echo)
    process.chdir(currentDir)

    /**
     * Create boot image "boot/grub/efi.img"
     */
    const efiImg = path.join(efiWorkDir, `boot/grub/efi.img`)
    // Aumentato leggermente il size per sicurezza
    await exec(`dd if=/dev/zero of=${efiImg} bs=1M count=16`, this.echo) 
    await exec(`/sbin/mkdosfs -F 12 ${efiImg}`, this.echo)
    await new Promise(resolve => setTimeout(resolve, 500))

    // mount efi.img on mountpoint mnt-img
    await exec(`mount --make-shared -o loop ${efiImg} ${efiImgMnt}`, this.echo)
    await new Promise(resolve => setTimeout(resolve, 1000))

    // create structure inside (efi.img)
    await exec(`mkdir -p ${efiImgMnt}/boot`, this.echo)
    await exec(`mkdir -p ${efiImgMnt}/EFI/boot`, this.echo)

    /**
     * copy grubCfg1 (grub.cfg) to (efi.img)/boot/grub
     */
    // 1. Copia standard in /boot/grub.cfg (path interna immagine)
    await exec(`cp ${cfgSeekerUsb} ${efiImgMnt}/boot/grub.cfg`, this.echo)
    
    // 2. Copia i binari EFI
    if (shimEfi && fs.existsSync(shimEfi)) {
        await exec(`cp ${shimEfi} ${efiImgMnt}/EFI/boot/${bootEfiName()}`, this.echo)
        await exec(`cp ${grubEfi} ${efiImgMnt}/EFI/boot/${grubEfiName()}`, this.echo)
    } else {
        // Se no shim (RISC-V), grub diventa il boot loader principale
        await exec(`cp ${grubEfi} ${efiImgMnt}/EFI/boot/${bootEfiName()}`, this.echo)
    }

    // 3. FIX CRUCIALE PER RISC-V (e robustezza generale):
    // Copia il grub.cfg seeker ANCHE accanto al binario EFI in /EFI/boot/
    // Perché GRUB portable spesso cerca il config nella sua stessa cartella.
    await exec(`cp ${cfgSeekerUsb} ${efiImgMnt}/EFI/boot/grub.cfg`, this.echo)

    await new Promise(resolve => setTimeout(resolve, 1000))
    if (!fs.existsSync(`${efiImgMnt}/boot/grub.cfg`)) {
        console.log(`error copyng ${cfgSeekerUsb} seeker for USB on (efi.img)/boot/grub.cfg`)
        process.exit(1)
    }
    await new Promise(resolve => setTimeout(resolve, 500))

    await exec(`umount ${efiImgMnt}`, this.echo)
    await new Promise(resolve => setTimeout(resolve, 500))

    // Copy isoImg in ${${isoDir}/boot/grub
    Utils.warning("copyng (efi.img) on (ISO)/boot/grub")
    await exec(`cp ${efiImg} ${isoDir}/boot/grub`, this.echo)


    /**
     * creating grub.cfg (4) on (ISO)/boot/grub
     */
    Utils.warning("creating grub.cfg main on (ISO)/boot/grub")
    // splash.png
    let splashSrc = ''
    const splashDest = `${efiWorkDir}/boot/grub/splash.png`

    let themeSrc = ''
    const themeDest = `${isoDir}/boot/grub/theme.cfg`

    let grubTemplate = ''
    if (this.hidden) {
        splashSrc = path.resolve(__dirname, `../../../addons/${theme}/theme/livecd/generic-splash.png`)
        grubTemplate = path.resolve(__dirname, '../../../addons/eggs/theme/livecd/generic.grub.main.cfg')
        themeSrc = path.resolve(__dirname, '../../../addons/eggs/theme/livecd/generic.grub.theme.cfg')
    } else {
        // ... (resto della logica temi invariata)
        splashSrc = path.resolve(__dirname, `../../../addons/${theme}/theme/livecd/splash.png`)
        if (this.theme.includes('/')) {
            splashSrc = `${theme}/theme/livecd/splash.png`
        }

        if (!fs.existsSync(splashSrc)) {
            Utils.warning(`warning: ${splashSrc} does not exists`)
            process.exit(1)
        }

        // select themeSrc
        themeSrc = path.resolve(__dirname, `../../../addons/${theme}/theme/livecd/grub.theme.cfg`)
        if (this.theme.includes('/')) {
            themeSrc = `${theme}/theme/livecd/grub.theme.cfg`
        }

        if (!fs.existsSync(themeSrc)) {
            Utils.error(`error: ${themeSrc} does not exist`)
            process.exit(1)
        }

        // fonts... (invariato)
        if (fs.existsSync('/usr/share/grub/font.pf2')) {
            await exec(`cp /usr/share/grub/font.pf2 ${efiWorkDir}boot/grub/font.pf2`, this.echo)
        } else if (fs.existsSync('/usr/share/grub/unicode.pf2')) {
            await exec(`cp /usr/share/grub/unicode.pf2 ${efiWorkDir}boot/grub/font.pf2`, this.echo)
        } else if (fs.existsSync('/usr/share/grub/ascii.pf2')) {
            await exec(`cp /usr/share/grub/ascii.pf2 ${efiWorkDir}boot/grub/font.pf2`, this.echo)
        }

        // Copy workdir files to ISO/boot
        await exec(`rsync -avx  ${efiWorkDir}/boot ${isoDir}/`, this.echo)

        /**
         * prepare main grub.cfg from grub.main.cfg
         */
        grubTemplate = `${theme}/theme/livecd/grub.main.cfg`
        if (!fs.existsSync(grubTemplate)) {
            grubTemplate = path.resolve(__dirname, '../../../addons/eggs/theme/livecd/grub.main.cfg')
        }

        if (!fs.existsSync(grubTemplate)) {
            Utils.error(`error: ${grubTemplate} does not exist`)
            process.exit(1)
        }
    }

    // splash.png
    await exec(`cp ${splashSrc} ${splashDest}`, this.echo)

    // grub.theme.png
    fs.copyFileSync(themeSrc, themeDest)

    // grub.main.png
    const kernel_parameters = Diversions.kernelParameters(this.familyId, this.volid, this.fullcrypt)
    const cfgMain = path.join(isoDir, '/boot/grub/grub.cfg')
    const template = fs.readFileSync(grubTemplate, 'utf8')

    let fullname = this.settings.remix.fullname.toUpperCase() 
    if (this.hidden) {
        fullname = "LINUX"
    }

    /**
     * FIX KERNEL NAME FOR RISC-V
     * Se siamo su RISC-V, forziamo l'uso di 'vmlinux' invece di 'vmlinuz' nel config
     */
    let kernelFile = `/live/${path.basename(this.vmlinuz)}`
    if (process.arch === 'riscv64') {
        kernelFile = kernelFile.replace('vmlinuz', 'vmlinux')
    }

    const view = {
        fullname: fullname,
        initrdImg: `/live/${path.basename(this.initrd)}`,
        kernel: this.kernel,
        kernel_parameters,
        vmlinuz: kernelFile // Usiamo la variabile modificata
    }

    let cfgMainText = ''
    cfgMainText += `# grub.cfg (4) main\n`
    if (!this.hidden) {
        cfgMainText += `# created on ${cfgMain}`
    }
    cfgMainText += `\n`
    cfgMainText += mustache.render(template, view)
    fs.writeFileSync(cfgMain, cfgMainText)
}


/**
 * FUNCTIONS
 */

/**
 * * @returns 
 */
function bootEfiName(): string {
    let ben = ''
    if (process.arch === 'x64') {
        ben = 'bootx64.efi'
    } else if (process.arch === 'ia32') {
        ben = 'bootia32.efi'
    } else if (process.arch === 'arm64') {
        ben = 'bootaa64.efi'
    } else if (process.arch === 'riscv64') {
        ben = 'bootriscv64.efi'
    }
    return ben
}

/**
 * * @returns 
 */
function grubEfiName(): string {
    let gen = ''
    if (process.arch === 'x64') {
        gen = 'grubx64.efi'
    } else if (process.arch === 'ia32') {
        gen = 'grubia32.efi' // c'era uno spazio typo nel tuo codice originale "grub ia32", corretto qui
    } else if (process.arch === 'arm64') {
        gen = 'grubaa64.efi'
    } else if (process.arch === 'riscv64') {
        gen = 'grubriscv64.efi'
    }
    return gen
}
