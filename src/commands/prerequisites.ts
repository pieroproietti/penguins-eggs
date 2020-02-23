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
    Utils.titles()
    
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
                  isolinux \
                  live-boot \
                  live-boot-initramfs-tools \
                  open-infrastructure-system-config \
                  xterm \
                  whois \
                  grub-efi-amd64', {async: false}) 

                  /**
                   * rimosso 
                   * syslinux OK incluse on isolinux
                   * live-config live-config-systemd conflict open-infrastructure-system-config 
                   */

                  /**
                   * dipendenze di refracta
                   * 
                   * bash
                   * mount
                   * rsync
                   * squashfs-tools
                   * xorriso
                   * gawk | mawk
                   * live-boot
                   * live-config 
                   * live-boot-initramfs-tools
                   * live-config-sysvinit | live-config-systemd | live-config-upstart
                   * syslinux-common
                   * syslinux | isolinux
                   */
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
