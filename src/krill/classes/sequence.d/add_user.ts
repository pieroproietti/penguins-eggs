/**
 * ./src/krill/modules/add-user.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 * * YOCTO-WAY UPDATE:
 * Direct manipulation of /etc/passwd, shadow, group to avoid chroot binary dependencies.
 * Ensures compatibility with Fedora 43+, Arch, and others regardless of host libs.
 */

import Utils from '../../../classes/utils.js'
import fs from 'fs'
import path from 'node:path'
import yaml from 'js-yaml'
import * as bcrypt from 'bcryptjs' // Assicurati di avere questo import
import { exec } from '../../../lib/utils.js'
import Sequence from '../sequence.js'

/**
 * Genera hash password Linux-compatible ($2a$ bcrypt)
 */
function getLinuxHash(password: string): string {
    const salt = bcrypt.genSaltSync(10)
    return bcrypt.hashSync(password, salt)
}

/**
 * Helper: Aggiunge una riga a un file se la chiave non esiste
 */
function appendIfMissing(filePath: string, searchStr: string, lineToAdd: string) {
    if (fs.existsSync(filePath)) {
        try {
            const content = fs.readFileSync(filePath, 'utf8')
            if (!content.includes(searchStr)) {
                const prefix = content.endsWith('\n') ? '' : '\n'
                fs.appendFileSync(filePath, `${prefix}${lineToAdd}\n`)
            }
        } catch (e) {
            console.error(`Error writing to ${filePath}`, e)
        }
    }
}

/**
 * Helper: Aggiunge utente a un gruppo nel file /etc/group del target
 */
function addUserToGroupFile(targetRoot: string, groupName: string, userName: string) {
    const groupFile = path.join(targetRoot, 'etc', 'group')
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
            console.error(`Error adding user to group ${groupName}:`, e)
        }
    }
}

/**
 *
 * @param this
 * @param username
 * @param password
 * @param fullusername
 * @param roomNumber
 * @param workPhone
 * @param homePhone
 */ 
export default async function addUser(this: Sequence, username = 'live', password = 'evolution', fullusername = '', roomNumber = '', workPhone = '', homePhone = ''): Promise<void> {
  
  // Setup Paths
  const target = this.installTarget
  const passwdFile = path.join(target, 'etc', 'passwd')
  const shadowFile = path.join(target, 'etc', 'shadow')
  const groupFile = path.join(target, 'etc', 'group')
  
  // Standard User Config
  const UID = '1000'
  const GID = '1000'
  const SHELL = '/bin/bash'
  const HOME = `/home/${username}`
  const GECOS = `${fullusername},${roomNumber},${workPhone},${homePhone}`

  // 1. CLEANUP (Just in case)
  // Rimuoviamo la home se esiste già nel target (residuo di installazione fallita?)
  await exec(`rm -rf ${target}${HOME}`, this.echo)

  // 2. INIEZIONE UTENTE (/etc/passwd)
  console.log(`Injecting user ${username} into ${passwdFile}...`)
  const passwdLine = `${username}:x:${UID}:${GID}:${GECOS}:${HOME}:${SHELL}`
  appendIfMissing(passwdFile, `${username}:`, passwdLine)

  // 3. INIEZIONE GRUPPO PRIMARIO (/etc/group)
  const groupLine = `${username}:x:${GID}:`
  appendIfMissing(groupFile, `${username}:`, groupLine)

  // 4. INIEZIONE PASSWORD (/etc/shadow)
  const hash = getLinuxHash(password)
  // 19700 = days since epoch, 99999 = max days
  const shadowLine = `${username}:${hash}:19700:0:99999:7:::`
  appendIfMissing(shadowFile, `${username}:`, shadowLine)

  // 5. CREAZIONE HOME DIRECTORY
  // Copia da /etc/skel del TARGET verso la home del TARGET
  // Usiamo 'cp -rT' per copiare i file nascosti (.bashrc etc) preservando la struttura
  const skelPath = path.join(target, 'etc', 'skel')
  if (fs.existsSync(skelPath)) {
      await exec(`mkdir -p ${target}${HOME}`, this.echo)
      await exec(`cp -rT ${skelPath} ${target}${HOME}`, this.echo)
  }

  // 6. PERMESSI E PROPRIETARIO
  // Nota: usiamo chown numeric 1000:1000 perché l'utente sul sistema host
  // che esegue krill potrebbe non conoscere l'username "live" o "mario"
  await exec(`chown -R ${UID}:${GID} ${target}${HOME}`, this.echo)
  
  // Permessi file critici
  await exec(`chmod 644 ${passwdFile}`, this.echo)
  await exec(`chmod 644 ${groupFile}`, this.echo)
  await exec(`chmod 600 ${shadowFile}`, this.echo)

  // 7. GESTIONE GRUPPI AMMINISTRATIVI (Sudo/Wheel)
  let adminGroup = 'wheel'
  if (this.distro.familyId === 'debian') {
    adminGroup = 'sudo'
  } else if (this.distro.familyId === 'openmamba') {
    adminGroup = 'sysadmin'
  } 

  addUserToGroupFile(target, adminGroup, username)

  // Autologin group (specifico per alcune distro/configurazioni)
  // Se il gruppo esiste nel file target, aggiungiamo l'utente.
  addUserToGroupFile(target, 'autologin', username)

  // 8. GRUPPI DA CALAMARES/EGGS CONFIG
  let usersConf = '/etc/calamares/modules/users.conf'
  if (!fs.existsSync(usersConf)) {
    usersConf = '/etc/penguins-eggs.d/krill/modules/users.conf'
  }

  if (fs.existsSync(usersConf)) {
    try {
        interface IUserCalamares {
            defaultGroups: string[]
        }
        const o = yaml.load(fs.readFileSync(usersConf, 'utf8')) as IUserCalamares
        if (o && o.defaultGroups) {
            for (const group of o.defaultGroups) {
                // La funzione controlla internamente se il gruppo esiste nel file.
                // Se esiste, aggiunge l'utente. Se no, non fa nulla (comportamento corretto).
                addUserToGroupFile(target, group, username)
            }
        }
    } catch (e) {
        console.error(`Error parsing ${usersConf}`, e)
    }
  }

  // 9. FIX SELINUX (Fondamentale per Fedora/RHEL installata)
  // Se stiamo installando una Fedora, dobbiamo assicurarci che i file modificati
  // abbiano il contesto corretto, altrimenti al primo boot non si entra.
  if (['fedora', 'rhel', 'centos', 'almalinux', 'rocky'].includes(this.distro.familyId)) {
      try {
          // Proviamo ad applicare i contesti usando chcon dell'host
          // (Se l'host è Debian e target Fedora, potrebbe fallire se FS non supporta xattr, ma ci proviamo)
          await exec(`chcon -t shadow_t ${shadowFile}`, this.echo)
          await exec(`chcon -t passwd_file_t ${passwdFile}`, this.echo)
          await exec(`chcon -t passwd_file_t ${groupFile}`, this.echo)
          await exec(`chcon -R -t user_home_t ${target}${HOME}`, this.echo)
          
          // BONUS: Creiamo /.autorelabel per sicurezza assoluta al primo boot
          // Questo rallenta il primo avvio ma garantisce che il sistema sia pulito.
          await exec(`touch ${target}/.autorelabel`, this.echo)
      } catch (e) {
          console.log('SELinux chcon skipped (host might not support it)')
      }
  }
}