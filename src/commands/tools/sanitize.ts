import { Command, flags } from '@oclif/command'
import Tools from '../../classes/tools'
import Utils from '../../classes/utils'

import N8 from '../../classes/n8'

import path = require('path')
import { execute, pipe } from '@getvim/execute'
import fs = require('fs')



export default class Sanitize extends Command {
    static description = 'sanitize'

    static flags = {
        help: flags.help({ char: 'h' }),
    }

    async run() {
        Utils.titles(this.id + ' ' + this.argv)

        const { args, flags } = this.parse(Sanitize)

        const Tu = new Tools
        Utils.warning(`>>> ${Sanitize.description}`)
        if (Utils.isRoot()) {
            await this.all()

            let calamaresGlobalModules = '/usr/lib/x86_64-linux-gnu/calamares/modules/'
            if (process.arch === 'ia32') {
                calamaresGlobalModules = '/usr/lib/calamares/modules/'
            }
            console.log('sanitize calamares modules: buster/beowulf')
            await rm(calamaresGlobalModules + 'bootloader-config')
            await rm(calamaresGlobalModules + 'create-tmp')
            await rm(calamaresGlobalModules + 'remove-link')
            await rm(calamaresGlobalModules + 'sources-yolk')
            await rm(calamaresGlobalModules + 'sources-yolk-unmount')

            console.log('sanitize calamares scripts: buster/beowulf')
            await rm('/usr/sbin/bootloader-config*')
            await rm('/usr/sbin/create-tmp*')
            await rm('/usr/sbin/remove-link*')
            await rm('/usr/sbin/sources-yolk*')
            await rm('/usr/sbin/sources-yolk-unmount*')


            console.log('sanitize calamares modules: bionic')
            await rm(calamaresGlobalModules + 'automirror')
            await rm(calamaresGlobalModules + 'add386arch')
            await rm(calamaresGlobalModules + 'after-bootloader')
            await rm(calamaresGlobalModules + 'before-bootloader')
            await rm(calamaresGlobalModules + 'bug')

            console.log('sanitize calamares scripts: bionic')
            await rm('/usr/sbin/add386arch*')
            await rm('/usr/sbin/after-bootloader*')
            await rm('/usr/sbin/before-bootloader*')
            await rm('/usr/sbin/bug.*')

        }
    }

    async all() {
        console.log('sanitize: script called from links')
        await rm('/usr/bin/add-penguins-links.sh')
        await rm('/usr/bin/penguins-links-add.sh')
        await rm('/usr/bin/pve-live.sh')
        await rm('/etc/systemd/system/pve-live.service')

        console.log('sanitize application links')
        await rm('/usr/share/applications/penguins-*')
        await rm('/usr/share/applications/dw*')
        await rm('/usr/share/applications/pve*')

        console.log('sanitize xdg links')
        await rm('/etc/xdg/autostart/add-penguins-desktop-icons.desktop')
        await rm('/etc/xdg/autostart/add-penguins-links.desktop')

        console.log('sanitize calamares modules: all')
        await rm('/etc/calamares')
    }

    async buster() {

    }
}

/**
 * 
 * @param file 
 */
async function rm(file = '') {
    if (file !== '') {
        if (file.endsWith('*')) {
            const dir = file.substring(0, file.lastIndexOf('/'))
            const filter = file.substring(file.lastIndexOf('/') + 1, file.length - 1)
            const result = fs.readdirSync(dir).filter(function (e) {
                return path.basename(e).substring(0, filter.length) === filter
            })
            // if (result.length > 0) console.log(result)
            for (let i = 0; i < result.length; i++) {
                await rm(dir + '/' + result[i])
            }
        } else if (fs.existsSync(file)) {
            if (N8.isDirectory(file)) {
                Utils.warning('- remove dir: ' + file)
                await execute(`rm ${file} -rf`)
            } else {
                Utils.warning('- removing: ' + file)
                fs.unlinkSync(file)
            }
        }
    }
}
