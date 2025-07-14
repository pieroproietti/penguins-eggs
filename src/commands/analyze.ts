/**
 * ./src/commands/analyze.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import { Command, Flags } from '@oclif/core'
import fs, { constants } from 'node:fs'
import { access } from 'node:fs/promises'
import si from 'systeminformation'

import Users from '../classes/users.js'
import Utils from '../classes/utils.js'
import { IWorkDir } from '../interfaces/i-workdir.js'

export default class Analyze extends Command {
  static description = 'analyze for syncto'

  static examples = ['sudo eggs analyze']
  static flags = {
    help: Flags.help({ char: 'h' }),
    verbose: Flags.boolean({ char: 'v', description: 'verbose' })
  }

  config_file = '/etc/penguins-eggs.d/eggs.yaml' as string
  snapshot_dir = '' as string
  work_dir = {} as IWorkDir

  /**
   * fill
   */
  async fill(): Promise<Users[]> {
    try {
      const usersArray = []
      await access('/etc/passwd', constants.R_OK | constants.W_OK)
      const passwd = fs.readFileSync('/etc/passwd', 'utf8').split('\n')
      for (const element of passwd) {
        const line = element.split(':')
        const users = new Users(line[0], line[1], line[2], line[3], line[4], line[5], line[6])
        await users.getValues()
        if (users.password !== undefined) {
          usersArray.push(users)
        }
      }

      return usersArray
    } catch {
      console.error("can't read /etc/passwd")
      process.exit(1)
    }
  }

  async run(): Promise<void> {
    Utils.titles(this.id + ' ' + this.argv)

    const { flags } = await this.parse(Analyze)
    let verbose = false
    if (flags.verbose) {
      verbose = true
    }

    Utils.warning('eggs will analyze your system, and get users data')

    const echo = Utils.setEcho(verbose)
    let totalSize = 0
    if (Utils.isRoot(this.id)) {
      const audio = await si.audio()
      const bios = await si.bios()
      const blockDevices = await si.blockDevices()
      const chassis = await si.chassis()
      const cpu = await si.cpu()
      const diskLayout = await si.diskLayout()
      const mem = await si.mem()
      const usb = await si.usb()

      console.log(`chassis: ${chassis.manufacturer} model: ${chassis.manufacturer}`)
      console.log(`bios vendor: ${bios.vendor} version: ${bios.version} revision: ${bios.revision}`)
      console.log(`processor: ${cpu.brand} core: ${cpu.cores} `)
      if (diskLayout[0].device !== undefined) {
        console.log(`disk0: ${diskLayout[0].device}`)
      }

      if (diskLayout[1] !== undefined) {
        console.log(`disk1: ${diskLayout[1].device}`)
      }

      if (diskLayout[2] !== undefined) {
        console.log(`disk1: ${diskLayout[2].device}`)
      }

      // console.log(`name: ${blockDevices[0].name} fs: ${blockDevices[0].fsType}`)
      // console.log(`name: ${blockDevices[1].name} fs: ${blockDevices[1].fsType}`)
      // console.log(`name: ${blockDevices[2].name} fs: ${blockDevices[2].fsType}`)
      // console.log(`name: ${blockDevices[3].name} fs: ${blockDevices[3].fsType}`)

      // console.log(`usb: ${usb[0].name}`)

      const users = await this.fill()
      for (let i = 0; i < users.length; i++)
        if (users[i].saveIt) {
          console.log(`user: ${users[i].login} \thome: ${users[i].home.padEnd(16)} \tsize: ${Utils.formatBytes(users[i].size)} \tBytes: ${users[i].size} `)
          totalSize += users[i].size
        }

      console.log(`Total\t\t\t\t\tSize: ${Utils.formatBytes(totalSize)} \tBytes: ${totalSize}`)
    } else {
      Utils.useRoot(this.id)
    }
  }
}
