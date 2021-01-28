import { Command, flags } from '@oclif/command'
import { contributors } from 'pjson';
import Tools from '../../classes/tools'
import Utils from '../../classes/utils'
const exec = require('../../lib/utils').exec;

export default class ExportDeb extends Command {
  static description = 'export package eggs-v7-x-x-1.deb in the destination host'

  static flags = {
    help: flags.help({ char: 'h' }),
    armel: flags.boolean({ description: 'export armel arch' }),
    amd64: flags.boolean({ description: 'export amd64 arch' }),
    i386: flags.boolean({ description: 'export i386 arch' }),
    all: flags.boolean({ description: 'export all arch' }),
    clean: flags.boolean({ char: 'c', description: 'remove old .deb before to copy' }),
  }

  async run() {
    const { args, flags } = this.parse(ExportDeb)
    Utils.titles(this.id + ' ' + this.argv)

    const Tu = new Tools
    Utils.warning(ExportDeb.description)
    await Tu.loadSettings()

    // rimozione
    let cmd = `ssh ${Tu.config.remoteUser}@${Tu.config.remoteHost} rm -rf ${Tu.config.remotePathDeb}${Tu.config.filterDeb}`
    if (flags.clean) {
      console.log('cleaning destination...')
      if (flags.armel) {
        cmd += 'armel.deb'
      } else if (flags.amd64) {
        cmd += 'amd64.deb'
      } else if (flags.i386) {
        cmd += 'i386.deb'
      } else if (flags.all) {
        cmd += '*.deb'
      } else {
        let arch = 'amd64'
        if (process.arch === 'ia32') {
            arch = 'i386'
        }
        cmd += arch + '.deb'
      }

      await exec(cmd, { echo: true, capture: true })
    }

    // esportazione
    cmd = `scp ${Tu.config.localPathDeb}${Tu.config.filterDeb}`
    console.log('copy to destination...')
    if (flags.armel) {
      cmd += 'armel.deb'
    } else if (flags.amd64) {
      cmd += 'amd64.deb'
    } else if (flags.i386) {
      cmd += 'i386.deb'
    } else if (flags.all) {
      cmd += '*.deb'
    } else {
      let arch = 'amd64'
      if (process.arch === 'ia32') {
          arch = 'i386'
      }
      cmd += arch + '.deb'
    }
    cmd += ` ${Tu.config.remoteUser}@${Tu.config.remoteHost}:${Tu.config.remotePathDeb}`
    await exec(cmd, { echo: true, capture: true })
  }
}
