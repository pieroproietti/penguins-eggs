/**
 * ./src/commands/cuckoo.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import { Args, Command, Flags } from '@oclif/core'
import fs from 'fs'
import Utils from '../classes/utils.js'
import { exec } from '../lib/utils.js'
import path from 'node:path'

// _dirname
const __dirname = path.dirname(new URL(import.meta.url).pathname)

export default class Pods extends Command {
  static args = {
    distro: Args.string({ description: 'distro to build', name: 'distro', required: false })
  }

  static description = 'eggs pods: build ISOs from containers'
  static examples = [
    'eggs pods archlinux',
    'eggs pods debian',
    'eggs pods ubuntu',
  ]

  static flags = {
    help: Flags.help({ char: 'h' })
  }

  /**
   * 
   */
  async run(): Promise<void> {
    Utils.titles(this.id + ' ' + this.argv)
    
    const { args, flags } = await this.parse(Pods)

    if (process.getuid && process.getuid() === 0) {
      Utils.warning('You must use eggs pods without sudo')
      process.exit(0)
    }

    // Create pods if not exists
    const userHome=`/home/${await Utils.getPrimaryUser()}/`
    if (!fs.existsSync(`${userHome}/pods`)) {
      console.log(`creating pods folder in ${userHome}`)
      const source = Utils.rootPenguin() + '/pods'
      await exec(`cp -r ${source} ${userHome}`)
    }

    let distro='debian'
    if (this.argv['0'] !== undefined) {
        distro = this.argv['0']
    }

    let pathPods = path.resolve(__dirname, `../../pods`)
    if (Utils.rootPenguin() === '/usr/lib/penguins-eggs') {
      pathPods = path.resolve(`${userHome}/pods`)
    }
    let cmd =`${pathPods}/${distro}.sh`

    if (fs.existsSync(cmd)) {
        await exec(cmd)
    } else {
        console.log(`script: ${cmd} not exists`)
    }
  }
}
