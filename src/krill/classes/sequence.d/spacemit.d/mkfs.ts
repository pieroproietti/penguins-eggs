// ./src/krill/sequence.d/spacemit.d/mkfs.ts
import { exec } from '../../../../lib/utils.js'
import Sequence from '../../sequence.js'

export default async function mkfs(this: Sequence): Promise<boolean> {
    await exec(`udevadm settle`, this.echo)
    await exec(`mkfs.ext4 -F ${this.devices.boot.name} ${this.toNull}`, this.echo)
    await exec(`mkfs.ext4 -F ${this.devices.root.name} ${this.toNull}`, this.echo)
    return true
}
