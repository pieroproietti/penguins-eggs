/**
 * ./src/classes/utils.d/filesystem.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * Filesystem operations utilities - files, UUID, disk space
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import fs from 'fs'
import path from 'path'
import shx from 'shelljs'
import System from './system.js'
import Formatters from './formatters.js'
import PackageInfo from './package-info.js'

// interfaces
import IOsRelease from '../../interfaces/i-os-release.js'

export default class Filesystem {
   /**
    * 
    * @param file 
    * @param search 
    * @returns value
    */
   static searchOnFile(file = '', search = ''): string {
      const lines = fs.readFileSync(file, 'utf8').split("\n")
      let value = ''
      lines.forEach(line => {
         line = line.replace(/\s+/g, ' ') // Remove multiple spaces with single space
         if (line.includes(search)) {
            value = line.substring(line.indexOf('=') + 1)
         }
      })
      value = value.replaceAll('"', '') // Remove "
      return value.trim()
   }

   /**
    * restituisce uuid
    * @param device
    */
   static uuid(device: string): string {
      const uuid = shx.exec(`blkid -s UUID -o value ${device}`).stdout.trim()
      return uuid
   }

   /**
    * 
    * @param device 
    * @returns 
    */
   static uuidGen(): string {
      const uuid = shx.exec(`uuidgen`, { silent: true }).stdout.trim()
      return uuid
   }

   /**
    * Calculate the space used on the disk
    * @return {void}
    */
   static getUsedSpace(): number {
      let fileSizeInBytes = 0
      if (System.isLive()) {
         fileSizeInBytes = 0 // this.getLiveRootSpace()
      } else {
         fileSizeInBytes = Number(
            shx.exec(`df /home | /usr/bin/awk 'NR==2 {print $3}'`, {
               silent: true
            }).stdout
         )
      }
      return fileSizeInBytes
   }

   /**
    * write a file
    * @param file
    * @param text
    */
   static write(file: string, text: string): void {
      text = text.trim() + '\n'
      file = file.trim()
      fs.writeFileSync(file, text)
   }

   /**
    *
    * @param file
    * @param cmd
    */
   static writeX(file: string, cmd: string): void {
      let text = `#!/bin/sh\n\n`
      text += `# Created at: ${Formatters.formatDate(new Date())}\n`
      text += `# By: penguins_eggs v. ${PackageInfo.getPackageVersion()}\n`
      text += `# ==> Perri\'s Brewery edition <== \n\n`
      text += 'set -e\n'
      text += 'set -x\n'
      text += cmd
      Filesystem.write(file, text)
      shx.chmod('+x', file)
   }

   /**
    *
    * @param file
    * @param cmd
    */
   static writeXs(file: string, cmds: string[]): void {
      let cmd = ''
      for (const elem of cmds) {
         cmd += elem + '\n'
      }
      Filesystem.writeX(file, cmd)
   }

   // Se il metodo fa parte di una classe, usa `static`. Altrimenti, rimuovilo.
   static getOsRelease(): IOsRelease {
      const osReleasePath = path.join('/etc', 'os-release');
      // Inizializza l'oggetto con valori predefiniti
      const osInfo: IOsRelease = {
         ID: '',
         VERSION_ID: '',
         VERSION_CODENAME: 'n/a'
      };
      // Verifica se il file esiste
      if (!fs.existsSync(osReleasePath)) {
         console.error('/etc/os-release file does not exist.');
         return osInfo;
      }
      // Leggi il contenuto del file
      let fileContent: string;
      try {
         fileContent = fs.readFileSync(osReleasePath, 'utf8');
      } catch (error) {
         console.error('Error reading /etc/os-release:', error);
         return osInfo;
      }
      // Analizza ogni linea
      const lines = fileContent.split('\n');
      lines.forEach(line => {
         if (line.startsWith('#') || line.trim() === '') return;
         const [key, value] = line.split('=')
         if (key && value) {
            const trimmedKey = key.trim();
            const trimmedValue = value.trim().replace(/"/g, '');
            // Popola solo le chiavi desiderate
            if (trimmedKey === 'ID') {
               osInfo.ID = trimmedValue
            } else if (trimmedKey === 'VERSION_ID') {
               osInfo.VERSION_ID = trimmedValue
            } else if (trimmedKey === 'VERSION_CODENAME') {
               osInfo.VERSION_CODENAME = trimmedValue
            }
         }
      });
      // capitalize distroId
      osInfo.ID = osInfo.ID[0].toUpperCase() + osInfo.ID.slice(1).toLowerCase()
      osInfo.VERSION_CODENAME = osInfo.VERSION_CODENAME.toLowerCase()
      return osInfo
   }
}