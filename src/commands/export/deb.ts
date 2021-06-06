import { Command, flags } from '@oclif/command'
import Tools from '../../classes/tools'
import Utils from '../../classes/utils'

const exec = require('../../lib/utils').exec;

export default class ExportDeb extends Command {
  static description = 'export deb/docs/iso to the destination host'

  static flags = {
    help: flags.help({ char: 'h' }),
    clean: flags.boolean({ char: 'c', description: 'remove old .deb before to copy' }),
    amd64: flags.boolean({ description: 'export amd64 arch' }),
    i386: flags.boolean({ description: 'export i386 arch' }),
    armel: flags.boolean({ description: 'export armel arch' }),
    arm64: flags.boolean({ description: 'export arm64 arch' }),
    all: flags.boolean({ char: 'a', description: 'export all archs' }),
  }

  async run() {
    const { args, flags } = this.parse(ExportDeb)
    Utils.titles(this.id + ' ' + this.argv)

    const Tu = new Tools
    Utils.warning(ExportDeb.description)
    await Tu.loadSettings()

    // rimozione
    if (flags.clean) {
      console.log('cleaning remote host...')
      let arch = 'amd64'
      if (flags.amd64) {
        arch = 'amd64.deb'
      } else if (flags.i386) {
        arch = 'i386.deb'
      } else if (flags.arm64) {
        arch = 'arm64.deb'
      } else if (flags.armel) {
        arch = 'armel.deb'
      } else if (flags.all) {
        arch = '*.deb'
      }
      const cmd = `ssh ${Tu.config.remoteUser}@${Tu.config.remoteHost} rm -rf ${Tu.config.remotePathDeb}${Tu.config.filterDeb}${arch}`
      await exec(cmd, { echo: true, capture: true })
    }

    // esportazione
    console.log('copy to remote host...')
    let arch = 'amd64.deb'
    if (flags.amd64) {
      arch = 'amd64.deb'
    } else if (flags.i386) {
      arch = 'i386.deb'
    } else if (flags.amd64) {
      arch = 'arm64.deb'
    } else if (flags.armel) {
      arch = 'armel.deb'
    } else if (flags.all) {
      arch = '*.deb'
    }

    const cmd = `scp ${Tu.config.localPathDeb}${Tu.config.filterDeb}${arch} root@${Tu.config.remoteHost}:${Tu.config.remotePathDeb}`
    await exec(cmd, { echo: true, capture: true })

  }
}