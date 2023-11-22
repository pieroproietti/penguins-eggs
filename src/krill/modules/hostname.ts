/**
 * penguins-eggs
 * krill modules: hostname.ts
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

import Sequence from '../krill-sequence'
import fs from 'fs'

/**
 * hostname
 */
export default async function hostname(this: Sequence, domain = 'localdomain'): Promise<void> {
  const hostname = this.users.hostname

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
    let text = '127.0.0.1 localhost localhost.localdomain\n'
    if (this.network.addressType === 'static') {
      text += `${this.network.address} ${hostname}${domain} pvelocalhost\n`
    } else {
      if (domain !== '') {
        text += `127.0.1.1 ${hostname}${domain} ${hostname}\n`
      } else {
        text += `127.0.1.1 ${hostname}\n`        
      }
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

