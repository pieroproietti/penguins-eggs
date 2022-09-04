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
import  path  from 'node:path'


/**
* Pxe:
*/
export default class Pxe {
    verbose = false

    echo = {}

    settings = {} as Settings
    eggsHome = '/'
    pxeRoot = '/pxe'
    pxeConfig = '/config'
    pxeFirmware = '/firmware'
    pxeIsos = '/isos'


    async fertilization() {
        this.settings = new Settings()        
        await this.settings.load()
        this.eggsHome = path.dirname(this.settings.work_dir.path)
    }

    structure() {
        if (!fs.existsSync(this.eggsHome)) {
            let cmd = `mkdir -p ${this.eggsHome}`
            this.tryCatch(cmd)
        }

        this.pxeRoot = this.eggsHome + this.pxeRoot
        this.pxeConfig = this.pxeRoot  + this.pxeConfig
        this.pxeFirmware = this.pxeRoot  + this.pxeFirmware
        this.pxeIsos = this.pxeRoot  + this.pxeIsos

        if (!fs.existsSync(this.pxeConfig)) {
            this.tryCatch(`mkdir -p ${this.pxeConfig}`)
        }

        if (!fs.existsSync(this.pxeFirmware)) {
            this.tryCatch(`mkdir -p ${this.pxeFirmware}`)
        }

        if (!fs.existsSync(this.pxeIsos)) {
            this.tryCatch(`mkdir -p ${this.pxeIsos}`)
        }

        // git clone https://github.com/ipxe/ipxe.git
        // create bootconfig.ipxe
        /*
        #!ipxe
        dhcp
        chain tftp://192.168.1.19/config/boot.ipxe
        */
        // make bin/ipxe.pxe bin/undionly.kpxe bin/undionly.kkpxe bin/undionly.kkkpxe bin-x86_64-efi/ipxe.efi EMBED=bootconfig.ipxe
        // sudo cp -v bin/{ipxe.pxe,undionly.kpxe,undionly.kkpxe,undionly.kkkpxe} bin-x86_64-efi/ipxe.efi /home/eggs/pxe/firmware/
    }

    /**
     * 
     */
    dnsMasq() {
        let domain = `penguins-eggs.lan`
        let dhcpRange = `192.168.1.160,192.168.1.200,255.255.255.0,2h`

        let content = ``
        content += `port=0\n`
        content += `log-dhcp\n`
        content += `log-queries\n`
        content += `log-facility=/tmp/dnsmasq.log\n`

        content += `# copy and paste in /etc/dnsmasq.conf\n\n`
        content += `interface=${Utils.iface()}\n\n`
        content += `bind-interfaces\n\n`
        content += `domain=${domain}\n\n`
        content += `dhcp-range=${Utils.iface()},192.168.1.1,proxy,255.255.255.0\n\n`
        content += `# next\n`
        content += `dhcp-option=option:next,192.168.1.19\n\n`
        content += `# router\n`
        content += `dhcp-option=option:router,192.168.1.1\n\n`
        content += `# dns\n`
        content += `dhcp-option=option:dns-server,192.168.1.1\n\n`
        content += `dhcp-option=option:dns-server,8.8.8.8\n\n`
        content += `enable-tftp\n\n`
        content += `tftp-root=${this.pxeRoot}\n\n`
        content += `# boot config for BIOS systems\n\n`
        content += `dhcp-match=set:bios-x86,option:client-arch,0\n\n`
        content += `dhcp-boot=tag:bios-x86,firmware/ipxe.pxe\n\n`
        content += `# boot config for UEFI systems\n\n`
        content += `dhcp-match=set:efi-x86_64,option:client-arch,7\n\n`
        content += `dhcp-match=set:efi-x86_64,option:client-arch,9\n\n`
        content += `dhcp-boot=tag:efi-x86_64,firmware/ipxe.efi\n\n`

        // content += `# Log lots of extra information about DHCP transactions.\nlog-dhcp\n\n`
        // content += `# Disable re-use of the DHCP servername and filename fields as extra\n# option space. That's to avoid confusing some old or broken DHCP clients.\ndhcp-no-override\n\n`
        // content += `# The boot filename, Server name, Server Ip Address\ndhcp-boot=bios/pxelinux,,${Utils.address()}\n\n`
        // content += `# PXE menu.  The first part is the text displayed to the user.  The second is the timeout, in seconds.\n`
        // content += `pxe-prompt="Booting PXE Client", 1\n\n`
        // content += `# The known types are x86PC, PC98, IA64_EFI, Alpha, Arc_x86,\n`
        // content += `# Intel_Lean_Client, IA32_EFI, ARM_EFI, BC_EFI, Xscale_EFI and X86-64_EFI\n`
        // content += `# This option is first and will be the default if there is no input from the user.\n`
        // content += `# PXEClient:Arch:00000\n`
        // content += `pxe-service=X86PC, "Boot BIOS PXE", bios/pxelinux\n\n`
        // content += `# PXEClient:Arch:00007\n`
        // content += `pxe-service=BC_EFI, "Boot UEFI PXE-BC", efi64/syslinux.efi\n\n`
        // content += `# PXEClient:Arch:00009\npxe-service=X86-64_EFI, "Boot UEFI PXE-64", efi64/syslinux.efi\n\n`
        // content += `dhcp-range=${Utils.address()},proxy,${Utils.netmask()}\n\n`

        console.log(content)

        /**
         * https://linuxhint.com/pxe_boot_ubuntu_server/#6
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
