/**
 * ./src/krill/classes/secquence.d/add-user.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * REFACTORED: Uses "The SysUser Master" class.
 * Replaces chroot/binary dependencies with pure Node.js manipulation.
 */

import fs from 'fs'
import yaml from 'js-yaml'
import path from 'path'

import SysUsers, { IPasswdEntry } from '../../../classes/sys-users.js'
import Utils from '../../../classes/utils.js'
import { exec } from '../../../lib/utils.js'
import Sequence from '../sequence.js'

interface IUserCalamares {
  defaultGroups: string[]
  // Altri campi opzionali ignorati per ora
}

export default async function addUser(this: Sequence, username = 'live', password = 'evolution', fullusername = '', roomNumber = '', workPhone = '', homePhone = ''): Promise<void> {
  const target = this.installTarget
  const { familyId } = this.distro

  // --- 1. INIZIALIZZAZIONE SYSUSERS ---
  const sysUsers = new SysUsers(target, familyId)
  sysUsers.load() // Carica passwd, shadow, group in memoria

  console.log(`Creating user ${username} via SysUsers (Safe Mode)...`)

  // --- 2. PREPARAZIONE DATI ---

  // Shell detection (Fallback per Alpine/Minimal)
  let shell = '/bin/bash'
  if (!fs.existsSync(path.join(target, 'bin/bash')) && fs.existsSync(path.join(target, 'bin/ash'))) {
    shell = '/bin/ash'
  }

  // Definizione oggetto utente
  const newUser: IPasswdEntry = {
    gecos: `${fullusername},${roomNumber},${workPhone},${homePhone}`,
    gid: '1000',
    home: `/home/${username}`,
    password: 'x',
    shell,
    uid: '1000', // Hardcoded per il primo utente (standard installer)
    username
  }

  // --- 3. MODIFICHE LOGICHE (IN MEMORIA) ---

  // Aggiunge l'utente (gestisce passwd, shadow, group primario, subuid)
  sysUsers.addUser(newUser, password)

  // Aggiungi ai gruppi amministrativi (logica distro)
  let adminGroup = 'wheel'
  if (['debian', 'linuxmint', 'neon', 'pop', 'ubuntu'].includes(familyId)) {
    adminGroup = 'sudo'
  } else if (familyId === 'openmamba') {
    adminGroup = 'sysadmin'
  }

  sysUsers.addUserToGroup(username, adminGroup)

  // Aggiungi ai gruppi definiti in Calamares/Eggs config
  let usersConf = '/etc/calamares/modules/users.conf'
  if (!fs.existsSync(usersConf)) {
    usersConf = '/etc/penguins-eggs.d/krill/modules/users.conf'
  }

  if (fs.existsSync(usersConf)) {
    try {
      const content = fs.readFileSync(usersConf, 'utf8')
      const o = yaml.load(content) as IUserCalamares
      if (o && o.defaultGroups) {
        for (const grp of o.defaultGroups) {
          sysUsers.addUserToGroup(username, grp)
        }
      }
    } catch (error) {
      console.error('Warning: Error parsing users.conf, skipping extra groups.', error)
    }
  }

  // Fix specifico Archlinux (Autologin)
  if (familyId === 'archlinux') {
    sysUsers.addUserToGroup(username, 'autologin')
  }

  // --- 4. SALVATAGGIO ATOMICO SU DISCO ---
  // Scrive tutti i file di config e applica chcon (SELinux) se necessario
  await sysUsers.save()

  // --- 5. CREAZIONE FISICA HOME DIRECTORY ---
  // Queste operazioni toccano il filesystem reale, quindi usiamo exec/fs
  const homeDir = path.join(target, newUser.home)

  // Cleanup preventivo
  await exec(`rm -rf ${homeDir}`, this.echo)

  // Creazione da /etc/skel
  const skelPath = path.join(target, 'etc', 'skel')
  if (fs.existsSync(skelPath)) {
    await exec(`mkdir -p ${homeDir}`, this.echo)
    await exec(`cp -rT ${skelPath} ${homeDir}`, this.echo)
  } else {
    await exec(`mkdir -p ${homeDir}`, this.echo)
  }

  // Permessi e Proprietario
  await exec(`chown -R ${newUser.uid}:${newUser.gid} ${homeDir}`, this.echo)

  // Privacy: 700 è meglio di 755 per la home utente
  await exec(`chmod 700 ${homeDir}`, this.echo)

  // --- 6. FIX SELINUX FINALE (HOME & RELABEL) ---
  // SysUsers ha sistemato /etc/*, ma la home directory è appena stata creata
  // e potrebbe avere contesti errati.
  if (['almalinux', 'centos', 'fedora', 'rhel', 'rocky'].includes(familyId)) {
    try {
      console.log('Applying SELinux contexts to home directory...')
      // Fix contesto home
      await exec(`chcon -R -t user_home_t ${homeDir}`, { echo: false }).catch(() => {})

      // Fix "Nuclear Option": forza relabel al boot se qualcosa fosse sfuggito
      await exec(`touch ${target}/.autorelabel`, { echo: false })
    } catch (error) {
      console.error('SELinux home fix warning:', error)
    }
  }

  console.log(`User ${username} successfully configured via SysUser Master.`)
}
