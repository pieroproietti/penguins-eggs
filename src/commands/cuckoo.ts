/**
 * penguins-eggs-v7 based on Debian live
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import { Command, Flags } from '@oclif/core'
import os from 'node:os'
import fs from 'fs'
import Utils from '../classes/utils'
import Settings from '../classes/settings'
import { IWorkDir } from '../interfaces/i-workdir'

import { exec } from '../lib/utils'
import { fileURLToPath } from 'url'

export default class Cuckoo extends Command {
  config_file = '/etc/penguins-eggs.d/eggs.yaml' as string
  snapshot_dir = '' as string
  work_dir = {} as IWorkDir


  static description = 'cuckoo start a boot server on the LAN sharing iso on the nest'

  static flags = {
    help: Flags.help({ char: 'h' }),
    verbose: Flags.boolean({ char: 'v', description: 'verbose' })
  }

  static examples = ['$ eggs cuckoo\ncuckoo start a boot server sharing eggs on the nest']

  async run(): Promise<void> {
    Utils.titles(this.id + ' ' + this.argv)

    const { flags } = await this.parse(Cuckoo)
    let verbose = flags.verbose
    const echo = Utils.setEcho(verbose)

    if (Utils.isRoot()) {
      const settings = new Settings()
      await settings.load()
      console.log('starting PXE server on ' + Utils.address() + '/' + Utils.netmask())
      console.log('we will use iso images from ' + settings.config.snapshot_dir)
      dnsmasq()
    } else {
      Utils.useRoot(this.id)
    }
  }
}


function dnsmasq() {
  let iface = Utils.iface()
  let domain = `penguins-eggs.lan`
  let dhcpRange=`192.168.1.160,192.168.1.200,255.255.255.0,2h`
  console.log(`cut and past to /etc/dnsmasq.conf`)

  console.log(`interface=${iface},lo`)
  console.log(`bind-interfaces`)
  console.log(`domain=${domain}`)
  console.log(`dhcp-range=${dhcpRange}`)
  console.log(`# gateway\ndhcp-option=3,${Utils.gateway()}`)
  console.log(`# dns\ndhcp-option=6,${Utils.getDns()}`)
  
  /**
  
  
  #-- dns Forwarder info
  server=8.8.8.8
  
  #----------------------#
  # Specify TFTP Options #
  #----------------------#
  
  #--location of the pxeboot file
  dhcp-boot=/bios/pxelinux.0,pxeserver,192.168.1.150
  
  #--enable tftp service
  enable-tftp
  
  #-- Root folder for tftp
  tftp-root=/tftp
  
  #--Detect architecture and send the correct bootloader file
  dhcp-match=set:efi-x86_64,option:client-arch,7 
  dhcp-boot=tag:efi-x86_64,grub/bootx64.efi
  `
    )
   */
}