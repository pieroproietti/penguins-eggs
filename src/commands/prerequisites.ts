/**
 * penguins-eggs-v7 based on Debian live
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import { Command, flags } from '@oclif/command'
import shx = require('shelljs')
import Utils from '../classes/utils'
import fs = require('fs')
import path = require('path')
import { POINT_CONVERSION_COMPRESSED } from 'constants'

export default class Prerequisites extends Command {
  static description = 'install the prerequisites packages to run penguin\'s eggs'

  static examples = [
    `$ eggs prerequisites
install the prerequisites packages to run penguin's eggs
`,
  ]

  async run() {

    this.log(`tryind to update the system`)
    if (Utils.isRoot()) {

      /**
       * Debian live
       */

      const codeUpdate: number = shx.exec(`/usr/bin/apt-get update -y`).code
      if (codeUpdate === 0) {
        this.log(`udapte executed`)
        this.log(`now we install the prerequisites packages...`)
        const codeInstall: number = shx.exec(`/usr/bin/apt-get install -y menu xdg-utils squashfs-tools syslinux-utils xdg-user-dirs xorriso ntfs-3g smartmontools`).code
        if (codeInstall === 0) {
          this.log(`prerequisites installed...`)
        } else {
          this.log(`There was a problem installing the prerequisistes... Error: ${codeInstall}`)
        }
      } else {
        this.log(`error updating the system... Error: ${codeUpdate}`)
      }
    }
  }
}
