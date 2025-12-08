/**
 * ./src/classes/ovary.d/luks-home.ts
 * penguins-eggs v.25.10.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

// packages
import fs from 'fs'
import { spawn, StdioOptions } from 'node:child_process'

// classes
import Ovary from '../ovary.js'
import Utils from '../utils.js'
import { exec } from '../../lib/utils.js'
const noop = () => {}; 
type ConditionalLoggers = {
    log: (...args: any[]) => void;
    warning: (msg: string) => void;
    success: (msg: string) => void;
    info: (msg: string) => void;
}


/**
 * luksHome()
 * 
 * create a container LUKS with the entire 
 * filesystem.squashfs
 */
export async function luksHome(
  this: Ovary, 
  clone = false, 
  homecrypt = false) {
  const loggers: ConditionalLoggers = {
      log: this.hidden ? noop : console.log,
      warning: this.hidden ? noop : Utils.warning,
      success: this.hidden ? noop : Utils.success,
      info: this.hidden ? noop : Utils.info,
  };

  const { log, warning, success, info } = loggers;


  try {
    /**
     * this.luksMappedName = 'home.img';
     * this.luksFile = `/tmp/${luksMappedName}`
     * this.luksDevice = `/dev/mapper/${luksMappedName}`
     * this.luksMountpoint = `/tmp/mnt/${luksMappedName}`
     * this.luksPassword = '0' 
     */

    if (this.hidden) {
      Utils.warning("intentionally blank. System is working, please wait")
    }

    log()
    log('====================================')
    log(` Creating ${this.luksMappedName}`)
    log('====================================')
    
    // Utils.warning('1. Calculation of space requirements...')

    let sizeString = (await exec('du -sb --exclude=/home/eggs /home',{capture: true})).data.trim().split(/\s+/)[0]
    let size = Number.parseInt(sizeString, 10)
    const megabyte = 1073741824
    if (size < megabyte) {
      size = megabyte
    }
    const luksSize = Math.ceil(size * 2)

    /**
     * E' più precisa ma equivalente grazie 
     * al truncate
     */
    // const fsOverhead = Math.max(size * 0.1, 100 * 1024 * 1024)
    // const luksSize = size * 1.25 + fsOverhead // +25% 

    warning(`homes size: ${bytesToGB(size)}`)
    warning(`partition LUKS ${this.luksFile} size: ${bytesToGB(luksSize)}`)

    warning(`creating partition LUKS: ${this.luksFile}`)
    await this.luksExecuteCommand('truncate', ['--size', `${luksSize}`, this.luksFile])

    warning(`formatting ${this.luksFile} as a LUKS volume...`)
    //await this.luksExecuteCommand('cryptsetup', ['--batch-mode', 'luksFormat', this.luksFile], `${this.luksPassword}\n`);
    const luksFormatArgs = this.buildLuksFormatArgs(this.luksConfig, this.luksFile);
    await this.luksExecuteCommand('cryptsetup', luksFormatArgs, `${this.luksPassword}\n`);


    warning(`opening the LUKS volume. It will be mapped to ${this.luksDevice}`)
    await this.luksExecuteCommand('cryptsetup', ['luksOpen', this.luksFile, this.luksMappedName], `${this.luksPassword}\n`)

    warning(`formatting ext4 `)
    await exec(`mkfs.ext4 -L live-home ${this.luksDevice}`,this.echo)

    warning(`mounting ${this.luksDevice} on ${this.luksMountpoint}`)
    if (fs.existsSync(this.luksMountpoint)) {
      if (!Utils.isMountpoint(this.luksMountpoint)) {
        await exec(`rm -rf ${this.luksMountpoint}`, this.echo)
      } else {
        throw new Error(`${this.luksMountpoint} is already mounted, process will abort!`)
      }
    }
    await exec(`mkdir -p ${this.luksMountpoint}`, this.echo)
    await exec(`mount /dev/mapper/${this.luksMappedName} ${this.luksMountpoint}`, this.echo)

    warning(`copying /home on  ${this.luksMountpoint}`)
    await exec(`rsync -ah --exclude='eggs' /home/ ${this.luksMountpoint}`, this.echo)


    /**
     * utenti e gruppi in .system-backup
     */
    warning(`saving user accounts info...`)
    await exec(`mkdir -p ${this.luksMountpoint}/.system-backup`, this.echo)
    
    // passwd/shadow: solo utenti con UID >= 1000
    await exec(`awk -F: '$3 >= 1000 {print}' /etc/passwd > ${this.luksMountpoint}/.system-backup/passwd`, this.echo)
    await exec(`awk -F: '$3 >= 1000 {print}' /etc/shadow > ${this.luksMountpoint}/.system-backup/shadow`, this.echo)

    // group/gshadow TUTTI
    // Gli utenti possono appartenere a gruppi di sistema (sudo, audio, video, etc.)
    await exec(`cp /etc/group ${this.luksMountpoint}/.system-backup/group`, this.echo)
    await exec(`cp /etc/gshadow ${this.luksMountpoint}/.system-backup/gshadow`, this.echo)

    /**
     * saving display manager (autologin) configs...
     */
    warning(`saving display manager configuration...`)
    // GDM (gdm3 è comune su Debian/Ubuntu)
    await exec(`[ -e /etc/gdm3 ] && cp -a /etc/gdm3 ${this.luksMountpoint}/.system-backup/`, this.echo)
    // GDM (altre distro)
    await exec(`[ -e /etc/gdm ] && cp -a /etc/gdm ${this.luksMountpoint}/.system-backup/`, this.echo)
    // LightDM
    await exec(`[ -e /etc/lightdm ] && cp -a /etc/lightdm ${this.luksMountpoint}/.system-backup/`, this.echo)
    // SDDM (sia file .conf che directory .conf.d)
    await exec(`[ -e /etc/sddm.conf ] && cp -a /etc/sddm.conf ${this.luksMountpoint}/.system-backup/`, this.echo)
    await exec(`[ -e /etc/sddm.conf.d ] && cp -a /etc/sddm.conf.d ${this.luksMountpoint}/.system-backup/`, this.echo)

    // ==============================================================================
    // INIZIO FASE DI SHRINK (COMPATTAZIONE)
    // ==============================================================================
    
    warning(`Unmounting ${this.luksMountpoint} to perform shrinking...`)
    await exec(`umount ${this.luksMountpoint}`, this.echo)

    // 1. Controllo integrità (obbligatorio prima del resize)
    warning(`Checking filesystem integrity...`)
    await exec(`e2fsck -f -y ${this.luksDevice}`, this.echo)

    // 2. Riduzione del filesystem al minimo
    warning(`Shrinking filesystem to minimum size...`)
    await exec(`resize2fs -M ${this.luksDevice}`, this.echo)

    // 3. Calcolo della nuova dimensione del filesystem
    warning(`Calculating new sizes...`)
    
    // Usiamo tune2fs per ottenere block count e block size in modo pulito
    const tuneOutput = (await exec(`tune2fs -l ${this.luksDevice}`, { capture: true })).data
    
    const blockSizeMatch = tuneOutput.match(/Block size:\s+(\d+)/)
    const blockCountMatch = tuneOutput.match(/Block count:\s+(\d+)/)

    if (!blockSizeMatch || !blockCountMatch) {
       throw new Error("Could not determine filesystem size from tune2fs")
    }

    const blockSize = parseInt(blockSizeMatch[1], 10)
    const blockCount = parseInt(blockCountMatch[1], 10)
    const fsSizeBytes = blockSize * blockCount

    // 4. Calcolo dell'offset LUKS (Header size) senza usare l'helper
    // Eseguiamo cryptsetup status direttamente e catturiamo l'output
    const statusOutput = (await exec(`cryptsetup status ${this.luksMappedName}`, { capture: true })).data
    
    // Cerchiamo la riga "offset:  4096 sectors"
    const offsetMatch = statusOutput.match(/offset:\s+(\d+)\s+sectors/)
    
    let luksHeaderBytes = 0
    if (offsetMatch && offsetMatch[1]) {
        // I settori in questo contesto sono sempre 512 bytes
        luksHeaderBytes = parseInt(offsetMatch[1], 10) * 512
        warning(`Detected LUKS header: ${bytesToGB(luksHeaderBytes)}`)
    } else {
        // Fallback sicuro: LUKS2 usa max 16MB, mettiamo 32MB per stare larghi
        luksHeaderBytes = 32 * 1024 * 1024
        warning(`Could not detect LUKS offset, using safe fallback: 32MB`)
    }

    // 5. Calcolo dimensione finale + Margine di sicurezza
    // Aggiungiamo 50MB extra per evitare errori di arrotondamento o metadati
    const safetyMargin = 50 * 1024 * 1024 
    const finalFileSize = fsSizeBytes + luksHeaderBytes + safetyMargin

    warning(`Final minimized size: ${bytesToGB(finalFileSize)}`)

    // 6. Chiusura volume
    warning(`Closing LUKS volume ${this.luksMappedName}...`)
    await this.luksExecuteCommand('cryptsetup', ['close', this.luksMappedName])

    // 7. Truncate finale
    warning(`Truncating ${this.luksFile} to release unused space...`)
    await exec(`truncate -s ${finalFileSize} ${this.luksFile}`, this.echo)

    // ==============================================================================
    // FINE FASE DI SHRINK
    // ==============================================================================
    
    // warning(`unmount ${this.luksDevice}`)
    // await exec(`umount ${this.luksMountpoint}`, this.echo)

    // warning(`closing LUKS volume ${this.luksMappedName}.`)
    // await this.luksExecuteCommand('cryptsetup', ['close', this.luksMappedName])

    warning(`moving ${this.luksMappedName}  to (ISO)/live/.`)
    await exec(`mv ${this.luksFile} ${this.settings.iso_work}/live`, this.echo)

    warning('encryption process successfully completed!')


  } catch (error) {
    if (error instanceof Error) {
      Utils.error(`ERROR: ${error.message}`)
    } else {
      Utils.error(`An unknown error has occurred.`)
    }
    Utils.warning('Cleaning performed following the error...')
    if (fs.existsSync(this.luksMountpoint)) {
      await exec(`umount -lf ${this.luksMountpoint}`).catch(() => { })
    }
    if (fs.existsSync(this.luksDevice)) {
      await this.luksExecuteCommand('cryptsetup', ['close', this.luksMappedName]).catch(() => { })
    }
    await Utils.pressKeyToExit()
    process.exit(1)
  }
}


/**
 * Converte bytes in gigabytes per la visualizzazione.
 */
function bytesToGB(bytes: number): string {
  if (bytes === 0) return '0.00 GB';
  const gigabytes = bytes / (1024 * 1024 * 1024);
  return gigabytes.toFixed(2) + ' GB';
}
