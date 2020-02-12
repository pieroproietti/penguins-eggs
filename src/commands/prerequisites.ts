/* eslint-disable no-multi-str */
/**
 * penguins-eggs-v7 based on Debian live
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import {Command, flags} from '@oclif/command'
import shx = require('shelljs')
import path = require('path')
import Utils from '../classes/utils'

export default class Prerequisites extends Command {
  static description = 'install the prerequisites packages to run penguin\'s eggs'

  static examples = [
    `$ eggs prerequisites
install the prerequisites packages to run penguin's eggs
`,
  ]

  async run() {
    this.log('tryind to update the system')
    if (Utils.isRoot()) {
      /**
       * Debian live
       */

      /**
       * https://github.com/MX-Linux/mx-remaster
       *
       * installed-to-live    /usr/sbin
       * live-files/*         /usr/local/share/live-files
       */
      shx.echo('mx-remaster')
      // shx.cp(path.resolve(__dirname, '../../mx-linux/mx-remaster/installed-to-live'), '/usr/sbin') // installed-to-live
      // shx.cp('-R', path.resolve(__dirname, '../../mx-linux/mx-remaster/live-files'), '/usr/local/share') // live-files
      shx.cp(path.resolve(__dirname, '../../scripts/installed-to-live'), '/usr/sbin') // installed-to-live
      const codeUpdate: number = shx.exec('/usr/bin/apt-get update -y').code
      if (codeUpdate === 0) {
        this.log('udapte executed')
        this.log('now we install the prerequisites packages...')
        this.log('>>> eggs: Installing the prerequisites packages...')
        shx.exec('apt update', {async: false})
        shx.exec('\
                  apt-get --yes install \
                  lvm2 \
                  parted \
                  squashfs-tools \
                  xorriso \
                  syslinux \
                  isolinux \
                  live-boot \
                  xterm \
                  zenity \
                  open-infrastructure-system-config \
                  whois ', {async: false})

        // Copia della configurazione
        shx.cp(path.resolve(__dirname, '../../conf/penguins-eggs.conf'), '/etc')
        shx.mkdir('-p', '/usr/local/share/excludes/')
        shx.cp(path.resolve(__dirname, '../../conf/penguins-eggs-exclude.list'), '/usr/local/share/excludes')
      } else {
        this.log(`error updating the system... Error: ${codeUpdate}`)
      }
    }
  }
}
