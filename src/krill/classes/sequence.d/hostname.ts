/**
 * ./src/krill/modules/hostnames.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

import fs from 'node:fs'

import Sequence from '../../classes/sequence.js'

/**
 * hostname
 */
export default async function hostname(this: Sequence, domain = ''): Promise<void> {
  const { hostname } = this.users

  /**
   * hostname
   */
  {
    const file = this.installTarget + '/etc/hostname'
    const text = hostname
    fs.writeFileSync(file, text)
  }

  /**
   * hosts
   */
  {
    const file = this.installTarget + '/etc/hosts'

    if (domain === '(none)') {
      domain = ''
    }

    let text = '127.0.0.1 localhost localhost.localdomain\n'
    if (this.network.addressType === 'static') {
      text += `${this.network.address} ${hostname} ${hostname}${domain} pvelocalhost pvelocalhost.pvelocaldomain\n`
    } else if (domain === '') {
      text += `127.0.1.1 ${hostname}\n`
    } else {
      text += `127.0.1.1 ${hostname} ${hostname}${domain}\n`
    }

    text += '# The following lines are desirable for IPv6 capable hosts\n'
    text += ':: 1     ip6 - localhost ip6 - loopback\n'
    text += 'fe00:: 0 ip6 - localnet\n'
    text += 'ff00:: 0 ip6 - mcastprefix\n'
    text += 'ff02:: 1 ip6 - allnodes\n'
    text += 'ff02:: 2 ip6 - allrouters\n'
    text += 'ff02:: 3 ip6 - allhosts\n'
    fs.writeFileSync(file, text)
  }
}
