/**
 * ./src/commands/install.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import { Command, Flags, flush } from '@oclif/core'
import yaml from 'js-yaml'
import fs from 'node:fs'
import https from 'node:https'
import shx from 'shelljs'


import Utils from '../classes/utils.js'
import Krill from '../krill/classes/prepare.js'
const agent = new https.Agent({
  rejectUnauthorized: false
})
import { IKrillConfig } from '../krill/interfaces/i_krill_config.js'
// import { ILvmOptions } from '../krill/interfaces/i-krill.js'

/**
 * Class Krill
 */
export default class Install extends Command {
  static aliases = ['krill']

  static description = 'krill: the CLI system installer - the egg became a penguin!'

  static examples = ['sudo eggs install', 'sudo eggs install --unattended --halt', 'sudo eggs install --chroot']

  static flags = {
    btrfs: Flags.boolean({ char: 'b', description: 'Format btrfs' }),
    chroot: Flags.boolean({ char: 'c', description: 'chroot before to end' }),
    crypted: Flags.boolean({ char: 'k', description: 'Crypted CLI installation' }),
    domain: Flags.string({ char: 'd', description: 'Domain name, defult: .local' }),
    halt: Flags.boolean({ char: 'H', description: 'Halt the system after installation' }),
    help: Flags.help({ char: 'h' }),
    ip: Flags.boolean({ char: 'i', description: 'hostname as ip, eg: ip-192-168-1-33' }),
    nointeractive: Flags.boolean({ char: 'n', description: 'no user interaction' }),
    none: Flags.boolean({ char: 'N', description: 'Swap none: 256M' }),
    pve: Flags.boolean({ char: 'p', description: 'Proxmox VE install' }),
    random: Flags.boolean({ char: 'r', description: 'Add random to hostname, eg: colibri-ay412dt' }),
    replace: Flags.string({ char: `R`, description: `Replace partition. eg: --replace /dev/sda3` }),
    small: Flags.boolean({ char: 's', description: 'Swap small: RAM' }),
    suspend: Flags.boolean({ char: 'S', description: 'Swap suspend: RAM x 2' }),
    testing: Flags.boolean({ char: 't', description: "Just testing krill" }),
    unattended: Flags.boolean({ char: 'u', description: 'Unattended installation' }),
    verbose: Flags.boolean({ char: 'v', description: 'Verbose' })
  }

  /**
   * Execute
   */
  async run(): Promise<void> {
    Utils.titles(this.id + ' ' + this.argv)

    const { flags } = await this.parse(Install)

    const { unattended } = flags

    // krillConfig
    let krillConfig = {} as IKrillConfig

    const content = fs.readFileSync('/etc/penguins-eggs.d/krill.yaml', 'utf8')
    krillConfig = yaml.load(content) as IKrillConfig

    // nointeractive
    const { nointeractive } = flags

    // halt
    const { halt } = flags

    // hostname
    const { ip } = flags
    const { random } = flags

    // chroot before to end
    const { chroot } = flags

    // eg: eggs install --replace /dev/sda3
    let replace = ''
    if (flags.replace) {
      replace = flags.replace

      // Definiamo la dimensione minima richiesta in bytes (1 GB = 1024*1024*1024 bytes)
      const minSizeBytes = 1024 * 1024 * 1024;

      try {
        const sizeInBytesString = shx.exec(`lsblk -b -n -o SIZE ${replace}`).stdout.trim();
        const partitionSize = parseInt(sizeInBytesString, 10);

        if (partitionSize < minSizeBytes) {
          console.log(`partition to replace ${replace}, is too little`)
          process.exit()
        }

      } catch (error) {
        console.log(`partition ${replace} does not exists!`)
        process.exit()
      }
    }
    Utils.pressKeyToExit()

    let domain = ''
    if (flags.domain) {
      domain = flags.domain!
    }

    // swap
    const { suspend } = flags
    const { small } = flags
    const { none } = flags

    let { crypted } = flags

    const { pve } = flags
    if (pve) {
      crypted = false
    }

    const { testing } = flags

    const { verbose } = flags

    if (Utils.isRoot() || testing) {
      if (Utils.isLive() || testing) {
        const krill = new Krill(unattended, nointeractive, halt, chroot)
        await krill.prepare(krillConfig, ip, random, domain, suspend, small, none, crypted, pve, flags.btrfs, testing, verbose)
      } else {
        Utils.warning('You are in an installed system!')
      }
    } else {
      Utils.useRoot(this.id)
    }
  }
}
