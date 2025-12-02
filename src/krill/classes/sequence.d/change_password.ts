/**
 * src/krill/modules/change-password.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * * REFACTORED: Uses "The SysUser Master" class.
 * Changes user password directly in /etc/shadow safely (No binaries, SELinux safe).
 */

import SysUsers from '../../../classes/sys-users.js'
import Sequence from '../sequence.js'
import fs from 'fs'

/**
 * changePassword
 * @param name - Username to update
 * @param newPassword - New plain text password
 */
export default async function changePassword(this: Sequence, name = 'live', newPassword = 'evolution') {
  
  const target = this.installTarget
  const familyId = this.distro.familyId

  console.log(`Changing password for user '${name}' via SysUsers...`)

  // 1. CARICAMENTO
  // Se non esiste il target (caso strano), usciamo
  if (!fs.existsSync(target)) {
      console.error(`Error: Target ${target} not found for password change.`)
      return
  }

  const sysUsers = new SysUsers(target, familyId)
  sysUsers.load()

  // 2. MODIFICA (In Memoria)
  // La classe SysUsers ha già il metodo setPassword che usa bcryptjs
  // e aggiorna il timestamp di lastChange.
  sysUsers.setPassword(name, newPassword)

  // 3. SALVATAGGIO (Atomico + SELinux Fix)
  await sysUsers.save()

  console.log(`Password updated for '${name}'.`)
}