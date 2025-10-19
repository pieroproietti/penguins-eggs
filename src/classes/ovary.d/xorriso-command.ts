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
import Diversions from '../diversions.js'

// _dirname
const __dirname = path.dirname(new URL(import.meta.url).pathname)

/**
   *
   * @param fullcrypt
   * @returns cmd 4 mkiso
   */
export async function xorrisoCommand(this: Ovary, clone = false, homecrypt=false, fullcrypt = false): Promise<string> {
    const prefix = this.settings.config.snapshot_prefix


    // typology is applied only with standard egg-of
    let typology = ''

    if (prefix.slice(0, 7) === 'egg-of_') {
        if (clone) {
            typology = '_clone'
        } else if (homecrypt) {
            typology = '_clone-home-crypted'
        } else if (fullcrypt) {
            // filesystem.squashfs.real
            typology = '_clone-full-crypted'
        }

        if (fs.existsSync('/usr/bin/eui-start.sh')) {
            typology += '_EUI'
        }
    }

    // postfix (data)
    const postfix = Utils.getPostfix()
    this.settings.isoFilename = prefix + this.volid + '_' + Utils.uefiArch() + typology + postfix

    // node della ISO
    const output = this.settings.config.snapshot_mnt + this.settings.isoFilename


    let command = ''
    // const appid = `-appid "${this.settings.distro.distroId}" `
    // const publisher = `-publisher "${this.settings.distro.distroId}/${this.settings.distro.codenameId}" `
    // const preparer = '-preparer "prepared by eggs <https://penguins-eggs.net>" '

    let isoHybridMbr = ''
    if (this.settings.config.make_isohybrid) {
        const bootloaders = Diversions.bootloaders(this.familyId)
        const isohybridFile = path.resolve(bootloaders, `ISOLINUX/isohdpfx.bin`)
        if (fs.existsSync(isohybridFile)) {
            isoHybridMbr = `-isohybrid-mbr ${isohybridFile}`
        } else {
            Utils.warning(`Can't create isohybrid image, file: ${isohybridFile} not found!`)
            process.exit()
        }
    }

    // su arm no isolinux
    let isolinuxBin = ''
    let isolinuxCat = ''
    let noemulboot = ''
    let bootloadsize = ''
    let bootinfotable = ''
    if (process.arch !== 'arm64') {
        isolinuxBin = `-b isolinux/isolinux.bin`
        isolinuxCat = `-c isolinux/boot.cat`
        noemulboot = '-no-emul-boot'
        bootloadsize = '-boot-load-size 4'
        bootinfotable = '-boot-info-table'
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

       // <<< INIZIO BLOCCO AGGIUNTO >>>
        let luksPartitionParam = '' // Inizializziamo la variabile per il parametro LUKS
        if (fullcrypt) {
            // Costruiamo il percorso del file luks.img all'interno della directory di build
            const luksImagePath = path.join(this.settings.iso_work, 'live', this.luksName)
            
            // Verifichiamo che il file esista prima di aggiungerlo
            if (fs.existsSync(luksImagePath)) {
                // Costruiamo il parametro per aggiungere la partizione 3
                luksPartitionParam = `-append_partition 3 0x80 ${luksImagePath}`;
            } else {
                Utils.warning(`Errore: impossibile creare l'ISO criptata, file non trovato: ${luksImagePath}`);
                process.exit();
            }
        }
        // <<< FINE BLOCCO AGGIUNTO >>>        

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
    }
    return command
}
