/**
 * ./src/commands/export/iso.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import { Command, Flags } from '@oclif/core'

import Tools from '../../classes/tools.js'
import Utils from '../../classes/utils.js'
import { exec } from '../../lib/utils.js'

export default class ExportIso extends Command {
  static description = 'export remastered ISO in the destination host'

  static examples = ['eggs export iso', 'eggs export iso --clean']

  static flags = {
    checksum: Flags.boolean({ char: 'C', description: 'export checksums md5 and sha256' }),
    clean: Flags.boolean({ char: 'c', description: 'delete old ISOs before to copy' }),
    help: Flags.help({ char: 'h' }),
    verbose: Flags.boolean({ char: 'v', description: 'verbose' })
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(ExportIso)
    Utils.titles(this.id + ' ' + this.argv)
    Utils.warning(ExportIso.description)

    const Tu = new Tools()
    await Tu.loadSettings()

    const echo = Utils.setEcho(flags.verbose)

    const rmount = `/tmp/eggs-${(Math.random() + 1).toString(36).slice(7)}`
    let cmd = `rm -f ${rmount}\n`
    const filters = ['*.iso', '*.md5', '*.sha256']
    cmd += `mkdir ${rmount}\n`
    cmd += `sshfs ${Tu.config.remoteUser}@${Tu.config.remoteHost}:${Tu.config.remotePathIso} ${rmount}\n`
    if (flags.clean) {
      cmd += `rm -f ${rmount}/${Tu.snapshot_name}*\n`
    }

    cmd += `cp ${Tu.snapshot_dir}${Tu.snapshot_name}${filters[0]} ${rmount}\n`
    if (flags.checksum) {
      cmd += `cp ${Tu.snapshot_dir}${Tu.snapshot_name}${filters[1]} ${rmount}\n`
      cmd += `cp ${Tu.snapshot_dir}${Tu.snapshot_name}${filters[2]} ${rmount}\n`
    }

    cmd += 'sync\n'
    cmd += `umount ${rmount}\n`
    cmd += `rm -f ${rmount}\m`

    if (!flags.verbose) {
      if (flags.clean) {
        console.log(`remove  ${Tu.config.remoteUser}@${Tu.config.remoteHost}:${Tu.config.remotePathIso}${Tu.snapshot_name}${filters[0]}`)
      }

      if (flags.checksum) {
        console.log(`export  ${Tu.config.localPathIso}/${Tu.snapshot_name}${filters[1]}/${filters[2]} to ${Tu.config.remoteUser}@${Tu.config.remoteHost}:${Tu.config.remotePathIso}`)
      }

      console.log(`scp     ${Tu.config.localPathIso}/${Tu.snapshot_name}${filters[0]} ${Tu.config.remoteUser}@${Tu.config.remoteHost}:${Tu.config.remotePathIso}`)
    }

    await exec(cmd, echo)
  }
}
