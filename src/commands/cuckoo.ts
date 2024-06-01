/**
 * ./src/commands/cuckoo.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import {Command, Flags} from '@oclif/core'

import network from '../classes/network.js'
import Pxe from '../classes/pxe.js'
import Utils from '../classes/utils.js'
import {IDhcpOptions, ITftpOptions} from '../interfaces/i-pxe.js'

// const tftp = require('tftp')

export default class Cuckoo extends Command {
  static description = 'PXE start with proxy-dhcp'

  static examples = [
    'sudo eggs cuckoo',
  ]

  static flags = {
    help: Flags.help({char: 'h'}),
  }

  async run(nest = '/home/eggs/mnt'): Promise<void> {
    const {args, flags} = await this.parse(Cuckoo)

    Utils.titles(this.id + ' ' + this.argv)
    if (Utils.isRoot()) {
      const pxeRoot = nest + '/pxe'
      const pxe = new Pxe()
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
      }
      pxe.dhcpStart(dhcpOptions)

      /**
       * service tftp
       */
      const tftpOptions: ITftpOptions = {
        denyPUT: true,
        host: n.address,
        port: 69,
        root: pxeRoot,
      }
      await pxe.tftpStart(tftpOptions)

      /**
       * service http
       */
      await pxe.httpStart()
    } else {
      Utils.useRoot(this.id)
    }
  }
}

