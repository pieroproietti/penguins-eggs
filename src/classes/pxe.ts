/**
 * penguins-eggs: pxe.ts
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 */
import os from 'node:os'
import fs from 'fs'
import Utils from '../classes/utils'
import Settings from '../classes/settings'
import { IWorkDir } from '../interfaces/i-workdir'

import { exec } from '../lib/utils'
import { fileURLToPath } from 'url'

/**
* Pxe:
*/
export default class Pxe {
    verbose = false

    echo = {}

    settings = {} as Settings

    async fertilization() {
        this.settings = new Settings()        
        await this.settings.load()
    }

    structure() {
        if (!fs.existsSync(this.settings.work_dir.path)) {
            let cmd = `mkdir -p ${this.settings.work_dir.path}`
            this.tryCatch(cmd)
        }
    }

    /**
     * 
     */
    dnsMasq() {
        let iface = Utils.iface()
        let domain = `penguins-eggs.lan`
        let dhcpRange = `192.168.1.160,192.168.1.200,255.255.255.0,2h`

        let content = ``
        content += `# copy and paste in /etc/dnsmasq.conf\n\n`
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

        /**
         * https://serverfault.com/questions/829068/trouble-with-dnsmasq-dhcp-proxy-pxe-for-uefi-clients
         */

    }

    /**
    * 
    * @param cmd 
    */
    async tryCatch(cmd = '') {
        try {
            await exec(cmd, this.echo)
        } catch (error) {
            console.log(`Error: ${error}`)
            await Utils.pressKeyToExit(cmd)
        }
    }
}
