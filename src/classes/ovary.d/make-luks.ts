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

/**
 * makeLuks()
 * 
 * create a container LUKS with the entire 
 * filesystem.squashfs
 */
export async function makeLuks(this: Ovary, clone = false, cryptedclone = false) {
  const live_fs = `${this.settings.iso_work}live/filesystem.squashfs`;

  
  try {
    /**
     * this.luksName = 'luks.img';
     * this.luksFile = `/tmp/${luksName}`
     * this.luksDevice = `/dev/mapper/${luksName}`
     * this.luksMappedName = this.luksName
     * this.luksMountpoint = `/tmp/mnt/${luksName}`
     * this.luksPassword = 'evolution' 
     */

    Utils.warning('1. Calculation of space requirements...')
    const sizeString = (await exec(`unsquashfs -s ${live_fs} | grep "Filesystem size" | sed -e 's/.*size //' -e 's/ .*//'`, { capture: true, echo: false })).data;
    let size = Number.parseInt(sizeString) // Dimensione in Byte
    
      // Add overhead * 1.05
    const luksSize = Math.ceil(size * 1.05)

    Utils.warning(`  > filesystem.squashfs size: ${bytesToGB(size)}`)
    Utils.warning(`  > partition LUKS ${this.luksFile} size: ${bytesToGB(luksSize)}`)
    
    Utils.warning(`2. Creating partition LUKS: ${this.luksFile}`)
    await executeCommand('truncate', ['--size', `${luksSize}`, this.luksFile])

    Utils.warning(`3. Formatting ${this.luksFile} as a LUKS volume...`)
    await executeCommand('cryptsetup', ['--batch-mode', 'luksFormat', this.luksFile], this.luksPassword)

    this.luksUuid = (await exec(`cryptsetup luksUUID ${this.luksFile}` , { capture: true, echo: false })).data.trim()
    Utils.warning(`4. LUKS uuid: ${this.luksUuid}`)

    Utils.warning(`5. Opening the LUKS volume. It will be mapped to ${this.luksDevice}`)
    await executeCommand('cryptsetup', ['luksOpen', this.luksFile, this.luksMappedName], this.luksPassword)

    Utils.warning(`6. Copyng filesystem.squashfs inside the ${this.luksMappedName}`)
    await exec(`dd if=${`${this.settings.iso_work}live/filesystem.squashfs`} of=${this.luksDevice} bs=1M status=progress`)

    Utils.warning(`7. Closing LUKS volume ${this.luksFile}.`)
    await executeCommand('cryptsetup', ['close', this.luksMappedName])

    Utils.warning(`8. Replace ISO/live/filesystem.squashfs with ${this.luksMappedName}.`)
    await exec(`rm ${this.settings.iso_work}live/filesystem.squashfs`)
    await exec(`mv ${this.luksFile} ${this.settings.iso_work}/live`)

    Utils.success('Encryption process successfully completed!')


  } catch (error) {
    if (error instanceof Error) {
        Utils.error(`ERROR: ${error.message}`)
    } else {
        Utils.error(`An unknown error has occurred.`)
    }
    Utils.warning('Cleaning performed following the error...')
    if (fs.existsSync(this.luksDevice)) {
       await executeCommand('cryptsetup', ['luksClose', this.luksName]).catch(() => {})
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
