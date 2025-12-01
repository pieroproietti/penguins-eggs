/**
 * ./src/classes/ovary.d/create-user-live.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import fs from 'fs'
import path from 'node:path'
import yaml from 'js-yaml'
import { execSync } from 'node:child_process'
import * as bcrypt from 'bcryptjs'

import Ovary from '../ovary.js'
import { exec } from '../../lib/utils.js'
import rexec from './rexec.js'
import Utils from '../utils.js'

const __dirname = path.dirname(new URL(import.meta.url).pathname)

/**
 * Genera un hash Bcrypt ($2a$) compatibile con Linux PAM.
 * Sostituisce SHA-512 ($6$) ma è ugualmente accettato e sicuro.
 */
function getLinuxHash(password: string): string {
    // Genera un salt con costo 10
    const salt = bcrypt.genSaltSync(10)
    // Ritorna stringa tipo: $2a$10$N9qo8u...
    return bcrypt.hashSync(password, salt)
}

/**
 * Aggiunge un utente a un gruppo modificando direttamente il file /etc/group.
 * Bypassa i problemi di 'usermod' (exit code 6) su ambienti chroot/minimal.
 */
function addUserToGroupFile(mountPath: string, groupName: string, userName: string) {
    const groupFile = path.join(mountPath, 'etc', 'group')
    
    if (fs.existsSync(groupFile)) {
        try {
            let content = fs.readFileSync(groupFile, 'utf8')
            let lines = content.split('\n')
            let modified = false

            lines = lines.map(line => {
                // Cerca la riga che inizia con "groupName:"
                if (line.startsWith(`${groupName}:`)) {
                    const parts = line.split(':')
                    // parts[3] contiene la lista utenti (es: "user1,user2")
                    const currentUsers = parts[3] ? parts[3].split(',') : []
                    
                    if (!currentUsers.includes(userName)) {
                        currentUsers.push(userName)
                        parts[3] = currentUsers.join(',') // Ricostruisce la lista
                        modified = true
                        return parts.join(':') // Ricostruisce la riga
                    }
                }
                return line
            })

            if (modified) {
                fs.writeFileSync(groupFile, lines.join('\n'))
                // Non logghiamo nulla per tenere la console pulita, o usa console.log se vuoi debug
            }
        } catch (e) {
            console.error(`Errore scrivendo su ${groupFile}:`, e)
        }
    }
}

export async function userCreateLive(this: Ovary) {
    if (this.verbose) {
        console.log('Ovary: userCreateLive')
    }

    const merged = this.settings.work_dir.merged
    const user = this.settings.config.user_opt
    const userPwd = this.settings.config.user_opt_passwd
    const rootPwd = this.settings.config.root_passwd

    const cmds: string[] = []

    // 1. PULIZIA (Diretta, senza chroot)
    if (fs.existsSync(`${merged}/home/${user}`)) {
         cmds.push(await rexec(`rm -rf ${merged}/home/${user}`, this.verbose))
    }

    // 2. CREAZIONE UTENTE 
    // Usiamo useradd dell'HOST con --root. 
    // È sicuro, usa le librerie del tuo sistema per scrivere i file nella ISO.
    // Ignoriamo errore se utente esiste (|| true)
    cmds.push(await rexec(`useradd --root ${merged} ${user} -m --shell /bin/bash || true`, this.verbose))

    // 3. CALCOLO HASH IN NODEJS (BCRYPT)
    const userHash = getLinuxHash(userPwd)
    const rootHash = getLinuxHash(rootPwd)

    // 4. INIEZIONE NELLO SHADOW
    // Usiamo sed per scrivere l'hash calcolato.
    // Usiamo '|' come delimitatore perché l'hash bcrypt contiene '/' e '$'
    if (userHash) {
        cmds.push(await rexec(`sed -i 's|^${user}:[^:]*:|${user}:${userHash}:|' ${merged}/etc/shadow`, this.verbose))
    }
    if (rootHash) {
        cmds.push(await rexec(`sed -i 's|^root:[^:]*:|root:${rootHash}:|' ${merged}/etc/shadow`, this.verbose))
    }

    // 5. FIX PERMESSI HOME
    try {
        // Nota: grep deve girare sulla guest per leggere i valori corretti
        const uid = execSync(`grep "^${user}:" ${merged}/etc/passwd | cut -d: -f3`).toString().trim()
        const gid = execSync(`grep "^${user}:" ${merged}/etc/passwd | cut -d: -f4`).toString().trim()
        
        if (uid && gid) {
             cmds.push(await rexec(`chown -R ${uid}:${gid} ${merged}/home/${user}`, this.verbose))
        }
    } catch (e) {
        console.log("Warning: impossibile settare permessi home (utente forse non creato?)")
    }

    /**
     * GESTIONE GRUPPI (Manuale via Node.js per massima affidabilità)
     * Invece di chiamare binari usermod/gpasswd che falliscono, modifichiamo il file testo.
     */
    
    // Gruppi specifici per famiglia
    const groupsToAdd: string[] = []

    switch (this.familyId) {
        case 'alpine': 
            groupsToAdd.push('wheel')
            break
        case 'archlinux': 
            groupsToAdd.push('wheel', 'autologin')
            break
        case 'debian': 
            groupsToAdd.push('sudo')
            break
        case 'fedora': 
            groupsToAdd.push('wheel')
            break
        case 'openmamba': 
            groupsToAdd.push('sysadmin', 'autologin')
            break
        case 'opensuse': 
            groupsToAdd.push('wheel')
            break
    }

    // Aggiungi i gruppi definiti sopra
    for (const g of groupsToAdd) {
        addUserToGroupFile(merged, g, user)
        if (this.verbose) console.log(`Added ${user} to group ${g} (manual)`)
    }

    /**
     * GESTIONE GRUPPI DA CALAMARES/CONFIG
     */
    let usersConf = '/etc/calamares/modules/users.conf'
    if (!fs.existsSync(usersConf)) {
        usersConf = '/etc/penguins-eggs.d/krill/modules/users.conf'
    }

    if (fs.existsSync(usersConf)) {
        interface IUserCalamares {
            defaultGroups: string[]
        }
        const o = yaml.load(fs.readFileSync(usersConf, 'utf8')) as IUserCalamares
        
        for (const group of o.defaultGroups) {
            // Aggiungiamo direttamente via file. Se il gruppo non esiste nel file, la funzione lo ignora.
            addUserToGroupFile(merged, group, user)
        }
        if (this.verbose) console.log(`Processed Calamares default groups for ${user}`)

    }

}