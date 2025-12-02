/**
 * src/classes/ovary.d/user-create-live.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * * REFACTORED: Uses "The SysUser Master" class.
 * Creates the live user directly in the merged filesystem safely.
 */

import fs from 'fs'
import path from 'path'
import { exec } from '../../lib/utils.js'
import Ovary from '../ovary.js'
import SysUsers, { IPasswdEntry } from '../sys-users.js'

export default async function userCreateLive(this: Ovary): Promise<void> {
    
    // Target: la directory "merged" dell'overlayfs
    let target = this.settings.work_dir.merged
    if (!target || !fs.existsSync(target)) {
        console.error(`SysUsers Error: Target directory not found at: ${target}`)
        return
    }

    const familyId = (this as any).distro?.familyId || (this as any).familyId 
    console.log(`Creating LIVE user in snapshot at ${target} (Family: ${familyId})...`)

    // 1. CARICAMENTO CONFIGURAZIONE ESISTENTE
    const sysUsers = new SysUsers(target, familyId)
    sysUsers.load()

    // 2. DEFINIZIONE UTENTE LIVE
    const username = this.settings.config.user_opt || 'live'
    const password = 'evolution' // Password default live
    
    // Shell detection
    let shell = '/bin/bash'
    if (!fs.existsSync(path.join(target, 'bin/bash')) && fs.existsSync(path.join(target, 'bin/ash'))) {
        shell = '/bin/ash'
    }

    const liveUser: IPasswdEntry = {
        username: username,
        password: 'x',
        uid: '1000', // Live user è sempre 1000
        gid: '1000',
        gecos: 'Live User,,,',
        home: `/home/${username}`,
        shell: shell
    }

    // 3. CREAZIONE LOGICA (IN MEMORIA)
    // Rimuove eventuali residui precedenti e aggiunge il nuovo
    sysUsers.addUser(liveUser, password)

    // Aggiungi ai gruppi amministrativi
    let adminGroup = 'wheel'
    if (['debian', 'ubuntu', 'linuxmint', 'pop', 'neon'].includes(familyId)) {
        adminGroup = 'sudo'
    } else if (familyId === 'openmamba') {
        adminGroup = 'sysadmin'
    }
    sysUsers.addUserToGroup(username, adminGroup)

    // GRUPPO AUTOLOGIN (Fondamentale per la live!)
    // Creiamo il gruppo se non esiste (logica semplificata: lo aggiungiamo a sysUsers se manca?)
    // SysUsers.addUserToGroup fallisce silenziosamente se il gruppo non c'è. 
    // Per sicurezza su Fedora/Arch, autologin di solito esiste o va creato.
    // Proviamo ad aggiungerlo:
    sysUsers.addUserToGroup(username, 'autologin'); // <--- PUNTO E VIRGOLA FONDAMENTALE QUI!
    
    // Aggiungiamo anche ai gruppi standard audio/video/network se esistono
    ['video', 'audio', 'network', 'input', 'lp', 'storage', 'optical'].forEach(grp => {
        sysUsers.addUserToGroup(username, grp)
    })

    // 4. SALVATAGGIO ATOMICO SU DISCO
    await sysUsers.save()


    // 5. CREAZIONE FISICA HOME DIRECTORY
    const homeDir = path.join(target, 'home', username)
    
    // Cleanup
    if (fs.existsSync(homeDir)) await exec(`rm -rf ${homeDir}`, this.echo)
    
    // Scheletro (/etc/skel)
    const skelPath = path.join(target, 'etc', 'skel')
    if (fs.existsSync(skelPath)) {
        await exec(`mkdir -p ${homeDir}`, this.echo)
        await exec(`cp -rT ${skelPath} ${homeDir}`, this.echo)
    } else {
        await exec(`mkdir -p ${homeDir}`, this.echo)
    }

    // Permessi
    await exec(`chown -R 1000:1000 ${homeDir}`, this.echo)
    // Per la live va bene anche 755, ma 700 è più sicuro. Lasciamo standard.
    await exec(`chmod 755 ${homeDir}`, this.echo)

    // 6. FIX SELINUX SPECIFICO PER HOME LIVE
    if (['fedora', 'rhel', 'centos', 'almalinux', 'rocky'].includes(familyId)) {
        try {
            await exec(`chcon -R -t user_home_t ${homeDir}`, { echo: false }).catch(()=>{})
            // Nota: .autorelabel nella root della live potrebbe rallentare il boot, 
            // ma è meglio averlo se i contesti sono dubbi.
            // await exec(`touch ${target}/.autorelabel`, { echo: false }) 
        } catch (e) {
            console.error('SELinux home fix warning:', e)
        }
    }
    
    console.log(`Live user '${username}' created successfully via SysUser Master.`)
}