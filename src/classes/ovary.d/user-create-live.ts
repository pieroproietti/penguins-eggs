/**
 * ./src/classes/ovary.d/create-user-live.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 * * STRATEGY: "The Yocto Way"
 * Instead of relying on binaries like 'useradd' or 'usermod' which may fail 
 * inside chroots or across different libc versions/distros, we directly 
 * manipulate /etc/passwd, /etc/shadow, and /etc/group as text files.
 * This ensures 100% compatibility across Debian, Arch, Fedora, and future distros.
 */

import fs from 'fs'
import path from 'node:path'
import yaml from 'js-yaml'
import * as bcrypt from 'bcryptjs'

import Ovary from '../ovary.js'
import rexec from './rexec.js'


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

/**
 * Genera hash password Linux-compatible
 */
function getLinuxHash(password: string): string {
    const salt = bcrypt.genSaltSync(10)
    return bcrypt.hashSync(password, salt)
}

/**
 * Helper: Aggiunge una riga a un file se la chiave di ricerca non esiste
 */
function appendIfMissing(filePath: string, searchStr: string, lineToAdd: string) {
    if (fs.existsSync(filePath)) {
        try {
            const content = fs.readFileSync(filePath, 'utf8')
            if (!content.includes(searchStr)) {
                const prefix = content.endsWith('\n') ? '' : '\n'
                fs.appendFileSync(filePath, `${prefix}${lineToAdd}\n`)
                return true
            }
        } catch (e) {
            console.error(`Error reading/writing ${filePath}:`, e)
        }
    }
    return false
}

/**
 * Helper: Aggiunge utente a un gruppo nel file /etc/group
 */
function addUserToGroupFile(mountPath: string, groupName: string, userName: string) {
    const groupFile = path.join(mountPath, 'etc', 'group')
    if (fs.existsSync(groupFile)) {
        try {
            let lines = fs.readFileSync(groupFile, 'utf8').split('\n')
            let modified = false
            lines = lines.map(line => {
                if (line.startsWith(`${groupName}:`)) {
                    const parts = line.split(':')
                    // parts[3] è la lista utenti
                    const currentUsers = parts[3] && parts[3].trim() !== '' ? parts[3].split(',') : []
                    if (!currentUsers.includes(userName)) {
                        currentUsers.push(userName)
                        parts[3] = currentUsers.join(',')
                        modified = true
                        return parts.join(':')
                    }
                }
                return line
            })
            if (modified) fs.writeFileSync(groupFile, lines.join('\n'))
        } catch (e) {
            console.error(`Error modifying group ${groupName}:`, e)
        }
    }
}

