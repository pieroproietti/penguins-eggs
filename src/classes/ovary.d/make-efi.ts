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
    const efiPath = path.join(this.settings.config.snapshot_mnt,'/efi/')

    const efiWorkDir = path.join(efiPath,'/work/')
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
        await exec(`rmdir -rf ${efiPath} `)
    }
    await exec(`mkdir ${efiPath} `)
    await exec(`mkdir ${efiMemdiskDir} `)
    await exec(`mkdir ${efiMnt}`)
    await exec(`mkdir ${efiSaveDir}`)


    // create memdisk
    Utils.warning('creating temporary efiMemdiskDir on ' + efiMemdiskDir)
    await exec(`mkdir ${efiMemdiskDir}/boot`, this.echo)
    await exec(`mkdir ${efiMemdiskDir}/boot/grub`, this.echo)

    /**
     * for initial grub.cfg in memdisk
     */
    const grubCfg = `${efiMemdiskDir}/boot/grub/grub.cfg`
    let text = ''
    text += 'search --file --set=root /.disk/info\n'
    text += 'set prefix=($root)/boot/grub\n'
    text += `source $prefix/${Utils.uefiFormat()}/grub.cfg\n`
    Utils.write(grubCfg, text)

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
     * second grub.cfg file in efiWork
     */
    //         for i in $(ls /usr/lib/grub/x86_64-efi            |grep part_|grep \.mod|sed 's/.mod//'); do echo "insmod $i" >>              boot/grub/x86_64-efi/grub.cfg; done
    //let cmd = `for i in $(ls /usr/lib/grub/${Utils.uefiFormat()}|grep part_|grep \.mod|sed 's/.mod//'); do echo "insmod $i" >> ${efiWorkDir}boot/grub/${Utils.uefiFormat()}/grub.cfg; done`
    let cmd = `for i in $(ls /usr/lib/grub/${Utils.uefiFormat()}|grep part_|grep \.mod|sed 's/.mod//'); do echo "insmod $i" >> ${efiWorkDir}boot/grub/${Utils.uefiFormat()}/grub.cfg; done`
    await exec(cmd, this.echo)
    // cmd = `for i in efi_gop efi_uga ieee1275_fb vbe vga video_bochs video_cirrus jpeg png gfxterm ; do echo "insmod $i" >> ${efiWorkDir}boot/grub/${Utils.uefiFormat()}/grub.cfg ; done`
    // not find: ieee1275_fb.mod vbe.mod vga.mod
    cmd = `for i in efi_gop efi_uga vga video_bochs video_cirrus jpeg png gfxterm ; do echo "insmod $i" >> ${efiWorkDir}boot/grub/${Utils.uefiFormat()}/grub.cfg ; done`
    await exec(cmd, this.echo)
    await exec(`echo "source /boot/grub/grub.cfg" >> ${efiWorkDir}/boot/grub/${Utils.uefiFormat()}/grub.cfg`, this.echo)

    /**
     * andiamo in efiMemdiskDir
     */

    /**
     * make a tarred "memdisk" to embed in the grub image
     *
     * NOTE: it's CRUCIAL to chdir before tar!!!
     */
    const currentDir = process.cwd()
    process.chdir(efiMemdiskDir)
    await exec('tar -cvf memdisk boot', this.echo)
    process.chdir(currentDir)

    // -O, --format=FORMAT
    // -m --memdisk=FILE embed FILE as a memdisk image
    // -o, --output=FILE embed FILE as a memdisk image
    // -p, --prefix=DIR set prefix directory
    //                               --format=x86_64-efi         --memdisk=memdisk          --output=bootx64.efi           --prefix?DIR set prefix directory
    //          grub-mkimage         -O "x86_64-efi"             -m "memdisk"               -o "bootx64.efi"               -p '(memdisk)/boot/grub' search iso9660 configfile normal memdisk tar cat part_msdos part_gpt fat ext2 ntfs ntfscomp hfsplus chain boot linux
    //                                   arm64-efi
    await exec(
        `${grubName}-mkimage  -O "${Utils.uefiFormat()}" \
                -m "${efiMemdiskDir}/memdisk" \
                -o "${efiMemdiskDir}/${bootArchEfi()}" \
                -p '(memdisk)/boot/grub' \
                search iso9660 configfile normal memdisk tar cat part_msdos part_gpt fat ext2 ntfs ntfscomp hfsplus chain boot linux squash4 loopback`,
        this.echo
    )

    // copy the grub image to efi/boot (to go later in the device's root)
    await exec(`cp ${efiMemdiskDir}/${bootArchEfi()} ${efiWorkDir}/EFI/boot`, this.echo)

    // #######################

    /**
     * Create boot image "boot/grub/efi.img"
     */
    const efiImg = `${efiWorkDir}boot/grub/efi.img`
    await exec(`dd if=/dev/zero of=${efiImg} bs=1M count=10`, this.echo)
    await exec(`/sbin/mkdosfs -F 12 ${efiImg}`, this.echo)

    /**
     * create efiMnt
     */
    await exec(`mkdir ${efiMnt}`, this.echo)

    /**
     * mount efi.img on mnt-img
     */
    await exec(`mount -o loop ${efiImg} ${efiMnt}`, this.echo)

    /**
     * create structure
     */
    await exec(`mkdir ${efiMnt}/boot`, this.echo)
    await exec(`mkdir ${efiMnt}/boot/grub`, this.echo)

    // create file boot/grub/grub.cfg come segue
    const grubOnImg = `${efiMnt}/boot/grub/grub.cfg`
    // 
    // let grubOnImgTxt = `search --set=root --file /.disk/info\n`
    // let grubOnImgTxt = `search --set=root --label "${this.volid}"\n`
    let grubOnImgTxt = `search --set=root --file /live/${path.basename(Utils.vmlinuz())}\n`
    grubOnImgTxt += `set prefix=($root)/boot/grub\n`
    grubOnImgTxt += `configfile ($root)/boot/grub/grub.cfg\n`
    fs.writeFileSync(grubOnImg, grubOnImgTxt)


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

        // Copia README.md in iso/boot/grub
        fs.writeFileSync(path.join(isoDir, `/boot/grub/README.md`), content)

    }

    // save efiMnt content in efiSaveDir
    await exec(`mkdir ${efiMnt} ${efiSaveDir}`, this.echo)
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

    // Copy efi files to ISO/boot, ISO/EFI
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
     * (which gets loaded last) 
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
    const grubDest = `${isoDir}/boot/grub/grub.cfg`
    const template = fs.readFileSync(grubTemplate, 'utf8')

    const view = {
        fullname: this.settings.remix.fullname.toUpperCase(),
        initrdImg: `/live${this.settings.initrdImg}`,
        kernel: Utils.kernelVersion(),
        kernel_parameters,
        vmlinuz: `/live${this.settings.vmlinuz}`
    }
    fs.writeFileSync(grubDest, mustache.render(template, view))

    /**
     * create loopback.cfg
     */
    fs.writeFileSync(`${isoDir}/boot/grub/loopback.cfg`, 'source /boot/grub/grub.cfg\n')
    // process.exit()
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
/*
function srcShim(): string {
    return `/usr/lib/shim/shimx64.efi.signed`
}
*/
