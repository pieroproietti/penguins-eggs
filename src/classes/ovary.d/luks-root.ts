/**
 * ./src/classes/ovary.d/luks-root.ts
 * penguins-eggs v.25.10.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

// packages
import fs from 'fs'

import { exec } from '../../lib/utils.js'
// classes
import Ovary from '../ovary.js'
import Utils from '../utils.js'
import {
  type ArgonCryptoConfig,
  type CryptoConfig,
  interactiveCryptoConfig,
  type Pbkdf2CryptoConfig
} from './luks-interactive-crypto-config.js';

const noop = () => { };
type ConditionalLoggers = {
  info: (msg: string) => void;
  log: (...args: any[]) => void;
  success: (msg: string) => void;
  warning: (msg: string) => void;
}

/**
 * luksRoot()
 * create a container LUKS with the entire 
 * filesystem.squashfs
 */
export async function luksRoot(this: Ovary) {

  const loggers: ConditionalLoggers = {
    info: this.hidden ? noop : Utils.info,
    log: this.hidden ? noop : console.log,
    success: this.hidden ? noop : Utils.success,
    warning: this.hidden ? noop : Utils.warning,
  };

  const { info, log, success, warning } = loggers;

  // filesystem.squashfs
  const live_fs = `${this.settings.iso_work}live/filesystem.squashfs`;

  try {
    /**
     * this.luksMappedName = 'root.img';
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

    if (!fs.existsSync(live_fs)) {
      throw new Error(`filesystem.squashfs not found at: ${live_fs}`);
    }

    const stats = fs.statSync(live_fs);
    const {size} = stats; // Dimensione REALE del file in Byte

    // -------------------------------------------------------------
    // CALCOLO DIMENSIONE OTTIMIZZATA (No shrink, safe allocation)
    // -------------------------------------------------------------
    
    // 1. Overhead Ext4: Inode, bitmap, superblocchi. ~3-4% è standard senza journal.
    const fsOverhead = Math.ceil(size * 0.04); 

    // 2. Header LUKS: Solitamente 16MB per LUKS2, usiamo 32MB per sicurezza.
    const luksHeader = 32 * 1024 * 1024;

    // 3. Margine di sicurezza (Buffer): 120MB fissi.
    // Questo spazio evita errori di "Disk full" durante la copia dei metadati.
    // Viene compensato dall'uso di "-m 0" nella formattazione.
    const safetyBuffer = 120 * 1024 * 1024;

    // 4. Somma totale
    const calculatedSize = size + fsOverhead + luksHeader + safetyBuffer;

    // 5. Allineamento a 4MB (Performance storage)
    const alignment = 4 * 1024 * 1024;
    const luksSize = Math.ceil(calculatedSize / alignment) * alignment;

    warning(`------------------------------------------`)
    warning(`SAFE SIZE CALCULATION (No Shrink):`)
    warning(`  Payload (SquashFS): ${bytesToGB(size)}`)
    warning(`  Calc. Overhead:     ${bytesToGB(luksSize - size)}`)
    warning(`  TOTAL CONTAINER:    ${bytesToGB(luksSize)}`)
    warning(`------------------------------------------`)

    warning(`creating partition LUKS: ${this.luksFile}`)
    await this.luksExecuteCommand('truncate', ['--size', `${luksSize}`, this.luksFile])

    warning(`formatting ${this.luksFile} as a LUKS volume...`)
    const luksFormatArgs = this.buildLuksFormatArgs(this.luksConfig, this.luksFile);
    await this.luksExecuteCommand('cryptsetup', luksFormatArgs, `${this.luksPassword}\n`);

    warning(`opening the LUKS volume. It will be mapped to ${this.luksDevice}`)
    await this.luksExecuteCommand('cryptsetup', ['luksOpen', this.luksFile, this.luksMappedName], `${this.luksPassword}\n`)

    // -------------------------------------------------------------
    // FORMATTAZIONE EXT4
    // -m 0 : Imposta i blocchi riservati a 0% (recupera spazio)
    // -O ^has_journal : Disabilita il journal (risparmia spazio e scritture)
    // -------------------------------------------------------------
    warning(`formatting ext4 (without journal, 0% reserved)...`);
    await exec(`mkfs.ext4 -m 0 -O ^has_journal -L live-root ${this.luksDevice}`, this.echo);

    warning(`mounting ${this.luksDevice} on ${this.luksMountpoint}`)
    if (fs.existsSync(this.luksMountpoint)) {
      if (Utils.isMountpoint(this.luksMountpoint)) {
        throw new Error(`${this.luksMountpoint} is already mounted, process will abort!`)
      } else {
        await exec(`rm -rf ${this.luksMountpoint}`, this.echo)
      }
    }

    await exec(`mkdir -p ${this.luksMountpoint}`, this.echo)

    await exec(`mount /dev/mapper/${this.luksMappedName} ${this.luksMountpoint}`, this.echo);

    warning(`moving ${live_fs} ${this.luksMountpoint}/filesystem.squashfs`);
    await exec(`mv ${live_fs} ${this.luksMountpoint}/filesystem.squashfs`, this.echo);

    warning(`Syncing filesystem on ${this.luksMountpoint}...`);
    await exec('sync', this.echo); // Forza scrittura dati su disco

    /**
     * SHRINK DISABILITATO
     * Non eseguiamo this.luksShrink() per evitare corruzione dati.
     * Abbiamo calcolato la dimensione corretta all'inizio.
     */
    
    // Procedura di chiusura manuale (sostituisce quella dentro shrink)
    warning(`Unmounting ${this.luksMountpoint}...`)
    await exec(`umount ${this.luksMountpoint}`, this.echo)

    warning(`Closing LUKS volume ${this.luksMappedName}...`)
    await this.luksExecuteCommand('cryptsetup', ['close', this.luksMappedName])

    warning(`moving ${this.luksMappedName} on (ISO)/live.`)
    await exec(`mv ${this.luksFile} ${this.settings.iso_work}/live/root.img`, this.echo)

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