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

import { exec } from '../../lib/utils.js'
// classes
import Ovary from '../ovary.js'
import Utils from '../utils.js'
const noop = () => {}; 
type ConditionalLoggers = {
    info: (msg: string) => void;
    log: (...args: any[]) => void;
    success: (msg: string) => void;
    warning: (msg: string) => void;
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
      info: this.hidden ? noop : Utils.info,
      log: this.hidden ? noop : console.log,
      success: this.hidden ? noop : Utils.success,
      warning: this.hidden ? noop : Utils.warning,
  };

  const { info, log, success, warning } = loggers;


  try {
    /**
     * this.luksMappedName = 'home.img';
     * this.luksFile = `/var/tmp/${luksMappedName}`
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

    const sizeString = (await exec('du -sb --exclude=/home/eggs /home',{capture: true})).data.trim().split(/\s+/)[0]
    const size = Number.parseInt(sizeString, 10)
    const fsOverhead = Math.ceil(size * 0.05);
    const luksHeader = 32 * 1024 * 1024;
    const safetyBuffer = 100 * 1024 * 1024;
    let calculatedSize = size + fsOverhead + luksHeader + safetyBuffer;
    const minSize = 64 * 1024 * 1024;
    if (calculatedSize < minSize) calculatedSize = minSize;
    const alignment = 4 * 1024 * 1024;
    const luksSize = Math.ceil(calculatedSize / alignment) * alignment;

    warning(`------------------------------------------`)
    warning(`HOME CRYPT CALCULATION (Read-Only):`)
    warning(`  Data Payload:   ${bytesToGB(size)}`)
    warning(`  Overhead+Buf:   ${bytesToGB(luksSize - size)}`)
    warning(`  TOTAL SIZE:     ${bytesToGB(luksSize)}`)
    warning(`------------------------------------------`)

    warning(`creating partition LUKS: ${this.luksFile}`)
    await this.luksExecuteCommand('truncate', ['--size', `${luksSize}`, this.luksFile])

    warning(`formatting ${this.luksFile} as a LUKS volume...`)
    // await this.luksExecuteCommand('cryptsetup', ['--batch-mode', 'luksFormat', this.luksFile], `${this.luksPassword}\n`);
    const luksFormatArgs = this.buildLuksFormatArgs(this.luksConfig, this.luksFile);
    await this.luksExecuteCommand('cryptsetup', luksFormatArgs, `${this.luksPassword}\n`);


    warning(`opening the LUKS volume. It will be mapped to ${this.luksDevice}`)
    await this.luksExecuteCommand('cryptsetup', ['luksOpen', this.luksFile, this.luksMappedName], `${this.luksPassword}\n`)

    warning(`formatting ext4 `)
    await exec(`mkfs.ext4 -L live-home ${this.luksDevice}`,this.echo)

    warning(`mounting ${this.luksDevice} on ${this.luksMountpoint}`)
    if (fs.existsSync(this.luksMountpoint)) {
      if (Utils.isMountpoint(this.luksMountpoint)) {
        throw new Error(`${this.luksMountpoint} is already mounted, process will abort!`)
      } else {
        await exec(`rm -rf ${this.luksMountpoint}`, this.echo)
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

    warning(`Syncing filesystem on ${this.luksMountpoint}...`);
    await exec('sync', this.echo); // Forza scrittura dati su disco

    // Shrink()
    await this.luksShrink()

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

    if (fs.existsSync(this.luksFile)) {
       Utils.warning(`Removing temporary container: ${this.luksFile}`);
       fs.unlinkSync(this.luksFile);
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
