import { Command, Flags } from '@oclif/core'
import Tools from '../../classes/tools'
import Utils from '../../classes/utils'

import { exec } from '../../lib/utils'

export default class ExportDocs extends Command {
  static description = 'remove and export docType documentation of the sources in the destination host'

  static flags = {
    help: Flags.help({ char: 'h' })
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ExportDocs)

    const Tu = new Tools()
    Utils.titles(this.id + ' ' + this.argv)
    Utils.warning(ExportDocs.description)

    await Tu.loadSettings()
    await exec(`ssh ${Tu.config.remoteUser}@${Tu.config.remoteHost} rm -rf ${Tu.config.remotePathDoc}*`, { echo: true, capture: true })
    await exec(`scp -r ${Tu.config.localPathDoc}/* ${Tu.config.remoteUser}@${Tu.config.remoteHost}:${Tu.config.remotePathDoc}`, { echo: true, capture: true })
  }
}
