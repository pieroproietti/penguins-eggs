/* eslint-disable no-multi-str */
/**
 * penguins-eggs-v7 based on Debian live
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import { Command, flags } from '@oclif/command'
import shx = require('shelljs')
import path = require('path')
import Utils from '../classes/utils'

export default class Prerequisites extends Command {
  static description = 'install the prerequisites packages to run penguin\'s eggs'

  static flags = {
    help: flags.help({ char: 'h' }),
    configuration_only: flags.boolean({ char: 'c', description: 'not remove/reinstall calamares, only configuration' }),
  }

  static examples = [
    `~$ eggs prerequisites\ninstall the prerequisites packages to run penguin's eggs\n`,
    `~$ eggs prerequisites -c\ncreate only configuration\n`,
  ]

  
  async run() {
    Utils.titles()
    console.log('command: prerequisites')

    const { flags } = this.parse(Prerequisites)


    if (Utils.isRoot()) {
      let answer = JSON.parse(await Utils.customConfirm(`Select yes to continue...`))

      if (answer.confirm === 'Yes') {
        shx.cp(path.resolve(__dirname, '../../conf/penguins-eggs.conf'), '/etc')
        shx.mkdir('-p', '/usr/local/share/excludes/')
        shx.cp(path.resolve(__dirname, '../../conf/penguins-eggs-exclude.list'), '/usr/local/share/excludes')

        if (!flags.configuration_only) {
          shx.cp(path.resolve(__dirname, '../../scripts/installed-to-live'), '/usr/sbin') // installed-to-live
          const codeUpdate: number = shx.exec('/usr/bin/apt-get update -y').code
          if (codeUpdate === 0) {
            this.log('udapte executed')
            this.log('now we install the prerequisites packages...')
            this.log('>>> eggs: Installing the prerequisites packages...')
            shx.exec('apt update', { async: false })
            shx.exec('\
                  apt-get --yes install \
                  parted \
                  squashfs-tools \
                  xorriso \
                  isolinux \
                  live-boot \
                  live-boot-initramfs-tools \
                  open-infrastructure-system-config \
                  xterm \
                  whois \
                  grub-efi-amd64', { async: false })

            /**
             * rimosso 
             * live-config live-config-systemd conflict open-infrastructure-system-config 
             */
          }
        }
      }
    }
  }
}
