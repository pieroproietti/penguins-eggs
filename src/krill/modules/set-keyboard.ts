/**
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

import Sequence from '../krill-sequence'
import Utils from '../../classes/utils'
import { exec } from '../../lib/utils'

export default async function setKeyboard(this: Sequence) {
    /**
    * influence: - /etc/default/keyboard (x11)
    *            - /etc/vconsole.conf (console) 
    *            - /etc/X11/xorg.conf.d/00-keyboard.conf
    * 
    * Problem: Actually don't update /etc/default/keyboard (x11)
    *          /etc/vconsole.conf is update in installed systems
    */

    // systemd as default
    let cmd = `chroot ${this.installTarget} localectl set-keymap ${this.keyboardLayout}`
    if (!Utils.isSystemd()) {
        cmd = `chroot ${this.installTarget} setupcon ${this.toNull}`
    }

    try {
        await exec(cmd, this.echo)
    } catch (error) {
        console.log(error)
        Utils.pressKeyToExit(cmd, true)
    }

    /**
     * this must to be not necessary but...
     * 
     * force change /etc/default/keyboard (x11)
     * force change /etc/vconsole.conf
     */
    let content = '# KEYBOARD CONFIGURATION FILE\n\n'
    content += '# Consult the keyboard(5) manual page.\n\n'
    content += 'XKBMODEL="' + this.keyboardModel + '"\n'
    content += 'XKBLAYOUT="' + this.keyboardLayout + '"\n'
    content += 'XKBVARIANT="' + this.keyboardVariant + '"\n'
    content += 'XKBOPTIONS=""\n'
    content += '\n'
    content += 'BACKSPACE="guess"\n'
    Utils.write(this.installTarget + '/etc/default/keyboard', content)

    content = 'KEYMAP="' + this.keyboardModel + '"\n'
    content += 'FONT=\n'
    content += 'FONT_MAP=\n'
    Utils.write(this.installTarget + '/etc/vconsole.conf', content)
}