export async function userCreateLive(this: Ovary) {
    if (this.verbose) console.log('Ovary: userCreateLive (Manual/Yocto Method)')

    const merged = this.settings.work_dir.merged
    const user = this.settings.config.user_opt
    const userPwd = this.settings.config.user_opt_passwd
    const rootPwd = this.settings.config.root_passwd

    // Configurazioni Standard
    const UID = '1000'
    const GID = '1000'
    const SHELL = '/bin/bash'
    const HOME = `/home/${user}` // Path relativo alla root della ISO
    const COMMENT = 'Live User'

    const cmds: string[] = []

    // 1. PULIZIA PRELIMINARE
    if (fs.existsSync(`${merged}${HOME}`)) {
        cmds.push(await rexec(`rm -rf ${merged}${HOME}`, this.verbose))
    }

    // 2. INIEZIONE UTENTE (/etc/passwd)
    // Formato: user:x:UID:GID:Comment:Home:Shell
    const passwdLine = `${user}:x:${UID}:${GID}:${COMMENT}:${HOME}:${SHELL}`
    appendIfMissing(`${merged}/etc/passwd`, `${user}:`, passwdLine)

    // 3. INIEZIONE GRUPPO PRIMARIO (/etc/group)
    // Formato: group:x:GID:
    const groupLine = `${user}:x:${GID}:`
    appendIfMissing(`${merged}/etc/group`, `${user}:`, groupLine)

    // 4. INIEZIONE SHADOW (/etc/shadow)
    // Formato: user:hash:lastchg:min:max:warn:inactive:expire
    const userHash = getLinuxHash(userPwd)
    const shadowLine = `${user}:${userHash}:19700:0:99999:7:::`
    appendIfMissing(`${merged}/etc/shadow`, `${user}:`, shadowLine)

    // 5. PASSWORD ROOT
    const rootHash = getLinuxHash(rootPwd)
    if (rootHash) {
        cmds.push(await rexec(`sed -i 's|^root:[^:]*:|root:${rootHash}:|' ${merged}/etc/shadow`, this.verbose))
    }

    // 6. CREAZIONE HOME DIRECTORY (Copia da /etc/skel)
    if (!fs.existsSync(`${merged}${HOME}`)) {
        fs.mkdirSync(`${merged}${HOME}`, { recursive: true })
    }

    // Copiamo lo scheletro utente (bashrc, profile, ecc)
    // cp -rT copia il *contenuto* di skel dentro home, inclusi file nascosti
    cmds.push(await rexec(`cp -rT ${merged}/etc/skel ${merged}${HOME}`, this.verbose))

    // 7. PERMESSI E PROPRIETARIO (Cruciale)
    cmds.push(await rexec(`chown -R ${UID}:${GID} ${merged}${HOME}`, this.verbose))

    // Assicuriamo i permessi corretti sui file di sistema modificati
    cmds.push(await rexec(`chmod 644 ${merged}/etc/passwd`, this.verbose))
    cmds.push(await rexec(`chmod 644 ${merged}/etc/group`, this.verbose))
    cmds.push(await rexec(`chmod 600 ${merged}/etc/shadow`, this.verbose)) // Solo root legge shadow

    // 8. FIX SELINUX (Per Fedora/RHEL/CentOS)
    // Ripristiniamo i contesti di sicurezza corrotti dalle modifiche manuali
    if (['fedora', 'rhel', 'centos', 'almalinux'].includes(this.familyId)) {
        try {
            cmds.push(await rexec(`chcon -t shadow_t ${merged}/etc/shadow`, this.verbose))
            cmds.push(await rexec(`chcon -t passwd_file_t ${merged}/etc/passwd`, this.verbose))
            cmds.push(await rexec(`chcon -t passwd_file_t ${merged}/etc/group`, this.verbose))
            // Importante: la home deve essere accessibile
            cmds.push(await rexec(`chcon -R -t user_home_t ${merged}${HOME}`, this.verbose))
        } catch (e) {
            console.log('Warning: SELinux chcon skipped (host might not support it or not needed)')
        }
    }

    // 9. AGGIUNTA AI GRUPPI SECONDARI
    const groupsToAdd: string[] = []
    switch (this.familyId) {
        case 'alpine': groupsToAdd.push('wheel', 'audio', 'video'); break
        case 'archlinux': groupsToAdd.push('wheel', 'autologin'); break
        case 'debian': groupsToAdd.push('sudo'); break
        case 'fedora': groupsToAdd.push('wheel'); break // Fedora usa 'wheel' per sudoers
        case 'openmamba': groupsToAdd.push('sysadmin', 'autologin'); break
        case 'opensuse': groupsToAdd.push('wheel'); break
    }

    for (const g of groupsToAdd) {
        addUserToGroupFile(merged, g, user)
    }

    // 10. GRUPPI DA CONFIG (Calamares/Eggs)
    let usersConf = '/etc/calamares/modules/users.conf'
    if (!fs.existsSync(usersConf)) usersConf = '/etc/penguins-eggs.d/krill/modules/users.conf'

    if (fs.existsSync(usersConf)) {
        try {
            const o = yaml.load(fs.readFileSync(usersConf, 'utf8')) as IUserCalamares
            if (o && o.defaultGroups) {
                for (const group of o.defaultGroups) addUserToGroupFile(merged, group, user)
            }
        } catch (e) {
            console.error(`Error parsing users.conf:`, e)
        }
    }
}