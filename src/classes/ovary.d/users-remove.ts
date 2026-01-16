/**
 * src/classes/ovary.d/users-remove.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * REFACTORED: Uses "The SysUser Master" class.
 * Cleans up host users from the ISO filesystem safely.
 */

import fs from 'fs'
import path from 'path'

import { exec } from '../../lib/utils.js'
import Ovary from '../ovary.js'
import SysUsers from '../sys-users.js'

export default async function usersRemove(this: Ovary): Promise<void> {
  // Il target corretto in Ovary è la directory "merged" dell'overlayfs
  const target = this.settings.work_dir.merged

  // Assicuriamoci che il target esista per sicurezza
  if (!target || !fs.existsSync(target)) {
    console.error(`SysUsers Error: Merged target directory not found at: ${target}`)
    return
  }

  // Nota: verifica se in Ovary hai 'this.familyId' diretto o 'this.distro.familyId'.
  // Solitamente è this.distro.familyId, ma se hai un getter va bene così.
  const familyId = (this as any).distro?.familyId || (this as any).familyId

  console.log(`Cleaning host users from ISO snapshot at ${target} (Family: ${familyId})...`)

  // 2. CARICAMENTO CONFIGURAZIONE
  const sysUsers = new SysUsers(target, familyId)
  sysUsers.load()

  // 3. IDENTIFICAZIONE UTENTI DA RIMUOVERE
  // Dobbiamo leggere il file passwd raw per decidere chi rimuovere
  // (rimuoviamo UID >= 1000 tranne 'nobody' e 'root')
  const usersToDelete: string[] = []

  const passwdPath = path.join(target, 'etc/passwd')
  if (fs.existsSync(passwdPath)) {
    const lines = fs.readFileSync(passwdPath, 'utf8').split('\n')
    for (const line of lines) {
      const parts = line.split(':')
      if (parts.length > 2) {
        const uid = Number.parseInt(parts[2])
        const username = parts[0]

        // Logica di rimozione standard di eggs
        if (uid >= 1000 && username !== 'nobody') {
          usersToDelete.push(username)
        }
      }
    }
  }

  // 4. ESECUZIONE RIMOZIONE (IN MEMORIA)
  for (const username of usersToDelete) {
    console.log(`- Removing user: ${username}`)
    sysUsers.removeUser(username)

    // Pulizia File Fisici (Home, Mail) - Operazioni FS dirette
    const homeDir = path.join(target, 'home', username)
    if (fs.existsSync(homeDir)) {
      await exec(`rm -rf ${homeDir}`, this.echo)
    }

    const mailFile = path.join(target, 'var/mail', username)
    if (fs.existsSync(mailFile)) {
      fs.unlinkSync(mailFile)
    }
  }

  // 5. SALVATAGGIO ATOMICO SU DISCO
  if (usersToDelete.length > 0) {
    // Scrive passwd, shadow, group, gshadow, subuid... e ripara SELinux
    await sysUsers.save()
    console.log('User cleanup completed via SysUsers Master.')
  } else {
    console.log('No users needed to be removed.')
  }
}
