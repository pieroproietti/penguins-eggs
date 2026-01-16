/**
 * ./src/krill/modules/remove-installer-link.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

import fs from 'node:fs'
import path from 'path'

import Sequence from '../sequence.js'

/**
 * removeHomecryptHack
 */
export default async function removeHomecryptHack(this: Sequence): Promise<void> {
  const targetRoot= this.installTarget
  
  // -------------------------------------------------------
  // 1. PULIZIA SYSVINIT (Critica per il boot)
  // -------------------------------------------------------
  const inittabPath = path.join(targetRoot, 'etc/inittab')
  
  if (fs.existsSync(inittabPath)) {
    let content = fs.readFileSync(inittabPath, 'utf8')
    // Cerca la riga modificata dal nostro hack
    const hackRegex = /^1:.*tty1-unlock-wrapper\.sh.*$/m
    // Ripristina la riga standard (adatta questa stringa se usi parametri diversi per agetty)
    const standardLine = '1:2345:respawn:/sbin/agetty --noclear tty1 linux'
    
    if (hackRegex.test(content)) {
      content = content.replace(hackRegex, standardLine)
      fs.writeFileSync(inittabPath, content)
      // console.log('- Restored standard inittab entry')
    }
  }

  // -------------------------------------------------------
  // 2. PULIZIA SYSTEMD (Cosmetica / Best Practice)
  // -------------------------------------------------------
  // Anche se non rompe il boot, rimuoviamo i file inutili
  const systemdFiles = [
    'etc/systemd/system/mount-encrypted-home.service',
    'etc/systemd/system/local-fs.target.wants/mount-encrypted-home.service'
  ]

  for (const fileRelPath of systemdFiles) {
    const fullPath = path.join(targetRoot, fileRelPath)
    if (fs.existsSync(fullPath)) {
       try {
         fs.unlinkSync(fullPath)
       } catch { /* ignore */ }
    }
  }

  // -------------------------------------------------------
  // 3. RIMOZIONE SCRIPT COMUNI
  // -------------------------------------------------------
  const scriptFiles = [
    'usr/local/bin/tty1-unlock-wrapper.sh',
    'usr/local/bin/mount-encrypted-home.sh'
  ]

  for (const fileRelPath of scriptFiles) {
    const fullPath = path.join(targetRoot, fileRelPath)
    if (fs.existsSync(fullPath)) {
      try {
        fs.unlinkSync(fullPath)
      } catch { /* ignore */ }
    }
  }
}