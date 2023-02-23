/**
 * penguins-eggs-v7 based on Debian live
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import { Command, Flags, flush } from '@oclif/core'
import Utils from '../classes/utils'
import Krill from '../krill/krill-prepare'
import path from 'node:path'
import yaml from 'js-yaml'
import fs from 'fs'
import axios, { AxiosResponse } from 'axios'
import https from 'node:https'
const agent = new https.Agent({
  rejectUnauthorized: false
})
import { IKrillConfig } from '../interfaces/i-krill-config'


/**
 * Class Krill
 */
export default class Install extends Command {
  static flags = {
    crypted: Flags.boolean({ char: 'k', description: 'Crypted CLI installation' }),
    custom: Flags.string({ char: 'c', description: 'custom unattended configuration' }),
    domain: Flags.string({ char: 'd', description: 'Domain name, defult: .local' }),
    help: Flags.help({ char: 'h' }),
    ip: Flags.boolean({ char: 'i', description: 'hostname as ip, eg: ip-192-168-1-33' }),
    nointeractive: Flags.boolean({ char: 'n', description: 'no user interaction' }),
    none: Flags.boolean({ char: 'N', description: 'Swap none: 256M' }),
    pve: Flags.boolean({ char: 'p', description: 'Proxmox VE install' }),
    random: Flags.boolean({ char: 'r', description: 'Add random to hostname, eg: colibri-ay412dt' }),
    small: Flags.boolean({ char: 's', description: 'Swap small: RAM' }),
    suspend: Flags.boolean({ char: 'S', description: 'Swap suspend: RAM x 2' }),
    unattended: Flags.boolean({ char: 'u', description: 'Unattended installation' }),
    verbose: Flags.boolean({ char: 'v', description: 'Verbose' })
  }
  static description = 'krill: the CLI system installer - the egg became a penguin!'

  static examples = [
    "sudo eggs install", 
    "sudo eggs install --unattended", 
    "sudo eggs install --custom it"
  ]

  /**
   * Execute
   */
  async run(): Promise<void> {
    Utils.titles(this.id + ' ' + this.argv)

    const { flags } = await this.parse(Install)

    let custom = flags.custom!

    let unattended = flags.unattended
    if (unattended) {
      custom = 'us'
    }

    // krillConfig
    let krillConfig = {} as IKrillConfig
    if (custom !== undefined) {
      let fname = path.basename(custom)
      unattended = true
      let url = `https://raw.githubusercontent.com/pieroproietti/penguins-wardrobe/main/config/${fname}.yaml`
      let res: AxiosResponse
      await axios.get(url, { httpsAgent: agent })
      .then(function (response) {
        krillConfig = yaml.load(response.data) as IKrillConfig
      })
      .catch(function (error) {
        const content = fs.readFileSync('/etc/penguins-eggs.d/krill.yaml', 'utf8')
        krillConfig = yaml.load(content) as IKrillConfig
      })
    }

    // nointeractive
    let nointeractive = flags.nointeractive

    // hostname
    let ip = flags.ip
    let random = flags.random

    let domain = '.local'
    if (flags.domain) {
      domain = flags.domain!
    }

    // swap
    let suspend = flags.suspend
    let small = flags.small
    let none = flags.none

    let crypted = flags.crypted

    let pve = flags.pve
    if (pve) {
      crypted = false
    }

    let verbose = flags.verbose

    if (Utils.isRoot()) {
      if (Utils.isLive()) {
        const krill = new Krill()
        await krill.prepare(unattended, nointeractive, krillConfig, ip, random, domain, suspend, small, none, crypted, pve, verbose)
      } else {
        Utils.warning('You are in an installed system!')
      }
    } else {
      Utils.useRoot(this.id)
    }
  }
}
