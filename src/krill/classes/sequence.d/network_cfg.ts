/**
 * ./src/krill/modules/network-cfg.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

import fs from 'node:fs'

import Pacman from '../../../classes/pacman.js'
import Systemctl from '../../../classes/systemctl.js'
import Utils from '../../../classes/utils.js'
import { exec } from '../../../lib/utils.js'
import Sequence from '../sequence.js'

/**
 * networkcfg
 *
 * - debian: /etc/network/interface
 * - ubuntu: netplan
 * - arch:
 *
 * - all: /etc/resolv.conf
 */
export default async function networkCfg(this: Sequence) {
  const systemdCtl = new Systemctl()

  /**
   * debian: /etc/network/interfaces
   */
  if (this.distro.familyId === 'debian' && !Pacman.packageIsInstalled('netplan.io')) {
    const file = this.installTarget + '/etc/network/interfaces'
    let content = '# created by eggs\n\n'
    content += 'auto lo\n'
    content += 'iface lo inet loopback\n\n'
    content += 'auto ' + this.network.iface + '\n'
    content += 'iface ' + this.network.iface + ' inet ' + this.network.addressType + '\n'
    if (this.network.addressType !== 'dhcp') {
      content += '    address ' + this.network.address + '\n'
      content += '    netmask ' + this.network.netmask + '\n'
      content += '    gateway ' + this.network.gateway + '\n'
    }

    try {
      fs.writeFileSync(file, content, 'utf8')
    } catch (e) {
      console.log("error on write: " + file)
    }

  } else if (this.distro.familyId === 'debian' && Pacman.packageIsInstalled('netplan.io')) {
    // netplan: to do
  } else if (this.distro.familyId === 'arch') {
    // arch: seem to work
  }

  /**
   * resolv.conf
   */
  const resolvFile = this.installTarget + '/etc/resolv.conf'
  await exec(`rm -f ${resolvFile}`)
  if (fs.existsSync('/run/systemd/resolve/resolv.conf')) {
    await exec(`ln -s /run/systemd/resolve/resolv.conf ${resolvFile}`)
  } else {
    let content = '# created by eggs\n\n'
    content += 'domain ' + this.network.domain + '\n'
    for (const element of this.network.dns) {
      content += 'nameserver ' + element + '\n'
    }
    try {
      fs.writeFileSync(resolvFile, content, 'utf8')
    } catch (e) {
      console.log("error on write: " + resolvFile)
    }
  }
}
