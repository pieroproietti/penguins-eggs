import { Command, Flags } from '@oclif/core'
import Tools from '../../classes/tools'
import Utils from '../../classes/utils'

import { exec } from '../../lib/utils'

export default class ExportDeb extends Command {
  static description = 'export deb/docs/iso to the destination host'

  static flags = {
    help: Flags.help({ char: 'h' }),
    clean: Flags.boolean({ char: 'c', description: 'remove old .deb before to copy' }),
    amd64: Flags.boolean({ description: 'export amd64 arch' }),
    i386: Flags.boolean({ description: 'export i386 arch' }),
    armel: Flags.boolean({ description: 'export armel arch' }),
    arm64: Flags.boolean({ description: 'export arm64 arch' }),
    all: Flags.boolean({ char: 'a', description: 'export all archs' })
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ExportDeb)
    Utils.titles(this.id + ' ' + this.argv)

    const Tu = new Tools()
    Utils.warning(ExportDeb.description)
    await Tu.loadSettings()

    let script = ''
    let arch = Utils.eggsArch()
    if (flags.clean) {
      if (flags.all) {
        arch = '*'
      }
      arch += '.deb'
      script += ``
    }
    
    const rmount = `/tmp/eggs-${(Math.random() + 1).toString(36).substring(7)}`
    let cmd = `rm -f ${rmount}\n`
    cmd += `mkdir ${rmount}\n`
    cmd += `sshfs ${Tu.config.remoteUser}@${Tu.config.remoteHost}:${Tu.config.remotePathDeb} ${rmount}\n`
    cmd += `rm -f ${rmount}/${Tu.config.filterDeb}${arch}\n`
    cmd += `cp ${Tu.config.localPathDeb}${Tu.config.filterDeb}${arch}  ${rmount}\n`
    cmd += `sync\n`
    cmd += `umount ${rmount}\n`
    cmd += `rm -f ${rmount}\m`
    console.log(cmd)
    await exec(cmd, { echo: false, capture: true })
  }
}
