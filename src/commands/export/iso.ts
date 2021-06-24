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
    backup: flags.boolean({ char: 'b', description: 'export backup ISOs' }),
    clean: flags.boolean({ char: 'c', description: 'delete old ISOs before to copy' }),
  }

  async run() {
    const { flags } = this.parse(ExportIso)
    Utils.titles(this.id + ' ' + this.argv)

    const Tu = new Tools()
    Utils.warning(ExportIso.description)
    await Tu.loadSettings()
    if (flags.backup) {
      if(Tu.snapshot_name.substring(0,7)==='egg-of-') {
        Tu.snapshot_name = 'backup-' +Tu.snapshot_name.substring(7)
      }
    }

    let cmd = `ssh root@${Tu.config.remoteHost} rm -rf ${Tu.config.remotePathIso}${Tu.snapshot_name}*`
    if (flags.clean) {
      Utils.warning('cleaning destination...')
      await exec(cmd, { echo: true, capture: true })
    }
    Utils.warning('copy to destination...')
    cmd = `scp ${Tu.snapshot_dir}${Tu.snapshot_name}* root@${Tu.config.remoteHost}:${Tu.config.remotePathIso}`
    await exec(cmd, { echo: true, capture: true })
  }
}



