/**
 * ./src/classes/ovary.d/users-remove.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 * * YOCTO-WAY IMPLEMENTATION:
 * Directly parses and edits /etc/passwd, /etc/shadow, /etc/group
 * to remove users with UID 1000-60000 without relying on guest binaries.
 */

import fs from 'fs'
import path from 'node:path'

import Ovary from './../ovary.js'
import rexec from './rexec.js'

export async function usersRemove(this: Ovary) {
    if (this.verbose) {
        console.log('Ovary: usersRemove (Yocto-way)')
    }

    const merged = this.settings.work_dir.merged
    const passwdFile = path.join(merged, 'etc', 'passwd')
    const shadowFile = path.join(merged, 'etc', 'shadow')
    const groupFile = path.join(merged, 'etc', 'group')

    // Liste per tracciare chi stiamo rimuovendo
    const usersToRemove: string[] = []
    const homesToRemove: string[] = []

    // 1. ANALISI PASSWD: Trova utenti da rimuovere (UID 1000..60000)
    if (fs.existsSync(passwdFile)) {
        let content = fs.readFileSync(passwdFile, 'utf8')
        let lines = content.split('\n')
        let newLines: string[] = []

        for (const line of lines) {
            if (!line.trim()) continue // Salta righe vuote

            const parts = line.split(':')
            // parts[2] è UID
            const uid = parseInt(parts[2])

            // Logica di selezione: UID standard utenti umani
            if (!isNaN(uid) && uid >= 1000 && uid <= 60000) {
                usersToRemove.push(parts[0]) // Username
                homesToRemove.push(parts[5]) // Home directory path
                if (this.verbose) console.log(`- Marking user ${parts[0]} (UID ${uid}) for removal`)
            } else {
                newLines.push(line) // Mantieni utenti di sistema
            }
        }

        // Scrivi il nuovo passwd solo se abbiamo rimosso qualcuno
        if (usersToRemove.length > 0) {
            fs.writeFileSync(passwdFile, newLines.join('\n') + '\n')
        }
    }

    if (usersToRemove.length === 0) {
        if (this.verbose) console.log('No users found in range 1000-60000.')
        return
    }

    // 2. PULIZIA SHADOW
    if (fs.existsSync(shadowFile)) {
        let lines = fs.readFileSync(shadowFile, 'utf8').split('\n')
        let newLines = lines.filter(line => {
            if (!line.trim()) return false
            const parts = line.split(':')
            // Se l'username è nella lista di quelli da rimuovere, scarta la riga
            return !usersToRemove.includes(parts[0])
        })
        fs.writeFileSync(shadowFile, newLines.join('\n') + '\n')
    }

    // 3. PULIZIA GROUP
    // Qui dobbiamo fare due cose:
    // a) Rimuovere i gruppi primari degli utenti (solitamente stesso nome utente)
    // b) Rimuovere l'utente dalle liste di altri gruppi (es. wheel, sudo)
    if (fs.existsSync(groupFile)) {
        let lines = fs.readFileSync(groupFile, 'utf8').split('\n')
        let newLines: string[] = []

        for (const line of lines) {
            if (!line.trim()) continue

            const parts = line.split(':')
            const groupName = parts[0]
            
            // a) Se il gruppo ha lo stesso nome di un utente rimosso, VIA.
            if (usersToRemove.includes(groupName)) {
                continue
            }

            // b) Pulizia membri: parts[3] è la lista utenti (user1,user2,user3)
            if (parts[3]) {
                let members = parts[3].split(',')
                // Filtra via gli utenti che stiamo cancellando
                let newMembers = members.filter(m => !usersToRemove.includes(m))
                parts[3] = newMembers.join(',')
            }

            newLines.push(parts.join(':'))
        }
        fs.writeFileSync(groupFile, newLines.join('\n') + '\n')
    }

    // 4. RIMOZIONE FILESYSTEM (Home directories)
    // Usiamo rexec per essere sicuri dei permessi (rm -rf potrebbe richiedere root se non siamo root)
    for (const home of homesToRemove) {
        // Controllo di sicurezza: non cancellare root o percorsi strani
        if (home && home.startsWith('/') && home !== '/' && home !== '/root') {
             // path.join gestisce il merged path
             const fullPath = path.join(merged, home)
             // Controllo extra: deve esistere ed essere dentro merged
             if (fs.existsSync(fullPath)) {
                 await rexec(`rm -rf ${fullPath}`, this.verbose)
                 if (this.verbose) console.log(`- Removed home: ${home}`)
             }
        }
    }

    // 5. RIMOZIONE MAIL SPOOL (Opzionale ma pulito)
    for (const user of usersToRemove) {
        const mailPath = path.join(merged, 'var', 'mail', user)
        if (fs.existsSync(mailPath)) {
            await rexec(`rm -f ${mailPath}`, this.verbose)
        }
    }

    // 6. FIX SELINUX (Fondamentale per Fedora/RHEL)
    // Poiché abbiamo riscritto passwd/shadow/group, ripristiniamo i contesti
    if (['fedora', 'rhel', 'centos', 'almalinux'].includes(this.familyId)) {
        try {
            await rexec(`chcon -t shadow_t ${shadowFile}`, this.verbose)
            await rexec(`chcon -t passwd_file_t ${passwdFile}`, this.verbose)
            await rexec(`chcon -t passwd_file_t ${groupFile}`, this.verbose)
        } catch (e) {
            // Ignora se host non ha SELinux
        }
    }
}