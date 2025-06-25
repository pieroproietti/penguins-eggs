/**
 * ./src/commands/cuckoo.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import { Command, Flags } from '@oclif/core'

import network from '../classes/network.js'
import Pxe from '../classes/pxe.js'
import Settings from '../classes/settings.js'
import Utils from '../classes/utils.js'
import {IDhcpOptions, ITftpOptions} from '../dhcpd-proxy/interfaces/i-pxe.js'

export default class Cuckoo extends Command {
  static description = 'PXE start with proxy-dhcp'

  static examples = ['sudo eggs cuckoo']

  static flags = {
    help: Flags.help({ char: 'h' })
  }

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Cuckoo)

    Utils.titles(this.id + ' ' + this.argv)

    if (Utils.isRoot()) {
      const settings = new Settings()
      settings.load()

      const nest = settings.config.snapshot_mnt
      const pxeRoot = nest + 'pxe'

      const pxe = new Pxe(nest, pxeRoot)
      await pxe.fertilization()
      await pxe.build()

      const n = new network()

      /**
       * service proxy-dhcp
       */
      const dhcpOptions: IDhcpOptions = {
        bios_filename: 'lpxelinux.0',
        efi32_filename: 'ipxe32.efi',
        efi64_filename: 'ipxe.efi',
        host: n.address,
        subnet: n.cidr,
        tftpserver: n.address,
        broadcast: n.broadcast()
      }
      console.log("starting dhcp")
      pxe.dhcpdStart(dhcpOptions)

      /**
       * service tftp
       */
      const tftpOptions: ITftpOptions = {
        denyPUT: true,
        host: n.address,
        port: 69,
        root: pxeRoot
      }

      await pxe.tftpStart(tftpOptions)
      await pxe.httpStart()
    } else {
      Utils.useRoot(this.id)
    }
  }
}
