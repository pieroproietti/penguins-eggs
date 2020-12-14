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
            console.log('sanitize workdir...')
            await rm('~/penguins-eggs-/tmp')
            await rm('~/penguins-eggs-/dist')
            await rm('~/penguins-tools-/tmp')
            await rm('~/penguins-tools-/dist')

            console.log('sanitize links scripts')
            await rm('/usr/bin/add-penguins-links.sh')
            await rm('/usr/bin/penguins-links-add.sh')
            await rm('/usr/bin/pve-live.sh')

            console.log('sanitize links')
            await rm('/usr/share/applications/penguins-*')
            await rm('/usr/share/applications/dw*')
            await rm('/usr/share/applications/pve*')
            await rm('/usr/share/applications/proxmox*')
            await rm('/usr/share/applications/calamares*')
            await rm('/etc/xdg/autostart/add-penguins-desktop-icons.desktop')
            await rm('/etc/xdg/autostart/add-penguins-links.desktop')

            console.log('sanitize calamares modules')
            await rm('/etc/calamares')
            const calamaresGlobalModules = '/usr/lib/x86_64-linux-gnu/calamares/modules/'
            console.log('sanitize calamares global modules buster/beowulf')
            await rm(calamaresGlobalModules + 'bootloader-config')
            await rm(calamaresGlobalModules +'create-tmp')
            await rm(calamaresGlobalModules +'remove-link')
            await rm(calamaresGlobalModules +'sources-yolk')
            await rm(calamaresGlobalModules +'sources-yolk-unmount')
            
            console.log('sanitize: script calamares buster')
            await rm('/usr/sbin/bootloader-config*')
            await rm('/usr/sbin/create-tmp*')
            await rm('/usr/sbin/remove-link*')
            await rm('/usr/sbin/sources-yolk*')
            await rm('/usr/sbin/sources-yolk-unmount*')


            console.log('sanitize: script di ubuntu bionic')
            await rm('/usr/sbin/add386arch*')
            await rm('/usr/sbin/after-bootloader*')
            await rm('/usr/sbin/before-bootloader*')
            await rm('/usr/sbin/bug.*')

            console.log('sanitize modules calamares buster')
            await rm('/usr/lib/x86_64-linux-gnu/calamares/modules/bootloader-config')
            await rm('/usr/lib/x86_64-linux-gnu/calamares/modules/create-tmp')
            await rm('/usr/lib/x86_64-linux-gnu/calamares/modules/remove-link')
            await rm('/usr/lib/x86_64-linux-gnu/calamares/modules/sources-final')
            await rm('/usr/lib/x86_64-linux-gnu/calamares/modules/sources-trusted*')

            console.log('sanitize modules calamares bionic')
            await rm('/usr/lib/x86_64-linux-gnu/calamares/modules/automirror')
            await rm('/usr/lib/x86_64-linux-gnu/calamares/modules/add386arch')
            await rm('/usr/lib/x86_64-linux-gnu/calamares/modules/after-bootloader')
            await rm('/usr/lib/x86_64-linux-gnu/calamares/modules/before-bootloader')
            rm('/usr/lib/x86_64-linux-gnu/calamares/modules/bug')
        }
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
