/**
 * penguins-eggs
 * krill modules: del-live.ts
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

import Sequence from '../krill-sequence'
import {exec} from '../../lib/utils'
import Utils from '../../classes/utils'

/**
   * delUser
   * va corretto con users.conf di calamares
*/
export default async function delLiveUser(this: Sequence) {
  if (Utils.isLive()) {
    const user: string = this.settings.config.user_opt

    let userExists = false
    try {
      const cmd = `#!/bin/sh\ngetent passwd "${user}"  > /dev/null`
      await exec(cmd, Utils.setEcho(this.verbose))
      userExists = true
    } catch (error) {
      console.log(error)
    } finally {
      if (userExists) {
        // debian family
        let cmd = `chroot ${this.installTarget} deluser --remove-home ${user} ${this.toNull}`
        if (this.distro.familyId === 'archlinux') {
          cmd = `chroot ${this.installTarget} sudo userdel -r ${user} ${this.toNull}`
        }

        await exec(cmd, this.echo)
      }
    }
  }
}
