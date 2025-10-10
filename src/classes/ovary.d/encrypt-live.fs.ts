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
 * encryptLiveFs()
 * 
 * create a container LUKS with the entire 
 * filesystem.squashfs
 */
export async function encryptLiveFs(this: Ovary, clone = false, cryptedclone = false) {
  const live_fs = `${this.settings.iso_work}live/filesystem.squashfs`;

  const luksName = 'encrypted.filesystem.squashfs';
  const luksFile = `/tmp/${luksName}`
  const luksDevice = `/dev/mapper/${luksName}`
  const luksMountpoint = `/tmp/mnt/${luksName}`
  const luksPassword = 'evolution' // USARE UNA PASSWORD SICURA IN PRODUZIONE!

  try {
    Utils.warning('1. Calculation of space requirements...')
    const sizeString = (await exec(`unsquashfs -s ${live_fs} | grep "Filesystem size" | sed -e 's/.*size //' -e 's/ .*//'`, { capture: true, echo: false })).data;
    let size = Number.parseInt(sizeString) // Dimensione in Byte
    
    // Add overhead 20% (filesystem ext4 and LUKS metadata)
    const luksSize = Math.ceil(size * 1.2)
    Utils.warning(`  > filesystem.squashfs size: ${bytesToGB(size)}`)
    Utils.warning(`  > container LUKS ${luksFile} size: ${bytesToGB(luksSize)}`)
    
    Utils.warning(`2. Creating the container file: ${luksFile}`)
    await executeCommand('truncate', ['--size', `${luksSize}`, luksFile])

    Utils.warning(`3. Formatting ${luksFile} as a LUKS volume...`)
    await executeCommand('cryptsetup', ['--batch-mode', 'luksFormat', luksFile], luksPassword)

    Utils.warning(`4. Opening the LUKS volume. It will be mapped to ${luksDevice}`)
    await executeCommand('cryptsetup', ['luksOpen', luksFile, luksName], luksPassword)
    
    Utils.warning("   Please wait for opening...")
    await executeCommand('udevadm', ['settle'])

    Utils.warning(`5. Formatting ${luksDevice} with ext4 filesystem...`)
    await executeCommand('mkfs.ext4', [luksDevice])
    
    Utils.warning(`6. Creating the mount point: ${luksMountpoint}`)
    if (!fs.existsSync(luksMountpoint)) {
      await executeCommand('mkdir', ['-p', luksMountpoint])
    }
    
    Utils.warning(`7. mounting ${luksDevice} on ${luksMountpoint}`)
    await executeCommand('mount', [luksDevice, luksMountpoint])

    Utils.warning(`8. Moving filesystem.squashfs to the encrypted volume...`)
    await executeCommand('mv', [live_fs, luksMountpoint])

    Utils.warning(`9. Unmounting ${luksMountpoint}...`)
    await executeCommand('umount', [luksMountpoint])
    
    Utils.warning(`10. Closing LUKS volume ${luksName}...`)
    await executeCommand('cryptsetup', ['luksClose', luksName])
    
    const finalDestination = `${this.settings.iso_work}live/${luksName}`
    Utils.warning(`11. Moving ${luksFile} to ${finalDestination}`)
    await executeCommand('mv', [luksFile, finalDestination])
    
    Utils.success('Encryption process successfully completed!')

  } catch (error) {
    if (error instanceof Error) {
        Utils.error(`ERROR: ${error.message}`)
    } else {
        Utils.error(`An unknown error has occurred.`)
    }
    Utils.warning('Cleaning performed following the error...')
    if (Utils.isMountpoint(luksMountpoint)) {
      await executeCommand('umount', ['-l', luksMountpoint]).catch(() => {})
    }
    if (fs.existsSync(luksDevice)) {
       await executeCommand('cryptsetup', ['luksClose', luksName]).catch(() => {})
    }
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
    
    // console.log(`command: ${command}`)
    // console.log(`args: ${args}`)
    // console.log(`stdioConfig: ${stdioConfig}`)

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


