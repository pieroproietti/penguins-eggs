/**
 * penguins-eggs-v7 based on Debian live
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import { Command, Flags } from '@oclif/core'
import Distro from '../../classes/distro'
import Utils from '../../classes/utils'
import { exec } from '../../lib/utils'
import fs from 'fs'
import Clean from './clean'

const fkey = `/etc/apt/trusted.gpg.d/penguins-eggs-key.gpg`
const flist = '/etc/apt/sources.list.d/penguins-eggs-ppa.list'

/**
 *
 */
export default class Ppa extends Command {
    static description = 'add/remove PPA repositories (Debian family)'

    static flags = {
        add: Flags.boolean({ char: 'a', description: 'add penguins-eggs PPA repository' }),
        help: Flags.help({ char: 'h' }),
        remove: Flags.boolean({ char: 'r', description: 'remove penguins-eggs PPA repository' }),
        verbose: Flags.boolean({ char: 'v', description: 'verbose' })
    }

    async run(): Promise<void> {
        const { flags } = await this.parse(Ppa)
        Utils.titles(this.id + ' ' + this.argv)

        let verbose = false
        if (flags.verbose) {
            verbose = true
        }

        const distro = new Distro()
        if (distro.familyId === 'debian') {
            if (Utils.isRoot()) {
                if (flags.remove) {
                    Utils.warning(`Are you sure to remove ${flist} to your repositories?`)
                    if (await Utils.customConfirm('Select yes to continue...')) {
                        await remove()
                    }
                }
                if (flags.add) {
                    Utils.warning(`Are you sure to add ${flist} to your repositories?`)
                    if (await Utils.customConfirm('Select yes to continue...')) {
                        await clean()
                        await add()
                    }
                }
            }
        } else {
            Utils.warning('you can use ppa only for debian family')
        }
    }
}


/**
 * add ppa
 */
async function add() {
    await exec(`curl -sS https://pieroproietti.github.io/penguins-eggs-ppa/KEY.gpg| gpg --dearmor | sudo tee ${fkey} > /dev/null`)
    const content = `deb [signed-by=${fkey}] https://pieroproietti.github.io/penguins-eggs-ppa ./\n`
    fs.writeFileSync(flist, content)
    await exec(`apt-get update`)
}

/**
 * remove ppa
 */
async function remove() {
    await clean()
    await exec(`apt-get update`)
}

/**
 *
 */
async function clean() {
    await exec(`rm -f    /etc/apt/trusted.gpg.d/penguins-eggs*`)
    await exec(`rm -f /etc/apt/sources.list.d/penguins-eggs*`)
    await exec(`rm -f /usr/share/keyrings/penguins-eggs*`)
}
