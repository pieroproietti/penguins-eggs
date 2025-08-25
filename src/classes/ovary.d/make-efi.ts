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
     * Except distroLike Debian
     */
    if (this.distroLike === 'Debian') {
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
        Utils.warning(`Your live system ${this.distroId}/${process.arch} can boot with Secure Boot enabled`)
    } else {
        Utils.warning(`You must disable Secure Boot to boot live system ${this.distroId}/${process.arch}`)
    }
    // 2 secondi per leggere...
    await new Promise(resolve => setTimeout(resolve, 2000))

    /**
     * Debian 13 until luly 30 worked on EFI with same grun and xorriso
     * (efi.img)/boot -> boot.cfg    
     *           EFI ->  boot -> bootx64.efi  grubx64.efi
     * 
     * (iso)/EFI/boot -> bootx64.efi  grubx64.efi
     *           nothing-else-here
     *  
     * Debian 13 ofiginal
     * (efi.img):  efi/boot -> bootx64.efi  grubx64.efi
     *             efi/debian  -> grub.cfg
     * 
     * (iso)/EFI/: boot -> bootx64.efi  grubx64.efi
     *             debian -> grub.cfg
     * 
     */

    const efiPath = path.join(this.settings.config.snapshot_mnt, '/efi/')
    const efiWorkDir = path.join(efiPath, '/work/')
    const efiMemdiskDir = path.join(efiPath, '/memdisk/')
    const efiImgMnt = path.join(efiPath, 'mnt')
    const isoDir = this.settings.iso_work
    await exec(`mkdir ${isoDir}/boot/grub/ -p`, this.echo)
    await exec(`cp -r ${bootloaders}/grub/x86_64-efi ${isoDir}/boot/grub/`, this.echo)

    // create (iso)/EFI
    await exec(`mkdir ${isoDir}/EFI/boot -p`, this.echo)
    await exec(`cp ${shimEfi} ${isoDir}/EFI/boot/${bootEfiName()}`, this.echo)
    await exec(`cp ${grubEfi} ${isoDir}/EFI/boot/${grubEfiName()}`, this.echo)

    // clean/create all in efiPath
    if (fs.existsSync(efiPath)) {
        await exec(`rm -rf ${efiPath}`)
    }
    await exec(`mkdir ${efiPath}`, this.echo)
    await exec(`mkdir ${efiMemdiskDir}`, this.echo)
    await exec(`mkdir ${efiImgMnt}`, this.echo)
    await exec(`mkdir ${efiWorkDir}`, this.echo)

    /**
     * create efi.img
     */
    Utils.warning("creating grub.cfg (1) on efi.img")
    await exec(`mkdir ${path.join(efiMemdiskDir, "/boot/grub -p")}`, this.echo)

    const grubCfg1 = `${efiMemdiskDir}/boot/grub/grub.cfg`
    let grubText1 = `# grub.cfg 1\n`
    grubText1 += `# created on ${efiMemdiskDir}\n`
    grubText1 += `\n`
    grubText1 += `search --file --set=root /.disk/id/${this.uuid}\n`
    grubText1 += "set prefix=($root)/boot/grub\n"
    grubText1 += "source $prefix/${grub_cpu}-efi/grub.cfg\n" // trixie
    // grubText1 += `source ($root)/boot/grub/grub.cfg\n` // precedente
    Utils.write(grubCfg1, grubText1)

    /**
     * creating structure efiWordDir
     */
    await exec(`mkdir -p ${efiWorkDir}/boot/grub`, this.echo) // qua va grub.cfg 2
    await exec(`mkdir -p ${efiWorkDir}/EFI/boot`)

    /**
     * create tarred efiMemdiskDir
     */
    const currentDir = process.cwd()
    process.chdir(efiMemdiskDir)
    await exec('tar -cvf memdisk boot', this.echo)
    process.chdir(currentDir)

    /**
     * Create boot image "boot/grub/efi.img"
     */
    const efiImg = path.join(efiWorkDir, `boot/grub/efi.img`)
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
    await exec(`cp ${grubCfg1} ${efiImgMnt}/boot/grub.cfg`, this.echo) 
    await exec(`cp ${shimEfi} ${efiImgMnt}/EFI/boot/${bootEfiName()}`, this.echo)
    await exec(`cp ${grubEfi} ${efiImgMnt}/EFI/boot/${grubEfiName()}`, this.echo)
    await new Promise(resolve => setTimeout(resolve, 1000))
    if (fs.existsSync(`${efiImgMnt}/boot/grub.cfg`)) {
        Utils.warning(`grub.cfg (1) was copied on (efi.img)/boot/grub.cfg`)
    } else {
        console.log(`error copyng ${grubCfg1} on (efi.img)/boot/grub.cfg`)
        process.exit(1)
    }
    await new Promise(resolve => setTimeout(resolve, 500))
    
    await exec(`umount ${efiImgMnt}`, this.echo)
    await new Promise(resolve => setTimeout(resolve, 500))

    // Copy isoImg in ${${isoDir}/boot/grub
    Utils.warning("copyng efi.img on (iso)/boot/grub")
    await exec(`cp ${efiImg} ${isoDir}/boot/grub`, this.echo)


    /**
     * creating grub.cfg (2) on (iso)/boot/grub
     */
    Utils.warning("creating grub.cfg (2) on (iso)/boot/grub")

    // copy splash to efiWorkDir
    const splashDest = `${efiWorkDir}/boot/grub/splash.png`
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
    let grubTemplate = `${theme}/theme/livecd/grub.main.cfg`
    if (!fs.existsSync(grubTemplate)) {
        grubTemplate = path.resolve(__dirname, '../../../addons/eggs/theme/livecd/grub.main.cfg')
    }

    if (!fs.existsSync(grubTemplate)) {
        Utils.error(`error: ${grubTemplate} does not exist`)
        process.exit(1)
    }

    const kernel_parameters = Diversions.kernelParameters(this.familyId, this.volid) // this.kernelParameters()
    const grubCfg2 = path.join(isoDir, '/boot/grub/grub.cfg')
    const template = fs.readFileSync(grubTemplate, 'utf8')

    const view = {
        fullname: this.settings.remix.fullname.toUpperCase(),
        initrdImg: `/live/${path.basename(this.initrd)}`,
        kernel: this.kernel,
        kernel_parameters,
        vmlinuz: `/live/${path.basename(this.vmlinuz)}`
    }
    let grubText2 = `# grub.cfg 2\n`
    grubText2 += ` # created on ${grubCfg2}`
    grubText2 += `\n`
    grubText2 += mustache.render(template, view)

    fs.writeFileSync(grubCfg2, grubText2)

    /**
     * creating grub.cfg (3) on (iso)/EFI/debian
     */
    Utils.warning("creating grub.cfg (3) on (iso)/EFI/debian")
    await exec(`mkdir -p ${isoDir}/EFI/debian`, this.echo)
    const grubCfg3 = path.join(isoDir, '/EFI/debian/grub.cfg')
    let grubText3 = ""
    grubText3 += `search --file --set=root /.disk/id/${this.uuid}\n`
    grubText3 += "set prefix=($root)/boot/grub\n"
    grubText3 += "source $prefix/${grub_cpu}-efi/grub.cfg\n"
    fs.writeFileSync(grubCfg3, grubText3)
 

    /**
     * create loopback.cfg
     */
    fs.writeFileSync(`${isoDir}/boot/grub/loopback.cfg`, 'source /boot/grub/grub.cfg\n')

    /**
     * create (iso)/boot/grub/x86_64-efi/grub.cfg
     */
    fs.writeFileSync(`${isoDir}/boot/grub/${Utils.uefiFormat()}/grub.cfg`, 'source /boot/grub/grub.cfg\n')

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
        gen = 'bootia32.efi'
    } else if (process.arch === 'arm64') {
        gen = 'grubaa64.efi'
    }
    return gen
}

