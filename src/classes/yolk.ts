/**
 * penguins-eggs-v7 based on Debian live
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import {Command, flags} from '@oclif/command'
import shx from 'shelljs'
import fs from 'fs'

import Utils from './utils'
// import { execute, pipe } from '@getvim/execute'
import Pacman from './pacman'
import {execSync} from 'child_process'
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
      } catch (e) {
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
      for (let i = 0; i < packages.length; i++) {
        let cmd = ''
        Utils.warning(`downloading package ${packages[i]} and it's dependencies...`)
        cmd = `apt-cache depends --recurse --no-recommends --no-suggests --no-conflicts --no-breaks --no-replaces --no-enhances ${packages[i]} | grep "^\\w" | sort -u`
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
      for (let i = 0; i < depends.length; i++) {
        if (!Pacman.packageIsInstalled(depends[i])) {
          toDownloads.push(depends[i])
        }
      }

      // e li vado a scaricare in /usr/local/yolk
      for (let i = 0; i < toDownloads.length; i++) {
        process.chdir(this.dir)
        const cmd = `apt-get download ${toDownloads[i]}`
        Utils.warning(`- ${cmd}`)
        await execute(cmd)
      }
    }
}
