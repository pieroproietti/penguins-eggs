/**
 * cuckoo: proxy
 */

import {Command, Flags} from '@oclif/core'
import network from '../classes/network'
import Utils from '../classes/utils'
import Pxe from '../classes/pxe'
import {ITftpOptions, IDhcpOptions} from '../interfaces/i-pxe'
const tftp = require('tftp')

export default class Cuckoo extends Command {
  static flags = {
    help: Flags.help({char: 'h'}),
  }

  static description = 'PXE start with proxy-dhcp'
  static examples = [
    'sudo eggs cuckoo',
  ]

  async run(nest = '/home/eggs'): Promise<void> {
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
        subnet: n.cidr,
        host: n.address,
        tftpserver: n.address,
        bios_filename: 'lpxelinux.0',
        efi32_filename: 'ipxe32.efi',
        efi64_filename: 'ipxe.efi',
      }
      pxe.dhcpStart(dhcpOptions)

      /**
       * service tftp
       */
      const tftpOptions: ITftpOptions = {
        host: n.address,
        port: 69,
        root: pxeRoot,
        denyPUT: true,
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

