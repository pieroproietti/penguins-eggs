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


/**
 * luksRoot()
 * 
 * create a container LUKS with the entire 
 * filesystem.squashfs
 */
export async function luksHome(this: Ovary, clone = false, cryptedhome = false) {
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

    // Scrive la chiave statica
    // fs.writeFileSync(`${this.settings.iso_work}/live/home.key`, this.luksPassword + '\n');

    console.log()
    console.log('====================================')
    console.log(" Creating home.img")
    console.log('====================================')
    
    Utils.warning('1. Calculation of space requirements...')

    let sizeString = (await exec('du -sb --exclude=/home/eggs /home',{capture: true})).data.trim().split(/\s+/)[0]
    let size = Number.parseInt(sizeString, 10)
    // const fsOverhead = Math.max(size * 0.1, 100 * 1024 * 1024)
    // const luksSize = size + fsOverhead + (size * 0.2) // +20% di sicurezza

    const luksSize = Math.ceil(size * 2)
    Utils.warning(`  > homes size: ${bytesToGB(size)}`)
    //evUtils.warning(`  > filesystem overhead: ${bytesToGB(fsOverhead)}`)
    Utils.warning(`  > partition LUKS ${this.luksFile} size: ${bytesToGB(luksSize)}`)

    Utils.warning(`2. Creating partition LUKS: ${this.luksFile}`)
    await executeCommand('truncate', ['--size', `${luksSize}`, this.luksFile])

    Utils.warning(`3. Formatting ${this.luksFile} as a LUKS volume...`)
    await executeCommand('cryptsetup', ['--batch-mode', 'luksFormat', this.luksFile], `${this.luksPassword}\n`);
    // await executeCommand('cryptsetup', ['--batch-mode', 'luksFormat', '--key-file', `${this.settings.iso_work}/live/home.key`, this.luksFile]);

    this.luksUuid = (await exec(`cryptsetup luksUUID ${this.luksFile}`, { capture: true, echo: false })).data.trim()
    Utils.warning(`4. LUKS uuid: ${this.luksUuid}`)

    Utils.warning(`5. Opening the LUKS volume. It will be mapped to ${this.luksDevice}`)
    //await executeCommand('cryptsetup', ['luksOpen', '--key-file', `${this.settings.iso_work}/live/home.key`, this.luksFile, this.luksMappedName])
    await executeCommand('cryptsetup', ['luksOpen', this.luksFile, this.luksMappedName], `${this.luksPassword}\n`)

    Utils.warning(`5. Formatting ext4`)
    await exec(`mkfs.ext4 -L live-root ${this.luksDevice}`)

    Utils.warning(`6. Mount `)
    if (fs.existsSync(this.luksMountpoint)) {
      if (!Utils.isMountpoint(this.luksMountpoint)) {
        await exec(`rm -rf ${this.luksMountpoint}`)
      } else {
        throw new Error(`${this.luksMountpoint} is already mounted, process will abort!`)
      }
    }
    await exec(`mkdir -p ${this.luksMountpoint}`)

    await exec(`mount /dev/mapper/${this.luksName} ${this.luksMountpoint}`)

    Utils.warning(`7. Copying /home on  ${this.luksName}`)
    await exec(`rsync -ah --exclude='eggs' /home/ ${this.luksMountpoint}`)

    Utils.warning(`7b. Saving user accounts info...`)
    // Crea directory per backup system files
    await exec(`mkdir -p ${this.luksMountpoint}/.system-backup`)
    
    // Filtra solo utenti con UID >= 1000
    await exec(`awk -F: '$3 >= 1000 {print}' /etc/passwd > ${this.luksMountpoint}/.system-backup/passwd`)
    await exec(`awk -F: '$3 >= 1000 {print}' /etc/shadow > ${this.luksMountpoint}/.system-backup/shadow`)

    // Per i gruppi: salva TUTTI (non filtrare per GID)
    // Gli utenti possono appartenere a gruppi di sistema (sudo, audio, video, etc.)
    await exec(`cp /etc/group ${this.luksMountpoint}/.system-backup/group`)
    await exec(`cp /etc/gshadow ${this.luksMountpoint}/.system-backup/gshadow`)

    Utils.warning(`8. Unmount `)
    await exec(`umount ${this.luksMountpoint}`)

    Utils.warning(`9. Closing LUKS volume ${this.luksFile}.`)
    await executeCommand('cryptsetup', ['close', this.luksMappedName])

    Utils.warning(`10. Moving ${this.luksName}  to ISO/live/.`)
    await exec(`mv ${this.luksFile} ${this.settings.iso_work}/live`)

    Utils.success('Encryption process successfully completed!')

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
      await executeCommand('cryptsetup', ['luksClose', this.luksName]).catch(() => { })
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

