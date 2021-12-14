/**
 * penguins-eggs-v7 based on Debian live
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import {Command, flags} from '@oclif/command'
import shx from 'shelljs'
import fs from 'node:fs'

import Utils from './utils'
// import { execute, pipe } from '@getvim/execute'
import Pacman from './pacman'
import {execSync} from 'node:child_process'
import Bleach from './bleach'

const execute = require('../lib/utils').execute
import {exec} from '../lib/utils'

/**
 *
 */
export default class Yolk {
   dir = '/usr/local/yolk'

   /**
    *
    * @param verbose
    */
   async create(verbose = false) {
     /**
       * riga apt
       *
       * deb [trusted=yes] file:/usr/local/yolk ./
       *
       */
     Utils.warning('updating system...')
     if (!Pacman.commandIsInstalled('dpkg-scanpackages')) {
       process.exit(0)
     }

     const echo = Utils.setEcho(verbose)
     try {
       await exec('apt-get update --yes', echo)
     } catch {
       Utils.error('Yolk.create() apt-get update --yes ') // + e.error)
     }

     if (!this.exists()) {
       shx.exec(`mkdir ${this.dir} -p`)
     } else {
       this.clean()
     }

     /**
       * I pacchetti che servono per l'installazione sono solo questi
       */
     const packages = ['cryptsetup', 'keyutils']

     // grub-pc solo per architettura CISC
     if (Utils.machineArch() === 'amd64' || Utils.machineArch() === 'i386') {
       packages.push('grub-pc')
     }

     if (Utils.machineArch() !== 'i386') {
       // Aggiunto anche grub-efi-amd64 oltre a grub-efi-*-bin
       // per la rimasterizzazione efi anche in bios
       packages.push('grub-efi-' + Utils.machineArch())
       packages.push('grub-efi-' + Utils.machineArch() + '-bin')
     }

     // I Downloads avverranno nell directory corrente
     process.chdir(this.dir)

     // Per tutti i pacchetti cerca le dipendenze, controlla se non siano installate e le scarico.
     for (const package_ of packages) {
       let cmd = ''
       Utils.warning(`downloading package ${package_} and it's dependencies...`)
       cmd = `apt-cache depends --recurse --no-recommends --no-suggests --no-conflicts --no-breaks --no-replaces --no-enhances ${package_} | grep "^\\w" | sort -u`
       const depends = await execute(cmd)
       await this.installDeps(depends.split('\n'))
     }

     // Creo Package.gz
     // const cmd = 'dpkg-scanpackages -m . | gzip -c > Packages.gz'
     const cmd = 'dpkg-scanpackages -h  md5,sha1,sha256 . | gzip -c > Packages.gz'
     Utils.warning(cmd)
     await execute(cmd)

     // Creo Release
     const date = await execute('date -R -u')
     const content = 'Archive: stable\nComponent: yolk\nOrigin: penguins-eggs\nArchitecture: ' + Utils.machineArch() + '\nDate: ' + date + '\n'
     Utils.warning('Writing Release')
     fs.writeFileSync('Release', content)

     Utils.warning('Cleaning apt cache')
     const bleach = new Bleach()
     await bleach.clean(verbose)
   }

   /**
    * Svuota la repo yolk
    */
   clean() {
     execSync(`rm ${this.dir}/*`)
   }

   /**
    * Controllo l'esistenza
    */
   exists(): boolean {
     const check = `${this.dir}/Packages.gz`
     return fs.existsSync(check)
   }

   /**
    *
    * @param depends
    */
   async installDeps(depends: string[]) {
     // scarico solo le dipendenze non installate
     const toDownloads: string[] = []
     for (const depend of depends) {
       if (!Pacman.packageIsInstalled(depend)) {
         toDownloads.push(depend)
       }
     }

     // e li vado a scaricare in /usr/local/yolk
     for (const toDownload of toDownloads) {
       process.chdir(this.dir)
       const cmd = `apt-get download ${toDownload}`
       Utils.warning(`- ${cmd}`)
       await execute(cmd)
     }
   }
}
