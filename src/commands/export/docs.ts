import { Command, flags } from '@oclif/command'
import Tools from '../../classes/tools'
import Utils from '../../classes/utils'

const exec = require('../../lib/utils').exec

export default class ExportDocs extends Command {
  static description = 'export docType documentation of the sources in the destination host'

  static flags = {
    help: flags.help({ char: 'h' }),
    clean: flags.boolean({ char: 'c' }),
  }

  static args = [{ name: 'file' }]

  async run() {
    const { args, flags } = this.parse(ExportDocs)

    const Tu = new Tools()
    Utils.titles('export:docs')
    Utils.warning(ExportDocs.description)

    await Tu.loadSettings()
    let cmd = ''
    if (flags.clean) {
      console.log('cleaning destination...')
      cmd = `ssh ${Tu.export_user_doc}@${Tu.export_host} rm -rf ${Tu.export_path_doc}*`
      await exec(cmd, { echo: true, capture: true })
    }

    await exec(`ssh ${Tu.export_user_doc}@${Tu.export_host} rm -rf ${Tu.export_path_doc}*`, { echo: true, capture: true })
    await exec(`scp -r ${Tu.local_path_doc}/* ${Tu.export_user_doc}@${Tu.export_host}:${Tu.export_path_doc}`, { echo: true, capture: true })
  }
}
