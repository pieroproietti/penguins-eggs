/**
 * src/krill/classes/sequence.d/del_live_user.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * * REFACTORED: Uses "The SysUser Master" class.
 * Removes the live user from the installed target safely (SELinux friendly).
 */

import SysUsers from '../../../classes/sys-users.js'
import Utils from '../../../classes/utils.js'
import { exec } from '../../../lib/utils.js'
import Sequence from '../sequence.js'
import fs from 'fs'
import path from 'path'

/**
 * delLiveUser
 * Rimuove l'utente live dal sistema installato (target)
 */
export default async function delLiveUser(this: Sequence) {
  
  // Eseguiamo solo se siamo in modalità live (ovvero stiamo installando da una ISO)
  if (Utils.isLive()) {
    
    // Recuperiamo il nome utente live (default: 'live' o quello impostato in build)
    const liveUsername = this.settings.config.user_opt || 'live'
    const target = this.installTarget
    const familyId = this.distro.familyId

    console.log(`Removing live user '${liveUsername}' from target via SysUsers...`)

    // --- 1. CARICAMENTO CONFIGURAZIONE ---
    // Istanziamo il nostro "Master" puntando alla root del sistema installato
    const sysUsers = new SysUsers(target, familyId)
    sysUsers.load()

    // --- 2. RIMOZIONE LOGICA (IN MEMORIA) ---
    // Rimuove l'utente da passwd, shadow, group e dai membri dei gruppi extra
    sysUsers.removeUser(liveUsername)

    // --- 3. SALVATAGGIO ATOMICO ---
    // Scrive i file fisici e ripristina i contesti SELinux in un colpo solo
    await sysUsers.save()

    // --- 4. PULIZIA FILESYSTEM (File non gestiti da SysUsers) ---
    
    // a) Home Directory
    const homeDir = path.join(target, 'home', liveUsername)
    if (fs.existsSync(homeDir)) {
       await exec(`rm -rf ${homeDir}`, this.echo)
    }

    // b) File Sudoers (spesso creato in /etc/sudoers.d/)
    const sudoersFile = path.join(target, 'etc', 'sudoers.d', liveUsername)
    if (fs.existsSync(sudoersFile)) {
       fs.unlinkSync(sudoersFile)
       console.log(`Removed sudoers file: ${sudoersFile}`)
    }

    // c) Mail spool
    const mailFile = path.join(target, 'var', 'mail', liveUsername)
    if (fs.existsSync(mailFile)) {
        fs.unlinkSync(mailFile)
    }

    console.log(`Live user '${liveUsername}' removed successfully via SysUser Master.`)
  }
}