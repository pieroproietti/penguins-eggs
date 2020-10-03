import { Command, flags } from '@oclif/command'
import Tools from '../../classes/tools'
import Utils from '../../classes/utils'
const exec = require('../../lib/utils').exec;

export default class ExportDeb extends Command {
  static description = 'export package eggs-v7-6-x-1.deb in the destination host'

  static flags = {
    help: flags.help({ char: 'h' }),
    clean: flags.boolean({ char: 'c' }),
  }

  static args = [{ name: 'file' }]

  async run() {

    const { args, flags } = this.parse(ExportDeb)
    const Tu = new Tools
    Utils.titles('export:deb')
    Utils.warning(ExportDeb.description)
    
    await Tu.loadSettings()
    let cmd = ``
    if (flags.clean){
      console.log('cleaning destination...')
      cmd =  cmd =`ssh ${Tu.export_user_deb}@${Tu.export_host} rm -rf ${Tu.export_path_deb}${Tu.file_name_deb}`
      await exec(cmd,{echo: true, capture: true})
    }

    cmd = `scp ${Tu.local_path_deb}${Tu.file_name_deb} ${Tu.export_user_deb}@${Tu.export_host}:${Tu.export_path_deb}`
    console.log('copy to destination...')
    await exec(cmd,{echo: true, capture: true})
  }
}

