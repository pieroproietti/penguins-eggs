/**
 * ./src/classes/ovary.d/create-user-live.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

// packages
import fs from 'fs'
import path from 'node:path'
import yaml from 'js-yaml'


// classes
import Ovary from '../ovary.js'

// functions
import { exec } from '../../lib/utils.js'
import rexec from './rexec.js'
import Utils from '../utils.js'

// _dirname
const __dirname = path.dirname(new URL(import.meta.url).pathname)

/**
   * list degli utenti: grep -E 1[0-9]{3}  /etc/passwd | sed s/:/\ / | awk '{print $1}'
   * create la home per user_opt
   * @param verbose
   */
export async function userCreateLive(this: Ovary) {
    if (this.verbose) {
        console.log('Ovary: userCreateLive')
    }

    const cmds: string[] = []
    cmds.push(await rexec('chroot ' + this.settings.work_dir.merged + ' rm /home/' + this.settings.config.user_opt + ' -rf', this.verbose))
    cmds.push(await rexec('chroot ' + this.settings.work_dir.merged + ' mkdir /home/' + this.settings.config.user_opt, this.verbose))

    // Create user using useradd
    cmds.push(await rexec('chroot ' + this.settings.work_dir.merged + ' useradd ' + this.settings.config.user_opt + ' --home-dir /home/' + this.settings.config.user_opt + ' --shell /bin/bash ', true))

    // live password 
    cmds.push(await rexec('echo ' + this.settings.config.user_opt + ':' + this.settings.config.user_opt_passwd + ' | chroot ' + this.settings.work_dir.merged + ' /usr/sbin/chpasswd', true))

    // root password
    cmds.push(await rexec(' echo root:' + this.settings.config.root_passwd + ' | chroot ' + this.settings.work_dir.merged + ' /usr/sbin/chpasswd', this.verbose))

    // Alpine naked don't have /etc/skel
    if (fs.existsSync('/etc/skel')) {
        cmds.push(await rexec('chroot  ' + this.settings.work_dir.merged + ' cp /etc/skel/. /home/' + this.settings.config.user_opt + ' -R', this.verbose))
    }

    // da problemi con il mount sshfs
    cmds.push(await rexec('chroot  ' + this.settings.work_dir.merged + ' chown ' + this.settings.config.user_opt + ':users' + ' /home/' + this.settings.config.user_opt + ' -R', this.verbose))


    /**
     * 
     */
    switch (this.familyId) {
        case 'alpine': {
            cmds.push(await rexec(`chroot ${this.settings.work_dir.merged} usermod -aG wheel ${this.settings.config.user_opt}`, this.verbose))

            break
        }

        case 'archlinux': {
            cmds.push(await rexec(`chroot ${this.settings.work_dir.merged} gpasswd -a ${this.settings.config.user_opt} wheel`, this.verbose))

            // check or create group: autologin
            cmds.push(await rexec(`chroot ${this.settings.work_dir.merged} getent group autologin || chroot ${this.settings.work_dir.merged} groupadd autologin`, this.verbose))
            cmds.push(await rexec(`chroot ${this.settings.work_dir.merged} gpasswd -a ${this.settings.config.user_opt} autologin`, this.verbose))

            break
        }

        case 'debian': {
            cmds.push(await rexec(`chroot ${this.settings.work_dir.merged} usermod -aG sudo ${this.settings.config.user_opt}`, this.verbose))

            break
        }

        case 'fedora': {
            cmds.push(await rexec(`chroot ${this.settings.work_dir.merged} usermod -aG wheel ${this.settings.config.user_opt}`, this.verbose))

            break
        }

        case 'openmamba': {
            cmds.push(await rexec(`chroot ${this.settings.work_dir.merged} usermod -aG sysadmin ${this.settings.config.user_opt}`, this.verbose))
            cmds.push(await rexec(`chroot ${this.settings.work_dir.merged} usermod -aG autologin ${this.settings.config.user_opt}`, this.verbose))

            break
        }

        case 'opensuse': {
            cmds.push(await rexec(`chroot ${this.settings.work_dir.merged} usermod -aG wheel ${this.settings.config.user_opt}`, this.verbose))

            break
        }
        // No default
    }

    /**
     * look to calamares/modules/users.conf for groups
     */
    let usersConf = '/etc/calamares/modules/users.conf'
    if (!fs.existsSync(usersConf)) {
        usersConf = '/etc/penguins-eggs.d/krill/modules/users.conf'
    }

    if (fs.existsSync(usersConf)) {
        interface IUserCalamares {
            defaultGroups: string[]
            doAutologin: boolean
            doReusePassword: boolean
            passwordRequirements: {
                maxLenght: number
                minLenght: number
            }
            setRootPassword: boolean
            sudoersGroup: string
            userShell: string
        }
        const o = yaml.load(fs.readFileSync(usersConf, 'utf8')) as IUserCalamares
        for (const group of o.defaultGroups) {
            const groupExists = await exec(`chroot ${this.settings.work_dir.merged} getent group ${group}`, {ignore: true})
            if (groupExists.code == 0) {
                cmds.push(await rexec(`chroot ${this.settings.work_dir.merged} usermod -aG ${group} ${this.settings.config.user_opt} ${this.toNull}`, this.verbose))
                Utils.warning(`added ${this.settings.config.user_opt} to group ${group}`)
            }
        }
    } else {
        console.log(`il file ${usersConf} non esiste!`)
        await Utils.pressKeyToExit()
    }

}
