/**
 * krill: module hosts
 *
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 *
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

import Sequence from '../krill-sequence'
import fs from 'fs'

/**
 * hosts
 * @param this 
 */
export default async function hosts(this: Sequence): Promise<void> {
    const file = this.installTarget + '/etc/hosts'
    let text = '127.0.0.1 localhost localhost.localdomain\n'
    if (this.network.addressType === 'static') {
        text += `${this.network.address} ${this.users.hostname} pvelocalhost\n`
    } else {
        text += `127.0.1.1 ${this.users.hostname} \n`
    }
    text += `# The following lines are desirable for IPv6 capable hosts\n`
    text += `:: 1     ip6 - localhost ip6 - loopback\n`
    text += `fe00:: 0 ip6 - localnet\n`
    text += `ff00:: 0 ip6 - mcastprefix\n`
    text += `ff02:: 1 ip6 - allnodes\n`
    text += `ff02:: 2 ip6 - allrouters\n`
    text += `ff02:: 3 ip6 - allhosts\n`
    fs.writeFileSync(file, text)
}
