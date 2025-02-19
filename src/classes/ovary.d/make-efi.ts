/**
 * ./src/classes/ovary.d/make-efi.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
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
 * makeEFI
 */
export async function makeEfi(this: Ovary, theme = 'eggs') {
    const efiPath = path.join(this.settings.config.snapshot_mnt, '/efi/')

    const efiWorkDir = path.join(efiPath, '/work/')
    const efiMemdiskDir = path.join(efiPath, '/memdisk/')
    const efiSaveDir = path.join(efiPath, '/saved/')
    const efiMnt = path.join(efiPath, '/mnt/')

    const isoDir = this.settings.iso_work

    /**
     * grub/grub2 MUST to exists
     */
    const grubName = Diversions.grubName(this.familyId)
    if (grubName === '') {
        Utils.error('Something went wrong! Cannot find grub.')
        process.exit(1)
    }

    // clean all
    if (fs.existsSync(efiPath)) {
        await exec(`rm -rf ${efiPath} `)
    }
    await exec(`mkdir ${efiPath} `)
    await exec(`mkdir ${efiMemdiskDir} `)
    if (fs.existsSync(efiMnt)) {
        await exec(`rm -rf ${efiMnt}`, this.echo)
    }
    await exec(`mkdir ${efiMnt}`, this.echo)
    await exec(`mkdir ${efiSaveDir}`)


    // create memdisk
    Utils.warning('creating temporary efiMemdiskDir on ' + efiMemdiskDir)
    await exec(`mkdir ${path.join(efiMemdiskDir, "/boot")}`, this.echo)
    await exec(`mkdir ${path.join(efiMemdiskDir, "/boot/grub")}`, this.echo)
    await exec(`mkdir ${path.join(efiMemdiskDir, "/EFI")}`, this.echo)

    /**
     * for initial grub.cfg in memdisk
     */
    const grub1 = `${efiMemdiskDir}/boot/grub/grub.cfg`
    let grubText1 = `# grub.cfg 1 created on ${efiMemdiskDir}\n`
    grubText1 += `search --file --set=root /.disk/id/${this.uuid}\n`
    grubText1 += 'set prefix=($root)/boot/grub\n'
    grubText1 += `source $prefix/${Utils.uefiFormat()}/grub.cfg\n`
    grubText1 += `if [ -n "$root" ]; then\n`
    grubText1 += `  echo "grub1: root filesystem "$root" not found!"\n`
    grubText1 += `fi\n`

    Utils.write(grub1, grubText1)

    // config

    // #################################

    /**
     * start with empty efiWorkDir
     */
    if (fs.existsSync(efiWorkDir)) {
        await exec(`rm ${efiWorkDir} -rf`, this.echo)
    }

    Utils.warning('creating temporary efiWordDir on ' + efiWorkDir)
    await exec(`mkdir ${efiWorkDir}`, this.echo)
    await exec(`mkdir ${efiWorkDir}/boot`, this.echo)
    await exec(`mkdir ${efiWorkDir}/boot/grub`, this.echo)
    await exec(`mkdir ${efiWorkDir}/boot/grub/${Utils.uefiFormat()}`, this.echo)
    await exec(`mkdir ${efiWorkDir}/EFI`, this.echo)
    await exec(`mkdir ${efiWorkDir}/EFI/boot`, this.echo)

    /**
     * copy splash to efiWorkDir
     */
    const splashDest = `${efiWorkDir}/boot/grub/splash.png`
    let splashSrc = path.resolve(__dirname, `../../../addons/${theme}/theme/livecd/splash.png`)
    if (this.theme.includes('/')) {
        splashSrc = `${theme}/theme/livecd/splash.png`
    }

    if (!fs.existsSync(splashSrc)) {
        Utils.warning('Cannot find: ' + splashSrc)
        process.exit()
    }
    await exec(`cp ${splashSrc} ${splashDest}`, this.echo)

    /**
     * copy theme
     */
    const themeDest = `${efiWorkDir}/boot/grub/theme.cfg`
    let themeSrc = path.resolve(__dirname, `../../../addons/${theme}/theme/livecd/grub.theme.cfg`)
    if (this.theme.includes('/')) {
        themeSrc = `${theme}/theme/livecd/grub.theme.cfg`
    }

    if (!fs.existsSync(themeSrc)) {
        Utils.warning('Cannot find: ' + themeSrc)
        process.exit()
    }
    await exec(`cp ${themeSrc} ${themeDest}`, this.echo)


    /**
     * SECOND grub.cfg file in efiWork/boot/grub/x86_64-efi/grub.cfg
     */
    const g2 = `${efiWorkDir}/boot/grub/${Utils.uefiFormat()}/grub.cfg`
    const scanDir = `/usr/lib/grub/${Utils.uefiFormat()}`
    const files = fs.readdirSync(scanDir)
    const partFiles = files.filter(file => file.startsWith('part'))
    let grubText2 = `# grub.cfg 2 created on ${g2}\n`
    grubText2 +=`\n`
    partFiles.forEach(file => {
        grubText2 += `insmod ${file}\n`
    })

    const mods=["efi_gop", "efi_uga", "vga", "video_bochs", "video_cirrus", "jpeg png", "gfxterm"]
    mods.forEach(file => {
        grubText2 += `insmod ${file}\n`
    })
    grubText2 += `source /boot/grub/grub.cfg\n`
    grubText2 += `if [ -n "$root" ]; then\n`
    grubText2 += `  echo "grub2: root filesystem "$root" not found!"\n`
    grubText2 += `fi\n`
    fs.writeFileSync(g2, grubText2, 'utf-8')

    /**
     * andiamo in efiMemdiskDir
     */
    const currentDir = process.cwd()
    process.chdir(efiMemdiskDir)

    /**
     * make a tarred "memdisk" to embed in the grub image
     * NOTE: it's CRUCIAL to chdir before tar!!!
     */
    await exec('tar -cvf memdisk boot', this.echo)

    /**
     * Torniamo alla directory corrente
     */
    process.chdir(currentDir)

    /**
     * creazione BOOTX86.efi on efiMemdiskDir
     */
    await exec(
        `${grubName}-mkimage  -O "${Utils.uefiFormat()}" \
                -m "${efiMemdiskDir}/memdisk" \
                -o "${efiMemdiskDir}/${bootArchEfi()}" \
                -p '(memdisk)/boot/grub' \
                search iso9660 configfile normal memdisk tar cat part_msdos part_gpt fat ext2 ntfs ntfscomp hfsplus chain boot linux squash4 loopback`,
        this.echo
    )

    // copy the BOOTX86.efi to EFI/boot (to go later in the device's root)
    await exec(`cp ${efiMemdiskDir}/${bootArchEfi()} ${efiWorkDir}/EFI/boot`, this.echo)

    // #######################

    /**
     * Create boot image "boot/grub/efi.img"
     */
    const efiImg = `${efiWorkDir}boot/grub/efi.img`
    await exec(`dd if=/dev/zero of=${efiImg} bs=1M count=10`, this.echo)
    await exec(`/sbin/mkdosfs -F 12 ${efiImg}`, this.echo)

    /**
     * mount efi.img on mnt-img
     */
    await exec(`mount -o loop ${efiImg} ${efiMnt}`, this.echo)

    /**
     * create structure
     */
    await exec(`mkdir ${efiMnt}/boot`, this.echo)
    await exec(`mkdir ${efiMnt}/boot/grub`, this.echo)

    await exec(`mkdir ${efiMnt}/EFI`, this.echo)
    await exec(`mkdir ${efiMnt}/EFI/boot`, this.echo)


    /**
     * copyng grub[x86/aa64].efi to efi.img
     * 
     * GAE = Grub Arch Efi path+Grub 
     */
    let GAE = srcGAES()
    if (!fs.existsSync(srcGAE())) {
        GAE = srcGAE()
    }

    if (!fs.existsSync(GAE)) {
        console.log(`error: cannot find ${GAE}`)
    } else {
        /**
         * copy shimx64.efi.signed as bootx64.efi
         * copy grubx64.efi.signed as grubx64.efi
         * create README.md
         */

        await exec(`cp ${srcShim()} ${efiMnt}/EFI/boot/${bootArchEfi()}`, this.echo)
        await exec(`cp ${GAE} ${efiMnt}/EFI/boot/${nameGAE()}`, this.echo)

        // README.md in EFI
        let content = `# README\n`
        content += `${srcShim()} copied as ${bootArchEfi()}\n`
        content += `${GAE} copied as ${nameGAE()}\n`
        fs.writeFileSync(path.join(efiMnt, `/EFI/boot/README.md`), content)

        // Create README.md in iso/boot/grub
        fs.writeFileSync(path.join(isoDir, `/boot/grub/README.md`), content)
    }

    // save efiMnt content in efiSaveDir
    await exec(`mkdir ${efiSaveDir}`, this.echo)
    await exec(`cp -r ${efiMnt}/* ${efiSaveDir}`, this.echo)

    // umount efiMnt
    await exec(`umount ${efiMnt}`, this.echo)

    // #######################

    /**
     * copy modules and font
     */
    await exec(`cp -r /usr/lib/grub/${Utils.uefiFormat()}/* ${efiWorkDir}boot/grub/${Utils.uefiFormat()}/`, this.echo)

    // if this doesn't work try another font from the same place (grub's default, unicode.pf2, is much larger)
    // Either of these will work, and they look the same to me. Unicode seems to work with qemu. -fsr
    if (fs.existsSync('/usr/share/grub/font.pf2')) {
        await exec(`cp /usr/share/grub/font.pf2 ${efiWorkDir}boot/grub/font.pf2`, this.echo)
    } else if (fs.existsSync('/usr/share/grub/unicode.pf2')) {
        await exec(`cp /usr/share/grub/unicode.pf2 ${efiWorkDir}boot/grub/font.pf2`, this.echo)
    } else if (fs.existsSync('/usr/share/grub/ascii.pf2')) {
        await exec(`cp /usr/share/grub/ascii.pf2 ${efiWorkDir}boot/grub/font.pf2`, this.echo)
    }

    // cp efi.img on iso / ## not need 
    await exec(`cp ${efiImg} ${this.settings.iso_work}`)


    //  popd

    // Copy Workdir files to ISO/boot, ISO/EFI
    await exec(`rsync -avx  ${efiWorkDir}/boot ${isoDir}/`, this.echo)
    await exec(`rsync -avx ${efiWorkDir}/EFI  ${isoDir}/`, this.echo)
    if (fs.existsSync(GAE)) {
        // README.md in EFI
        let content = `# README\n`
        content += `${srcGAE()} copied as /EFI/boot/${nameGAE()}\n`
        fs.writeFileSync(path.join(isoDir, `EFI/boot/README.md`), content)
        // here grubx64.efi.signed is copied as grubx64.efi
        await exec(`cp ${srcGAES()} ${isoDir}/EFI/boot/${nameGAE()}`)
    }


    /**
     * Theme
     */

    // select grubThemeSrc
    let grubThemeSrc = path.resolve(__dirname, `../../../addons/${theme}/theme/livecd/grub.theme.cfg`)
    if (this.theme.includes('/')) {
        grubThemeSrc = `${theme}/theme/livecd/grub.theme.cfg`
    }

    // copy theme
    const grubThemeDest = `${isoDir}/boot/grub/theme.cfg`
    if (!fs.existsSync(grubThemeSrc)) {
        Utils.warning('Cannot find: ' + grubThemeSrc)
        process.exit()
    }
    fs.copyFileSync(grubThemeSrc, grubThemeDest)

    /**
     * prepare main grub.cfg from grub.main.cfg
     * 
     */
    let grubTemplate = `${theme}/theme/livecd/grub.main.cfg`
    if (!fs.existsSync(grubTemplate)) {
        grubTemplate = path.resolve(__dirname, '../../../addons/eggs/theme/livecd/grub.main.cfg')
    }

    if (!fs.existsSync(grubTemplate)) {
        Utils.warning('Cannot find: ' + grubTemplate)
        process.exit()
    }

    const kernel_parameters = Diversions.kernelParameters(this.familyId, this.volid) // this.kernelParameters()
    const g3 = path.join(isoDir, '/boot/grub/grub.cfg')
    const template = fs.readFileSync(grubTemplate, 'utf8')

    const view = {
        fullname: this.settings.remix.fullname.toUpperCase(),
        initrdImg: `/live${this.settings.initrdImg}`,
        kernel: Utils.kernelVersion(),
        kernel_parameters,
        vmlinuz: `/live${this.settings.vmlinuz}`
    }
    let grubText3 = `# grub.cfg 3 created on ${g3}`
    grubText3 += mustache.render(template, view)
    grubText3 += `if [ -n "$root" ]; then\n`
    grubText3 += `  echo "grub2: root filesystem "$root" not found!"\n`
    grubText3 += `fi\n`

    fs.writeFileSync(g3, grubText3)

    /**
     * create loopback.cfg
     */
    fs.writeFileSync(`${isoDir}/boot/grub/loopback.cfg`, 'source /boot/grub/grub.cfg\n')

    /**
     * config.cfg
     */
    await exec(`cp ${path.resolve(__dirname, `../../../assets/config.cfg`)} ${isoDir}/boot/grub`)

    await exec(`mkdir ${isoDir}/DEBUG`)
    fs.writeFileSync(`${isoDir}DEBUG/grub1.cfg`, grubText1)
    fs.writeFileSync(`${isoDir}DEBUG/grub2.cfg`, grubText2)
    fs.writeFileSync(`${isoDir}DEBUG/grub3.cfg`, grubText3)
}


/**
 * 
 * @returns 
 */
function bootArchEfi(): string {
    let bn = 'nothing.efi'
    if (process.arch === 'x64') {
        bn = 'bootx64.efi'
    } else if (process.arch === 'arm64') {
        bn = 'bootaa64.efi'
    }
    return bn
}

/**
 * 
 * @returns 
 */
function nameGAE(): string {
    let bn = 'nothing.efi'
    if (process.arch === 'x64') {
        bn = 'grubx64.efi'
    } else if (process.arch === 'arm64') {
        bn = 'grubaa64.efi'
    }
    return bn
}

function nameGAES(): string {
    return nameGAE() + '.signed'
}

function srcGAE(): string {
    return '/usr/lib/grub/' + Utils.uefiFormat() + '/monolithic/' + nameGAE()
}

function srcGAES(): string {
    return '/usr/lib/grub/' + Utils.uefiFormat() + '-signed/' + nameGAES()
}

function srcShim(): string {
    const signedShim = '/usr/lib/shim/shimx64.efi.signed';
    const unsignedShim = '/usr/lib/shim/shimx64.efi';
    return fs.existsSync(signedShim) ? signedShim : unsignedShim;
}
