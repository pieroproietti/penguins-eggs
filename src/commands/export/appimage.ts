/**
 * ./src/commands/export/appimage.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import { Command, Flags } from '@oclif/core'
import os from 'node:os'

import Distro from '../../classes/distro.js'
import Diversions from '../../classes/diversions.js'
import Tools from '../../classes/tools.js'
import Utils from '../../classes/utils.js'
import { IEggsConfigTools } from '../../interfaces/i-config-tools.js'
import { exec, execSync } from '../../lib/utils.js'

export default class ExportAppimage extends Command {
  static description = 'export penguins-eggs AppImage to the destination host'
  static examples = ['eggs export pkg', 'eggs export pkg --clean', 'eggs export pkg --all']
  static flags = {
    clean: Flags.boolean({ char: 'c', description: 'remove old .AppImage before to copy' }),
    help: Flags.help({ char: 'h' }),
    verbose: Flags.boolean({ char: 'v', description: 'verbose' })
  }
  clean = false
  echo = {}
  Tu = new Tools()
  user = ''
  verbose = false

  /**
   *
   */
  async run(): Promise<void> {
    const { args, flags } = await this.parse(ExportAppimage)
    Utils.titles(this.id + ' ' + this.argv)
    Utils.warning(ExportAppimage.description)

    // Ora servono in più parti
    this.user = os.userInfo().username
    if (this.user === 'root') {
      this.user = (execSync('echo $DOAS_USER') || '').trim()
      if (this.user === '') {
        this.user = (execSync('echo $DOAS_USER') || '').trim()
      }
    }

    this.clean = flags.clean
    this.verbose = flags.verbose
    this.echo = Utils.setEcho(this.verbose)
    await this.Tu.loadSettings()

    const remoteMountpoint = `/tmp/eggs-${(Math.random() + 1).toString(36).slice(7)}`

    const localPath = '$HOME/penguins-eggs'
    const remotePath = '/eggs/'
    const filter = `penguins-eggs-+([0-9.])-*.AppImage`
    // let filter = `penguins-eggs-[0-9][0-9].[0-9]*.[0-9]*-*.AppImage`

    let cmd = `#!/bin/bash\n`
    cmd += `set -e\n`
    cmd += 'shopt -s extglob\n'
    cmd += `mkdir ${remoteMountpoint}\n`
    cmd += `sshfs ${this.Tu.config.remoteUser}@${this.Tu.config.remoteHost}:${remotePath} ${remoteMountpoint}\n`
    if (this.clean) {
      cmd += `# Delete old AppImage\n`
      cmd += `rm -f ${remoteMountpoint}/${filter}\n`
    }

    cmd += `# Export packages\n`
    cmd += `cp ${localPath}/${filter} ${remoteMountpoint}\n`
    cmd += 'sync\n'
    cmd += `\n`
    cmd += `# wait before to umount\n`
    cmd += 'sleep 2s\n'
    cmd += `fusermount3 -u ${remoteMountpoint}\n`
    cmd += `# remove mountpoint\n`
    cmd += `rm -rf ${remoteMountpoint}\n`
    if (!this.verbose) {
      if (this.clean) {
        console.log(`remove: ${this.Tu.config.remoteUser}@${this.Tu.config.remoteHost}:${filter}`)
      }

      console.log(`copy: ${localPath}/${filter} to ${this.Tu.config.remoteUser}@${this.Tu.config.remoteHost}:${remotePath}`)
    }

    await exec(cmd, this.echo)
  }
}
