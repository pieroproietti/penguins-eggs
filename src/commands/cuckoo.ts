/**
 * cuckoo: proxy
 */

import { Command, Flags } from '@oclif/core'
import network from '../classes/network'
import Utils from '../classes/utils'
import GreatTit from '../classes/great-tit'
const dhcpd = require('../dhcpd/dhcpd')
// import dhcpd from '../dhcpd/dhcpd'
import { ITftpOptions, IDhcpOptions } from '../interfaces/i-pxe-options'

const tftp = require('tftp')
import http, { IncomingMessage, ServerResponse } from 'http'
import { getImpliedNodeFormatForFile } from 'typescript'

export default class Cuckoo extends Command {
  static description = 'PXE start with proxy-dhcp'

  static examples = [
    `$ sudo eggs cuckoo
start a PXE server with dhcp-proxy (can coexists with a real dhcp server)
`,
  ]

  static flags = {
    from: Flags.string({ char: 'f', description: 'Who is saying hello', required: false }),
  }

  async run(nest = '/home/eggs'): Promise<void> {
    const { args, flags } = await this.parse(Cuckoo)

    Utils.titles(this.id + ' ' + this.argv)
    if (Utils.isRoot()) {
      const pxeRoot = nest + '/pxe'
      const gt = new GreatTit()
      await gt.fertilization()
      await gt.build()

      const n = new network()
      
      /**
       * service proxy-dhcp
       */
       let dhcpOptions: IDhcpOptions = {
        subnet: n.cidr,
        host: n.address,
        tftpserver: n.address,
        bios_filename: 'lpxelinux.0',
        efi32_filename: 'ipxe32.efi',
        efi64_filename: 'ipxe.efi'
      }
      let dhcpdProxy = new dhcpd(dhcpOptions)

      /**
       * service tftp
       */
       let tftpOptions: ITftpOptions = {
        "host": n.address,
        "port": 69,
        "root": pxeRoot,
        "denyPUT": true
      }
      await gt.tftpStart(tftpOptions)

      /**
       * service http
       */
      await gt.httpStart()

    } else {
      Utils.useRoot(this.id)
    }
  }
}

