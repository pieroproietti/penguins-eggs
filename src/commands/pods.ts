/**
 * ./src/commands/cuckoo.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import { Args, Command, Flags } from '@oclif/core'
import fs from 'fs'
import Utils from '../classes/utils.js'
import { exec } from '../lib/utils.js'
import path from 'node:path'
import { execSync } from 'node:child_process'


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

    if (!isPodmanInstalledSync()) {
      console.log('You need to install podmand to use this command')
      process.exit(0)
    }

    if (process.getuid && process.getuid() === 0) {
      Utils.warning('You must use eggs pods without sudo')
      process.exit(0)
    }

    // mode
    let pathPods = path.resolve(__dirname, `../../pods`)
    const userHome = `/home/${await Utils.getPrimaryUser()}/`
    if (Utils.isSources()) {
      console.log("Using eggs pods from sources.\nThe pods directory of the source will be used ")
    } else {
      console.log("Using eggs pods from package.")
      if (!fs.existsSync(`${userHome}/pods`)) {
        console.log(`The pods directory will be created in the user home ${userHome}, do you want to continue?`)
        if (await Utils.customConfirm()) {
          console.log(`Creating a pods folder under ${userHome}`)
          await exec(`cp -r ${Utils.rootPenguin()}/pods ${userHome}`)
        }
      }
      pathPods = path.resolve(`${userHome}/pods`)
    }

    console.log(`Using ${pathPods}`)

    let distro = 'debian'
    if (this.argv['0'] !== undefined) {
      distro = this.argv['0']
    }

    let cmd = `${pathPods}/${distro}.sh`
    if (fs.existsSync(cmd)) {
      console.log(`We are building a egg from a ${distro} container`)
      if (! await Utils.customConfirm()) {
        process.exit(0)
      }
      await exec(cmd)
    } else {
      console.log(`No script: ${cmd} fpr ${distro} container`)
    }
  }
}

/**
 * 
 * @returns 
 */
function isPodmanInstalledSync(): boolean {
  let podmanInstalled=false
  try {
    execSync('podman --version', { stdio: 'ignore' })
    podmanInstalled=true
  } catch (error) {
    console.error('Podman does not appear to be installed or is not in the PATH.\n');
  }
  return podmanInstalled
}
