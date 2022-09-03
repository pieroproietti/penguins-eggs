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

    // if (Utils.isRoot()) {
    const settings = new Settings()
    await settings.load()
    console.log('starting PXE server on ' + Utils.address() + '/' + Utils.netmask())
    console.log('we will use iso images from ' + settings.config.snapshot_dir)
    dnsmasq()
    // } else {
    // Utils.useRoot(this.id)
    // }
  }
}


function dnsmasq() {
  let iface = Utils.iface()
  let domain = `penguins-eggs.lan`
  let dhcpRange = `192.168.1.160,192.168.1.200,255.255.255.0,2h`
  console.log(`cut and past to /etc/dnsmasq.conf`)
  
  let content = ``
  content += `# Don't function as a DNS server:\nport=0\n\n`
  content += `# Log lots of extra information about DHCP transactions.\nlog-dhcp\n\n`
  content += `# Disable re-use of the DHCP servername and filename fields as extra\n# option space. That's to avoid confusing some old or broken DHCP clients.\ndhcp-no-override\n\n`
  content += `# The boot filename, Server name, Server Ip Address\ndhcp-boot=bios/pxelinux,,${Utils.address()}\n\n`
  content += `# PXE menu.  The first part is the text displayed to the user.  The second is the timeout, in seconds.\n`
  content += `pxe-prompt="Booting PXE Client", 1\n\n`
  content += `# The known types are x86PC, PC98, IA64_EFI, Alpha, Arc_x86,\n`
  content += `# Intel_Lean_Client, IA32_EFI, ARM_EFI, BC_EFI, Xscale_EFI and X86-64_EFI\n`
  content += `# This option is first and will be the default if there is no input from the user.\n`
  content += `# PXEClient:Arch:00000\n`
  content += `pxe-service=X86PC, "Boot BIOS PXE", bios/pxelinux\n\n`
  content += `# PXEClient:Arch:00007\n`
  content += `pxe-service=BC_EFI, "Boot UEFI PXE-BC", efi64/syslinux.efi\n\n`
  content += `# PXEClient:Arch:00009\npxe-service=X86-64_EFI, "Boot UEFI PXE-64", efi64/syslinux.efi\n\n`
  content += `dhcp-range=${Utils.address()},proxy,${Utils.netmask()}\n\n`

  console.log(content)
  console.log('copy and paste in /etc/dnsmasq.conf')

  /**
   * https://serverfault.com/questions/829068/trouble-with-dnsmasq-dhcp-proxy-pxe-for-uefi-clients
   */
}