/**
 * ./src/commands/export/deb.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import { Command, Flags } from '@oclif/core'

import Tools from '../../classes/tools.js'
import Utils from '../../classes/utils.js'
import { exec } from '../../lib/utils.js'

export default class ExportDeb extends Command {
  static description = 'export deb/docs/iso to the destination host'

  static examples = ['eggs export deb', 'eggs export deb --clean', 'eggs export deb --all']

  static flags = {
    all: Flags.boolean({ char: 'a', description: 'export all archs' }),
    clean: Flags.boolean({ char: 'c', description: 'remove old .deb before to copy' }),
    help: Flags.help({ char: 'h' }),
    verbose: Flags.boolean({ char: 'v', description: 'verbose' })
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ExportDeb)
    Utils.titles(this.id + ' ' + this.argv)

    const Tu = new Tools()
    Utils.warning(ExportDeb.description)
    await Tu.loadSettings()

    const echo = Utils.setEcho(flags.verbose)

    let arch = Utils.uefiArch()
    if (flags.all) {
      arch = '*'
    }

    arch += '.deb'

    const remoteMountpoint = `/tmp/eggs-${(Math.random() + 1).toString(36).slice(7)}`
    let cmd = `mkdir ${remoteMountpoint}\n`
    cmd += `sshfs ${Tu.config.remoteUser}@${Tu.config.remoteHost}:${Tu.config.remotePathDeb} ${remoteMountpoint}\n`
    if (flags.clean) {
      cmd += `rm -f ${remoteMountpoint}/${Tu.config.filterDeb}${arch}\n`
    }

    cmd += `cp ${Tu.config.localPathDeb}${Tu.config.filterDeb}${arch}  ${remoteMountpoint}\n`
    cmd += 'sync\n'
    cmd += `umount ${remoteMountpoint}\n`
    cmd += `rm -rf ${remoteMountpoint}\n`
    if (!flags.verbose) {
      if (flags.clean) {
        console.log(`remove: ${Tu.config.remoteUser}@${Tu.config.remoteHost}:${Tu.config.filterDeb}${arch}`)
      }

      console.log(`copy: ${Tu.config.localPathDeb}${Tu.config.filterDeb}${arch} to ${Tu.config.remoteUser}@${Tu.config.remoteHost}:${Tu.config.remotePathDeb}`)
    }

    await exec(cmd, echo)
  }
}
