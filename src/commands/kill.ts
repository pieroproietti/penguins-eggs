/**
 * penguins-eggs-v7 based on Debian live
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import {Command, Flags} from '@oclif/core'

import fs from 'fs'
import Utils from '../classes/utils'
import Settings from '../classes/settings'
import {IWorkDir} from '../interfaces/i-workdir'

import {exec} from '../lib/utils'

export default class Kill extends Command {
  static flags = {
    help: Flags.help({char: 'h'}),
    nointeractive: Flags.boolean({char: 'n', description: 'no user interaction'}),
    verbose: Flags.boolean({char: 'v', description: 'verbose'}),
  }

  static description = 'kill the eggs/free the nest'
  static examples = [
    'sudo eggs kill',
  ]

  config_file = '/etc/penguins-eggs.d/eggs.yaml' as string
  snapshot_dir = '' as string
  work_dir = {} as IWorkDir

  async run(): Promise<void> {
    Utils.titles(this.id + ' ' + this.argv)

    const {flags} = await this.parse(Kill)
    let verbose = false
    if (flags.verbose) {
      verbose = true
    }

    const nointeractive = flags.nointeractive

    const echo = Utils.setEcho(verbose)

    if (Utils.isRoot()) {
      const settings = new Settings()
      await settings.load()
      await settings.listFreeSpace()
      if (nointeractive || await Utils.customConfirm()) {
        if (checkMPs(`${settings.work_dir.path}/filesystem.squashfs`)) {
          await exec(`rm ${settings.work_dir.path}/* -rf`, echo)
          await exec(`rm ${settings.config.snapshot_dir} -rf`, echo)
        } else {
          console.log(`cannot kill`)
        }
      }
    } else {
      Utils.useRoot(this.id)
    }
  }
}

function checkMPs(path: string) : Boolean {
  let retVal = false
  const dirs = ['etc', 'boot', 'usr', 'var']

  for (const dir in dirs) {
    const dirToCheck = `${path}/${dir}`
    if (Utils.isMountpoint(dirToCheck)) {
      console.log(`${dirToCheck}, is a mountpoint!`)
      retVal= true 
    }
  }

  return retVal
}