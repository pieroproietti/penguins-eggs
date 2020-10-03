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

/**
 * 
 */
export default class Yolk {

    

    /**
     * 
     * @param dir      * @param verbose 
     */
    async create(dir= '/usr/local/yolk', verbose = false) {
        const echo = Utils.setEcho(verbose)
        const packages = ['grub-pc', 'grub-pc-bin', 'cryptsetup', 'keyutils']
        let arch = 'amd64'
        if (process.arch === 'ia32') {
            arch = 'i386'
            // packages.push('grub-efi-ia32')
            // packages.push('grub-efi-ia32-bin')
        } else {
            packages.push('grub-efi-amd64')
            packages.push('grub-efi-amd64-bin')
        }

        /**
         * riga apt
         * 
         * deb [trusted=yes] file:/usr/local/yolk ./
         * 
         */

        if (!fs.existsSync(`${dir}`)) {
            shx.exec(`mkdir ${dir} -p`)
        } else {
            shx.exec(`rm ${dir}/*`)
        }

        process.chdir(dir)
        for (let i = 0; i < packages.length; i++) {
            const cmd = `apt-get download ${packages[i]}`
            console.log(cmd)
            await execute(cmd, echo)
        }

        process.chdir(dir)
        const cmd = 'dpkg-scanpackages -m . | gzip -c > Packages.gz'
        console.log(cmd)
        await execute(cmd)

        const release = `Archive: stable\nComponent: yolk\nOrigin: penguins-eggs\nArchitecture: ${arch}\n`
        fs.writeFileSync('Release', release)
    }
}