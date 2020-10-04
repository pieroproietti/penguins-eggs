/**
 * penguins-eggs-v7 based on Debian live
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import { Command, flags } from '@oclif/command'
import shx = require('shelljs')
import fs = require('fs')

import Utils from './utils'
import Settings from './settings'
import { execute, pipe } from '@getvim/execute'
import Pacman from './pacman'

/**
 * 
 */
export default class Yolk {

    dir = '/usr/local/yolk'

    /**
     * 
     * @param dir      * @param verbose 
     */
    async create(verbose = false) {

        /**
         * riga apt
         * 
         * deb [trusted=yes] file:/usr/local/yolk ./
         * 
         */

        // Controllo se esiste il file Release
        if (await this.exists()){
            console.log('yolk esiste!')
        }

        // Creo o svuoto yolk
        if (!fs.existsSync(`${this.dir}`)) {
            shx.exec(`mkdir ${this.dir} -p`)
        } else {
            shx.exec(`rm ${this.dir}/*`)
        }

        /**
         * I pacchetti che servono per l'installazione sono solo questi
         */
        const packages = ['grub-pc', 'cryptsetup', 'keyutils']
        let arch = 'amd64'
        if (process.arch === 'ia32') {
            arch = 'i386'
        } else {
            packages.push('grub-efi-amd64')
        }

        // I Downloads avverranno nell directory corrente
        process.chdir(this.dir)

        // Per tutti i pacchetti cerca le dipendenze, controlla se non siano installate e le scarico.
        for (let i = 0; i < packages.length; i++) {
            let cmd = ''
            console.log(`downloading package ${packages[i]} and it's dependencies...`)
            cmd = `apt-cache depends --recurse --no-recommends --no-suggests --no-conflicts --no-breaks --no-replaces --no-enhances ${packages[i]} | grep "^\\w" | sort -u`
            let depends = await execute(cmd)
            const aDepends =depends.split('\n')
            iDeps(aDepends)
        }

        // Creo Package.gz
        const cmd = 'dpkg-scanpackages -m . | gzip -c > Packages.gz'
        console.log(cmd)
        await execute(cmd)

        // Creo Release
        const date = await execute('date -R -u')
        const content = `Archive: stable\nComponent: yolk\nOrigin: penguins-eggs\nArchitecture: ${arch}\nDate: ${date}\n`
        console.log('Creating Release')
        fs.writeFileSync('Release', content)
    }


    /**
     * Controllo l'esistenza
     */
    exists() : boolean {
        const release = `${this.dir}/Packages.gz`
        return fs.existsSync(release)
    }

}

/**
 * 
 * @param depends 
 */
function iDeps(depends: string []) {
    const install: string[] = []
    for (let i = 0; i < depends.length; i++) {
        if (!Pacman.packageIsInstalled(depends[i])){
            install.push(depends[i])
            // depends.pop()
        }
    }

    for (let i = 0; i < install.length; i++) {
        const cmd =`apt-get download ${install[i]}`
        Utils.warning(`- ${cmd}`)
        execute(cmd)
    }

}
