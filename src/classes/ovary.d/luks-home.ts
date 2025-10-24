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
      Utils.warning("system is working, please wait...")
    }

    log()
    log('====================================')
    log(` Creating ${this.luksMappedName}`)
    log('====================================')
    
    // Utils.warning('1. Calculation of space requirements...')

    let sizeString = (await exec('du -sb --exclude=/home/eggs /home',{capture: true})).data.trim().split(/\s+/)[0]
    let size = Number.parseInt(sizeString, 10)
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
    await executeCommand('truncate', ['--size', `${luksSize}`, this.luksFile])

    warning(`formatting ${this.luksFile} as a LUKS volume...`)
    await executeCommand('cryptsetup', ['--batch-mode', 'luksFormat', this.luksFile], `${this.luksPassword}\n`);


    warning(`opening the LUKS volume. It will be mapped to ${this.luksDevice}`)
    await executeCommand('cryptsetup', ['luksOpen', this.luksFile, this.luksMappedName], `${this.luksPassword}\n`)

    warning(`formatting c ext4 `)
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

    warning(`saving user accounts info...`)
    // Crea directory per backup system files
    await exec(`mkdir -p ${this.luksMountpoint}/.system-backup`, this.echo)
    
    // Filtra solo utenti con UID >= 1000
    await exec(`awk -F: '$3 >= 1000 {print}' /etc/passwd > ${this.luksMountpoint}/.system-backup/passwd`, this.echo)
    await exec(`awk -F: '$3 >= 1000 {print}' /etc/shadow > ${this.luksMountpoint}/.system-backup/shadow`, this.echo)

    // Per i gruppi: salva TUTTI (non filtrare per GID)
    // Gli utenti possono appartenere a gruppi di sistema (sudo, audio, video, etc.)
    await exec(`cp /etc/group ${this.luksMountpoint}/.system-backup/group`, this.echo)
    await exec(`cp /etc/gshadow ${this.luksMountpoint}/.system-backup/gshadow`, this.echo)

    warning(`unmount ${this.luksDevice}`)
    await exec(`umount ${this.luksMountpoint}`, this.echo)

    warning(`closing LUKS volume ${this.luksMappedName}.`)
    await executeCommand('cryptsetup', ['close', this.luksMappedName])

    warning(`moving ${this.luksMappedName}  to (ISO)/live/.`)
    await exec(`mv ${this.luksFile} ${this.settings.iso_work}/live`, this.echo)

    warning('encryption process successfully completed!')

    /**
     * YOU MUST! unlink the key on production
     */
    // fs.unlinkSync(`${this.settings.iso_work}/live/home.key`)


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
      await executeCommand('cryptsetup', ['close', this.luksMappedName]).catch(() => { })
    }
    await Utils.pressKeyToExit()
    process.exit(1)
  }
}

/**
 * Funzione helper per eseguire comandi esterni in modo asincrono,
 * gestendo lo standard input per passare le password.
 * Restituisce una Promise che si risolve al successo o si rigetta in caso di errore.
 */
function executeCommand(command: string, args: string[], stdinData?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Se passiamo dati a stdin, dobbiamo usare 'pipe'. Altrimenti, 'inherit'.
    const stdioConfig: StdioOptions = stdinData ? ['pipe', 'inherit', 'inherit'] : 'inherit';

    const process = spawn(command, args, { stdio: stdioConfig });

    // Se fornito, scriviamo i dati (es. la password) nello stdin del processo.
    if (stdinData && process.stdin) {
      process.stdin.write(stdinData);
      process.stdin.end();
    }

    process.on('error', (err) => {
      reject(new Error(`Error starting command "${command}": ${err.message}`));
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve(); // Success
      } else {
        reject(new Error(`Command "${command} ${args.join(' ')}" ended with error code ${code}`));
      }
    });
  });
}


/**
 * Converte bytes in gigabytes per la visualizzazione.
 */
function bytesToGB(bytes: number): string {
  if (bytes === 0) return '0.00 GB';
  const gigabytes = bytes / (1024 * 1024 * 1024);
  return gigabytes.toFixed(2) + ' GB';
}
