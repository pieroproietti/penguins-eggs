import { Command, Flags } from '@oclif/core'
import Tools from '../../classes/tools'
import Utils from '../../classes/utils'

import { exec } from '../../lib/utils'

export default class ExportDocs extends Command {
  static description = 'remove and export docType documentation of the sources in the destination host'

  static flags = {
    verbose: Flags.boolean({ char: 'v', description: 'verbose' }),
    help: Flags.help({ char: 'h' })
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ExportDocs)

    const Tu = new Tools()
    Utils.titles(this.id + ' ' + this.argv)
    Utils.warning(ExportDocs.description)

    await Tu.loadSettings()

    const echo = Utils.setEcho(flags.verbose)

    const rmount = `/tmp/eggs-${(Math.random() + 1).toString(36).substring(7)}`
    let cmd = `rm -f ${rmount}\n`
    cmd += `mkdir ${rmount}\n`
    cmd += `sshfs ${Tu.config.remoteUser}@${Tu.config.remoteHost}:${Tu.config.remotePathDoc} ${rmount}\n`
    cmd += `rm -f ${rmount}/*\n`
    cmd += `cp ${Tu.config.localPathDoc}/* ${rmount}\n`
    cmd += `sync\n`
    cmd += `umount ${rmount}\n`
    cmd += `rm -f ${rmount}\m`

    await exec(cmd, echo)

  }
}
