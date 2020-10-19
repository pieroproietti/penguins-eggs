/**
 * 
 */
import { Command, flags } from '@oclif/command'
import Tools from '../../classes/tools'
import Utils from '../../classes/utils'
const exec = require('../../lib/utils').exec;

export default class ExportIso extends Command {

  static description = 'export iso in the destination host'

  static flags = {
    help: flags.help({ char: 'h' }),
    clean: flags.boolean({ char: 'c' }),
  }

  static args = [{ name: 'file' }]

  async run() {
    const { flags } = this.parse(ExportIso)

    const Tu = new Tools()
    Utils.titles('export:iso')
    Utils.warning(ExportIso.description)
    await Tu.loadSettings()
    let cmd = ''
    if (flags.clean) {
      Utils.warning('cleaning destination...')
      cmd = `ssh ${Tu.export_user_iso}@${Tu.export_host} rm -rf ${Tu.export_path_iso}/${Tu.snapshot_name}*`
      await exec(cmd, { echo: true, capture: true })
    }
    Utils.warning('copy to destination...')
    cmd = `scp ${Tu.snapshot_dir}${Tu.snapshot_name}* ${Tu.export_user_iso}@${Tu.export_host}:${Tu.export_path_iso}`
    await exec(cmd, { echo: true, capture: true })
  }
}



