import chalk from 'chalk'
import Utils from './utils'
import { IMaterial } from '../interfaces'
import { exec } from '../lib/utils'
import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'
import { ReadableByteStreamController } from 'stream/web'

/**
 * 
 */
export default class Tailor {
    private verbose = false
    private echo = {}
    private costume = ''
    private gardrobe = ''
    materials = {} as IMaterial

    constructor(gardrobe: string, costume: string, verbose = false) {
        this.costume = costume
        this.gardrobe = gardrobe
    }


    /**
     * 
     */
    async prepare(verbose = false) {
        this.verbose = verbose
        this.echo = Utils.setEcho(verbose)
        Utils.warning(`preparing ${this.costume}`)

        const tailorList = `${this.gardrobe}/${this.costume}/index.yml`

        if (fs.existsSync(tailorList)) {
            this.materials = yaml.load(fs.readFileSync(tailorList, 'utf-8')) as IMaterial
        } else {
            console.log('costume ' + chalk.cyan(this.costume) + ' not found in gardrobe: ' + chalk.green(this.gardrobe))
        }


        /**
         * Repositories
         */
        Utils.warning(`analyzing repositories`)

        /**
        * sources.list
        */
        let step = '/etc/apt/sources.list'
        Utils.warning(step)
        let components = ''

        if (this.materials.sequence.repositories.sourcesList.main) {
            components += ' main'
        }

        if (this.materials.sequence.repositories.sourcesList.contrib) {
            components += ' contrib'
        }

        if (this.materials.sequence.repositories.sourcesList.nonFree) {
            components += ' non-free'
        }
        console.log(`using: ${components}`)

        /**
         * sources.list.d
         */
        if (this.materials.sequence.repositories.sourcesListD[0] !== null) {
            step = `adding repositories to /etc/apt/sources.list.d`
            Utils.warning(step)
            this.materials.sequence.repositories.sourcesListD.forEach(async cmd => {
                await exec(cmd, this.echo)
            })
        }

        /**
         * apt-get update
         */
        step = `updating repositories`
        Utils.warning(step)
        if (this.materials.sequence.repositories.update) {
            if (!this.verbose) {
                console.log('wait for: ' + step)
            }
            await exec('apt-get update', this.echo)
        }

        /**
         * apt-get full-upgrade
         */
        step = `apt-get full-upgrade`
        Utils.warning(step)
        if (this.materials.sequence.repositories.fullUpgrade) {
            if (!this.verbose) {
                console.log('wait for: ' + step)
            }
            await exec('apt-get full-upgrade -y', this.echo)
        }

        /**
         * apt-get install packages
         */
        if (this.materials.sequence.packages[0] !== null) {
            step = `installing packages`
            Utils.warning(step)
            let cmd = 'apt-get install -y '
            this.materials.sequence.packages.forEach(elem => {
                cmd += ` ${elem}`
            })
            if (await Utils.customConfirm(cmd)) {
                if (!this.verbose) {
                    console.log('wait for: ' + step)
                }
                await exec(cmd, this.echo)
            }
        }

        /**
        * apt-get install accessories
        */
        if (this.materials.sequence.accessories[0] !== null) {
            step = `installing packages accessories`
            Utils.warning(step)
            let cmd = 'apt-get install -y '
            this.materials.sequence.accessories.forEach(elem => {
                cmd += ` ${elem}`
            })
            if (await Utils.customConfirm(cmd)) {
                if (!this.verbose) {
                    console.log('wait for: ' + step)
                }
                await exec(cmd, this.echo)
            }
        }

        /**
         * dpkg -i *.deb
         */
        if (this.materials.sequence.debs) {
            step = `installing local packages`
            Utils.warning(step)
            if (!this.verbose) {
                console.log('wait for: ' + step)
            }
            await exec(`dpkg -i ${this.gardrobe}\*.deb`)
        }

        /**
         * hostname and hosts
         */
        if (this.materials.sequence.hostname) {
            Utils.warning(`changing hostname=${this.materials.name}`)
            await this.hostname()
        }

        /**
         * reboot
         */
        if (this.materials.sequence.reboot) {
            Utils.warning(`Reboot`)
            await Utils.pressKeyToExit('system need to reboot', true)
            await exec('reboot')
        }
    }


    /**
    * hostname and hosts
    */
    private async hostname() {

        /**
         * hostname
         */
        let file = '/etc/hostname'
        let text = this.materials.name
        await exec(`rm ${file} `, this.echo)
        fs.writeFileSync(file, text)

        /**
         * hosts
         */
        file = '/etc/hosts'
        text = ''
        text += '127.0.0.1 localhost localhost.localdomain\n'
        text += `127.0.1.1 ${this.materials.name} \n`
        text += `# The following lines are desirable for IPv6 capable hosts\n`
        text += `:: 1     ip6 - localhost ip6 - loopback\n`
        text += `fe00:: 0 ip6 - localnet\n`
        text += `ff00:: 0 ip6 - mcastprefix\n`
        text += `ff02:: 1 ip6 - allnodes\n`
        text += `ff02:: 2 ip6 - allrouters\n`
        text += `ff02:: 3 ip6 - allhosts\n`
        await exec(`rm ${file} `, this.echo)
        fs.writeFileSync(file, text)
    }
}
