/**
 * ./src/krill/modules/del-live-user.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

import Utils from '../../../classes/utils.js'
import { exec } from '../../../lib/utils.js'
import Sequence from '../sequence.js'

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
        let cmd = `chroot ${this.installTarget} deluser --remove-home ${user} ${this.toNull}`
        if (this.distro.familyId === 'archlinux' || 
          this.distro.familyId === 'fedora'  || 
          this.distro.familyId === 'opensuse') {

          cmd = `chroot ${this.installTarget} sudo userdel -r ${user} ${this.toNull}`
        }
        await exec(cmd, this.echo)
      }
    }
  }
}
