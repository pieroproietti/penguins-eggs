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
    clean: flags.boolean({ char: 'c', description: 'delete old ISOs before to copy' }),
  }

  async run() {
    const { flags } = this.parse(ExportIso)
    Utils.titles(this.id + ' ' + this.argv)

    let arch = 'x64'
    if (process.arch === 'ia32') {
      arch = 'i386'
    } else if (process.arch === 'armel') {
      arch = 'armel'
    }

    const Tu = new Tools()
    Utils.warning(ExportIso.description)
    await Tu.loadSettings()
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



