/**
 * ./src/classes/xorriso-command.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */


// packages
import fs, { Dirent } from 'node:fs'
import path from 'node:path'

// classes
import Ovary from '../ovary.js'
import Pacman from '../pacman.js'
import Utils from '../utils.js'

// _dirname
const __dirname = path.dirname(new URL(import.meta.url).pathname)

/**
   *
   * @param cryptedclone
   * @returns cmd 4 mkiso
   */
export async function xorrisoCommand(this: Ovary, clone = false, cryptedclone = false): Promise<string> {
    if (this.verbose) {
      console.log('Ovary: xorrisoCommand')
    }

    const prefix = this.settings.config.snapshot_prefix

    let typology = ''
    // typology is applied only with standard egg-of
    if (prefix.slice(0, 7) === 'egg-of_') {
      if (clone) {
        typology = '_clone'
      } else if (cryptedclone) {
        typology = '_crypted'
      }

      if (fs.existsSync('/usr/bin/eui-start.sh')) {
        typology += '_EUI'
      }
    }

    const postfix = Utils.getPostfix()
    this.settings.isoFilename = prefix + this.volid + '_' + Utils.uefiArch() + typology + postfix
    //
    const output = this.settings.config.snapshot_mnt + this.settings.isoFilename

    let command = ''
    // const appid = `-appid "${this.settings.distro.distroId}" `
    // const publisher = `-publisher "${this.settings.distro.distroId}/${this.settings.distro.codenameId}" `
    // const preparer = '-preparer "prepared by eggs <https://penguins-eggs.net>" '

    let isoHybridMbr = ''
    if (!process.arch.includes('arm')) {
      if (this.settings.config.make_isohybrid) {
        const isolinuxFile = path.resolve(__dirname, `../../../bootloaders/syslinux/isohdpfx.bin`)
        if (fs.existsSync(isolinuxFile)) {
          isoHybridMbr = `-isohybrid-mbr ${isolinuxFile}`
        } else {
          Utils.warning(`Can't create isohybrid image. File: ${isolinuxFile} not found. \nThe resulting image will be a standard iso file`)
        }
      }
    }

    // su arm no isolinux
    let isolinuxBin = ''
    let isolinuxCat = ''
    let noemulboot= ''
    let bootloadsize = ''
    let bootinfotable = ''

    if (!process.arch.includes('arm')) {
      isolinuxBin = `-b isolinux/isolinux.bin`
      isolinuxCat = `-c isolinux/boot.cat`
      noemulboot = '-no-emul-boot'
      bootloadsize = '-boot-load-size 4'
      bootinfotable = '-boot-info-table'
    } 
    
    if (Pacman.packageIsInstalled('genisoimage')) {
      this.genisoimage = true

      command = `genisoimage \
        -iso-level 3 \
        -allow-limited-size \
        -joliet-long \
        -r \
        -V ${this.volid} \
        -cache-inodes \
        -J \
        -l \
        ${isolinuxBin} \
        ${isolinuxCat} \
        ${noemulboot} \
        ${bootloadsize} \
        ${bootinfotable} \
        -eltorito-alt-boot \
        -e boot/grub/efi.img \
        -no-emul-boot \
        -o ${output} ${this.settings.iso_work}`

      return command
    }
    
    
    /**
     * xorriso
     */
    // uefi_opt="-uefi_elToritoAltBoot-alt-boot -e boot/grub/efi.img -isohybrid-gpt-basdat -no-emul-boot"
    let uefi_elToritoAltBoot = ''
    let uefi_e = ''
    let uefi_isohybridGptBasdat = ''
    let uefi_noEmulBoot = ''
    if (this.settings.config.make_efi) {
      uefi_elToritoAltBoot = '-eltorito-alt-boot'
      uefi_e = '-e boot/grub/efi.img'
      uefi_isohybridGptBasdat = '-isohybrid-gpt-basdat'
      uefi_noEmulBoot = '-no-emul-boot'
    }
    /**
     * L'immagine efi è efi.img ed è
     * presente in boot/grub/efi.img
     * per cui:
     * -append_partition 2 0xef efi.img
     * --efi-boot efi.img
     * non sono necessari
     */

    command = `xorriso -as mkisofs \
     -J \
     -joliet-long \
     -l \
     -iso-level 3 \
     ${isoHybridMbr} \
     -partition_offset 16 \
     -V ${this.volid} \
     ${isolinuxBin} \
     ${isolinuxCat} \
     -no-emul-boot \
     -boot-load-size 4 \
     -boot-info-table \
     ${uefi_elToritoAltBoot} \
     ${uefi_e} \
     ${uefi_isohybridGptBasdat} \
     ${uefi_noEmulBoot} \
     -o ${output} ${this.settings.iso_work}`

    return command

  }
