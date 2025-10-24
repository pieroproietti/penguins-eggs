/**
 * ./src/classes/ovary.d/encrypt-live-fs.ts
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
 * luksRoot()
 * 
 * create a container LUKS with the entire 
 * filesystem.squashfs
 */
export async function luksRoot(this: Ovary) {

  const loggers: ConditionalLoggers = {
      log: this.hidden ? noop : console.log,
      warning: this.hidden ? noop : Utils.warning,
      success: this.hidden ? noop : Utils.success,
      info: this.hidden ? noop : Utils.info,
  };

  const { log, warning, success, info } = loggers;

  // filesystem.squashfs
  const live_fs = `${this.settings.iso_work}live/filesystem.squashfs`;


  try {
    /**
     * this.luksMappedName = 'luks.img';
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

    if (!fs.existsSync(live_fs)) {
        throw new Error(`filesystem.squashfs not found at: ${live_fs}`);
    }
    const stats = fs.statSync(live_fs);
    let size = stats.size; // Dimensione REALE del file in Byte

    // Add overhead * 1.25 per più sicurezza con file grandi
    const luksSize = Math.ceil(size * 1.25)

    warning(`filesystem.squashfs size: ${bytesToGB(size)}`)
    warning(`partition LUKS ${this.luksFile} size: ${bytesToGB(luksSize)}`)

    warning(`creating partition LUKS: ${this.luksFile}`)
    await executeCommand('truncate', ['--size', `${luksSize}`, this.luksFile])

    warning(`formatting ${this.luksFile} as a LUKS volume...`)
    await executeCommand('cryptsetup', ['--batch-mode', 'luksFormat', this.luksFile], `${this.luksPassword}\n`);

    warning(`opening the LUKS volume. It will be mapped to ${this.luksDevice}`)
    await executeCommand('cryptsetup', ['luksOpen', this.luksFile, this.luksMappedName], `${this.luksPassword}\n`)

    warning(`formatting ext4 (without journal)...`);
    await exec(`mkfs.ext4 -O ^has_journal -L live-root ${this.luksDevice}`, this.echo);

    warning(`mounting ${this.luksDevice} on ${this.luksMountpoint}`)
    if (fs.existsSync(this.luksMountpoint)) {
      if (!Utils.isMountpoint(this.luksMountpoint)) {
        await exec(`rm -rf ${this.luksMountpoint}`, this.echo)
      } else {
        throw new Error(`${this.luksMountpoint} is already mounted, process will abort!`)
      }
    }
    await exec(`mkdir -p ${this.luksMountpoint}`, this.echo)

    await exec(`mount /dev/mapper/${this.luksMappedName} ${this.luksMountpoint}`, this.echo);

    warning(`moving ${live_fs} ${this.luksMountpoint}/filesystem.squashfs`);
    await exec(`mv ${live_fs} ${this.luksMountpoint}/filesystem.squashfs`, this.echo);

    warning(`Syncing filesystem on ${this.luksMountpoint}...`);
    await exec('sync', this.echo); // Forza scrittura dati su disco

    warning(`Attempting unmount ${this.luksMountpoint}...`);
    try {
        await exec(`umount ${this.luksMountpoint}`, this.echo);
        success(`Unmounted ${this.luksMountpoint} successfully.`);
    } catch (umountError) {
        Utils.error(`Failed to unmount ${this.luksMountpoint}! Trying force unmount...`);
        // Tenta un unmount forzato/lazy come ultima risorsa
        await exec(`umount -lf ${this.luksMountpoint}`).catch((forceError) => {
             Utils.error(`Force unmount also failed: ${forceError}`);
             // Considera se lanciare un errore qui per fermare il processo
        });
        // Lancia comunque l'errore originale per segnalare il problema
        throw umountError;
    }

    warning(`closing LUKS volume ${this.luksFile}.`)
    await executeCommand('cryptsetup', ['close', this.luksMappedName])

    warning(`moving ${this.luksMappedName} on (ISO)/live.`)
    await exec(`mv ${this.luksFile} ${this.settings.iso_work}/live`, this.echo)


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
