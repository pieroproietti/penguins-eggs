/**
 * penguins-eggs-v7 based on Debian live
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import { Command, Flags } from '@oclif/core'

import fs from 'fs'
import Utils from '../classes/utils'
import { IWorkDir } from '../interfaces/i-workdir'
import { access } from 'fs/promises'
import { constants } from 'fs'
import Users from '../classes/users'

import si from 'systeminformation'

export default class Analyze extends Command {

  static flags = {
    help: Flags.help({ char: 'h' }),
    verbose: Flags.boolean({ char: 'v', description: 'verbose' })
  }
  static description = 'analyze for syncto'
  static examples = ['sudo eggs analyze']

  config_file = '/etc/penguins-eggs.d/eggs.yaml' as string
  snapshot_dir = '' as string
  work_dir = {} as IWorkDir

  async run(): Promise<void> {
    Utils.titles(this.id + ' ' + this.argv)

    const { flags } = await this.parse(Analyze)
    let verbose = false
    if (flags.verbose) {
      verbose = true
    }

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
      console.log(`processor: ${cpu.brand} core: ${cpu.cores} ` )
      if (diskLayout[0].device !== undefined) {
        console.log(`disk0: ${diskLayout[0].device}`)
      }
      if (diskLayout[1] !== undefined) {
        console.log(`disk1: ${diskLayout[1].device}`)
      }
      if (diskLayout[2] !== undefined) {
        console.log(`disk1: ${diskLayout[2].device}`)
      }

      console.log(`name: ${blockDevices[0].name} fs: ${blockDevices[0].fsType}`)
      console.log(`name: ${blockDevices[1].name} fs: ${blockDevices[1].fsType}`)
      console.log(`name: ${blockDevices[2].name} fs: ${blockDevices[2].fsType}`)
      console.log(`name: ${blockDevices[3].name} fs: ${blockDevices[3].fsType}`)

      console.log(`usb: ${usb[0].name}`)      

      /**
       * Windows: "/Documents and Settings", "/Programs", "/AppData"
       * MacOS: "/Users"
       * Linux: "/home"
       */

      Utils.warning('eggs will analyze your system, to get users and servers data')
      const users = await this.fill()
      for (let i = 0; i < users.length; i++)
        if (users[i].saveIt) {
          console.log(`user: ${users[i].login} \thome: ${users[i].home.padEnd(16)} \tsize: ${Utils.formatBytes(users[i].size)} \tBytes: ${users[i].size} `)
          // console.log(`user: ${users[i].login} \thome: ${users[i].home} \tsize: ${users[i].size}`)
          totalSize += users[i].size
        }
      console.log(`Total\t\t\t\t\tSize: ${Utils.formatBytes(totalSize)} \tBytes: ${totalSize}`)
    } else {
      Utils.useRoot(this.id)
    }
  }

  /**
   * fill
   */
  async fill(): Promise<Users[]> {
    try {
      const usersArray = []
      await access('/etc/passwd', constants.R_OK | constants.W_OK);
      const passwd = fs.readFileSync('/etc/passwd', 'utf-8').split('\n')
      for (let i = 0; i < passwd.length; i++) {
        var line = passwd[i].split(':')
        const users = new Users(line[0], line[1], line[2], line[3], line[4], line[5], line[6])
        await users.getValues()
        if (users.password !== undefined) {
          usersArray.push(users)
        }
      }
      return usersArray
    } catch {
      console.error("can't read /etc/passwd");
      process.exit(1)
    }
  }
}

