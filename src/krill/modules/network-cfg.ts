/**
 * penguins-eggs
 * krill modules: network.ts
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

import Sequence from '../krill-sequence'
import Utils from '../../classes/utils'
import Pacman from '../../classes/pacman'
import Systemctl from '../../classes/systemctl'
import { exec } from '../../lib/utils'

/**
/**
 * networkcfg
 *
 * we have:
 * - debian: /etc/network/interface
 * - ubuntu: netplan
 * - manjaro: ? // ip address add 192.168.61/24 + dev enp6s18
 */
export default async function networkCfg(this: Sequence) {
  /**
   * debian 
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
    Utils.write(file, content)
  } else if (this.distro.familyId === 'arch') {
    // do nothing? 
  }

  /**
  * resolv.conf 
  */
  console.log(this.network.addressType)
  process.exit()
  if (this.network.addressType !== 'dhcp') {
    /**
     * Franco Conidi: se è installato resolvconf
     */
    const systemdCtl = new Systemctl()
    if (await systemdCtl.isActive('resolvconf.service')) {
      await exec(`rm ${this.installTarget}/etc/resolv.conf`)
      await exec(`ln -s /run/resolvconf/resolv.conf ${this.installTarget}/etc/resolv.conf`)
    } else {
      const file = this.installTarget + '/etc/resolv.conf'
      let content = '# created by eggs\n\n'
      content += 'domain ' + this.network.domain + '\n'
      for (const element of this.network.dns) {
        content += 'nameserver ' + element + '\n'
      }
      Utils.write(file, content)
    }
  }
}
