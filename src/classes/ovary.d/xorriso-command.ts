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

import Diversions from '../diversions.js'
// classes
import Ovary from '../ovary.js'
import Pacman from '../pacman.js'
import Utils from '../utils.js'

// _dirname
const __dirname = path.dirname(new URL(import.meta.url).pathname)

/**
 *
 * @param fullcrypt
 * @returns cmd 4 mkiso
 */
export async function xorrisoCommand(this: Ovary, clone = false, homecrypt = false, fullcrypt = false): Promise<string> {
  const prefix = this.settings.config.snapshot_prefix

  // typology is applied only with standard egg-of
  let typology = ''

  if (prefix.slice(0, 7) === 'egg-of_') {
    if (clone) {
      typology = '_clone'
    } else if (homecrypt) {
      typology = '_clone-home-crypted'
    } else if (fullcrypt) {
      typology = '_clone-full-crypted'
    }

    if (fs.existsSync('/usr/bin/eui-start.sh')) {
      typology += '_EUI'
    }
  }

  // postfix (data)
  const postfix = Utils.getPostfix()
  console.log('postfix:', postfix)
  this.settings.isoFilename = prefix + this.volid + '_' + Utils.uefiArch() + typology + postfix
  console.log('isoFilename:', this.settings.isoFilename)

  const output = this.settings.config.snapshot_mnt + this.settings.isoFilename

  let command = ''

  // Isohybrid MBR: solo se non siamo su arm64 o riscv64
  let isoHybridMbr = ''
  if (this.settings.config.make_isohybrid && process.arch !== 'arm64' && process.arch !== 'riscv64') {
    const bootloaders = Diversions.bootloaders(this.familyId)
    const isohybridFile = path.resolve(bootloaders, `ISOLINUX/isohdpfx.bin`)
    if (fs.existsSync(isohybridFile)) {
      isoHybridMbr = `-isohybrid-mbr ${isohybridFile}`
    } else {
      Utils.warning(`Can't create isohybrid image, file: ${isohybridFile} not found!`)
      process.exit()
    }
  }

  // Gestione parametri Bootloader x86
  let isolinuxBin = ''
  let isolinuxCat = ''
  let x86_boot_params = ''

  if (process.arch !== 'arm64' && process.arch !== 'riscv64') {
    isolinuxBin = `-b isolinux/isolinux.bin`
    isolinuxCat = `-c isolinux/boot.cat`
    // Questi sono i parametri che su RISC-V causano il fallimento di xorriso
    x86_boot_params = '-no-emul-boot -boot-load-size 4 -boot-info-table'
  }

  if (Pacman.packageIsInstalled('xorriso')) {
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

    let luksPartitionParam = ''
    if (fullcrypt) {
      const luksImagePath = path.join(this.settings.iso_work, 'live', this.luksMappedName)
      if (fs.existsSync(luksImagePath)) {
        luksPartitionParam = `-append_partition 3 0x80 ${luksImagePath}`
      } else {
        Utils.warning(`Errore: impossibile creare l'ISO criptata, file non trovato: ${luksImagePath}`)
        process.exit()
      }
    }

    // Il comando ora usa x86_boot_params che sarà vuoto su RISC-V
    command = `xorriso -as mkisofs \
                    -J \
                    -joliet-long \
                    -r \
                    -l \
                    -iso-level 3 \
                    ${isoHybridMbr} \
                    -partition_offset 16 \
                    -V ${this.volid} \
                    ${isolinuxBin} \
                    ${isolinuxCat} \
                    ${x86_boot_params} \
                    ${uefi_elToritoAltBoot} \
                    ${uefi_e} \
                    ${uefi_isohybridGptBasdat} \
                    ${uefi_noEmulBoot} \
                    ${luksPartitionParam} \
                    -o ${output} ${this.settings.iso_work}`
  }

  return command
}
