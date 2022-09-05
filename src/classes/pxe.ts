/**
 * penguins-eggs: pxe.ts
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 */
import os from 'node:os'
import fs from 'fs'
import Utils from '../classes/utils'
import Settings from '../classes/settings'

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

        if (!fs.existsSync(`${this.pxeIsos}vmlinuz`)) {
            this.tryCatch(`cp /home/eggs/ovarium/iso/live/vmlinuz-5.10.0-16-amd64 /home/eggs/pxe/isos/vmlinuz`)
            this.tryCatch(`cp /home/eggs/ovarium/iso/live/initrd.img-5.10.0-16-amd64 /home/eggs/pxe/isos/initrd.img`)
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
    async dnsMasq() {
        let domain = `penguins-eggs.lan`

        let content = ``
        content += `# copy and paste in /etc/dnsmasq.conf\n\n`
        content += `#\n`
        content += `# Don't function as a DNS server:\n`
        content += `port=0\n\n`
        content += `# Log lots of extra information about DHCP transactions.\n`
        content += `log-dhcp\n\n`
        content += `log-queries\n\n`
        content += `log-facility=/home/artisan/dnsmasq.log\n\n`
        content += `interface=${await Utils.iface()}\n\n`
        content += `bind-interfaces\n\n`
        content += `domain=${domain}\n\n`

        // dhcp-full
        content += `dhcp-range=${await Utils.iface()},192.168.1.1,192.168.1.254,255.255.255.0,8h\n\n`

        // dhcp-proxy
        //content += `dhcp-range=${await Utils.iface()},192.168.1.1,proxy\n\n`

        content += `# router\n`
        content += `dhcp-option=option:router,192.168.1.1\n\n`
        content += `# dns\n`
        content += `dhcp-option=option:dns-server,192.168.1.1\n\n`
        content += `dhcp-option=option:dns-server,8.8.8.8\n\n`
        content += `dhcp-option=option:dns-server,8.8.4.4\n\n`
        content += `enable-tftp\n\n`
        content += `tftp-root=${this.pxeRoot}\n\n`
        content += `pxe-prompt="Booting PXE Client", 5\n\n`
        content += `# boot config for BIOS systems\n\n`
        content += `dhcp-match=set:bios-x86,option:client-arch,0\n\n`
        content += `dhcp-boot=tag:bios-x86,firmware/ipxe.pxe\n\n`
        content += `# boot config for UEFI systems\n\n`
        content += `dhcp-match=set:efi-x86_64,option:client-arch,7\n\n`
        content += `dhcp-match=set:efi-x86_64,option:client-arch,9\n\n`
        content += `dhcp-boot=tag:efi-x86_64,firmware/ipxe.efi\n\n`

        let file = '/etc/dnsmasq.d/cuckoo.conf'
        fs.writeFileSync(file, content)

        await exec (`systemctl stop dnsmasq.service`)
        await exec (`rm /home/artisan/dnsmasq.log\n`)

        await exec (`systemctl start dnsmasq.service`)
        await exec (`systemctl status dnsmasq.service`)
        
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
