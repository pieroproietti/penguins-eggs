/**
 *
 */
import { Command, Flags } from '@oclif/core'
import Tools from '../../classes/tools'
import Utils from '../../classes/utils'
import { exec } from '../../lib/utils'

export default class ExportIso extends Command {
  static flags = {
    clean: Flags.boolean({ char: 'c', description: 'delete old ISOs before to copy' }),
    help: Flags.help({ char: 'h' }),
    verbose: Flags.boolean({ char: 'v', description: 'verbose' })
  }
  static description = 'export iso in the destination host'
  static examples = [
    "eggs export iso",
    "eggs export iso --clean",
  ]
  async run(): Promise<void> {
    const { flags } = await this.parse(ExportIso)
    Utils.titles(this.id + ' ' + this.argv)
    Utils.warning(ExportIso.description)

    const Tu = new Tools()
    await Tu.loadSettings()

    const echo = Utils.setEcho(flags.verbose)

    const rmount = `/tmp/eggs-${(Math.random() + 1).toString(36).substring(7)}`
    let cmd = `rm -f ${rmount}\n`
    let filter = '*.iso'
    cmd += `mkdir ${rmount}\n`
    cmd += `sshfs ${Tu.config.remoteUser}@${Tu.config.remoteHost}:${Tu.config.remotePathIso} ${rmount}\n`
    if (flags.clean){
      cmd += `rm -f ${rmount}/${Tu.snapshot_name}*\n`
    }
    cmd += `cp ${Tu.snapshot_dir}${Tu.snapshot_name}${filter} ${rmount}\n`
    cmd += `sync\n`
    cmd += `umount ${rmount}\n`
    cmd += `rm -f ${rmount}\m`

    if (!flags.verbose) {
      if (flags.clean){
        console.log(`remove: ${Tu.config.remoteUser}@${Tu.config.remoteHost}:${Tu.config.remotePathIso}${Tu.snapshot_name}${filter}`)
      }
      console.log(`copy: ${Tu.config.localPathIso}/${Tu.snapshot_name}${filter} to ${Tu.config.remoteUser}@${Tu.config.remoteHost}:${Tu.config.remotePathIso}`)
    }

    await exec(cmd, echo)
  }
}
