/**
 * ./src/krill/modules/m-keyboard.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

import fs from 'node:fs'

import Utils from '../../../classes/utils.js'
import { exec } from '../../../lib/utils.js'
import Sequence from '../sequence.js'

/**
 *
 * @param this
 */
export default async function mKeyboard(this: Sequence): Promise<void> {
  /**
   * influence: - /etc/default/keyboard (console)
   *            - /etc/X11/xorg.conf.d/00-keyboard.conf
   *            - /ext/vconsole.conf (non systemd)
   */
  if (this.distro.familyId === 'archlinux' || this.distro.familyId === 'debian' || this.distro.familyId === 'fedora') {
    let cmd = ''
    let content = ''
    if (Utils.isSystemd()) {
      cmd = `chroot ${this.installTarget} localectl set-keymap ${this.keyboardLayout} ${this.toNull}`
      content = '# See penguins-eggs/src/krill/modules/set-keyboard.ts\n\n'
      content += "# Read and parsed by systemd-localed. It's probably wise not to edit this file\n"
      content += '# manually too freely.\n'
      content += 'Section "InputClass"\n'
      content += '        Identifier "system-keyboard"\n'
      content += '        MatchIsKeyboard "on"\n'
      content += '        Option "XkbLayout" "' + this.keyboardLayout + '"\n'
      content += 'EndSection\n'
      if (fs.existsSync(this.installTarget + '/etc/X11/xorg.conf.d')) {
        Utils.write(this.installTarget + '/etc/X11/xorg.conf.d/00-keyboard.conf', content)
      }
    } else {
      /**
       * configuro vconsole.conf
       */
      cmd = `chroot ${this.installTarget} setupcon ${this.toNull}`
      content = '# See penguins-eggs/src/krill/modules/set-keyboard.ts\n\n'
      content += 'KEYMAP="' + this.keyboardLayout + '"\n'
      content += 'FONT=\n'
      content += 'FONT_MAP=\n'
      Utils.write(this.installTarget + '/etc/vconsole.conf', content)
    }
    await exec(cmd, this.echo)

  } else if (this.distro.familyId === 'alpine') {
    /**
    * Alpine dovrebbe fare tutto con `setup-keymap us us`
    */
    await exec(`chroot ${this.installTarget} setup-keymap ${this.keyboardLayout} ${this.keyboardLayout}`)
  }
}
