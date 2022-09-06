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
import path, { dirname } from 'node:path'
import { dir } from 'node:console'


/**
* Pxe:
*/
export default class Pxe {
    verbose = false

    echo = {}

    settings = {} as Settings
    pxeRoot = '/pxe/'
    pxeConfig = '/config'
    pxeFirmware = '/firmware'
    pxeIsos = '/isos'


    async fertilization() {
        this.settings = new Settings()
        await this.settings.load()
    }

    async structure() {
        /**
         * /home/eggs/ovarium
         *           /pxe/config 
         *           /pxe/firmware cp /usr/lib/PXELINUX/pxelinux.0 /pxe/firmware
         *           /pxe/isos cp ../ovarium/live/vmlinuz .
         * 
         */

        this.pxeRoot = path.dirname(this.settings.work_dir.path) + '/pxe'
        if (fs.existsSync(this.pxeRoot)) {
            await exec(`rm ${this.pxeRoot} -rf`)
        }
        let cmd = `mkdir -p ${this.pxeRoot}`
        await this.tryCatch(cmd)

        this.pxeConfig = this.pxeRoot + this.pxeConfig
        if (!fs.existsSync(this.pxeConfig)) {
            await this.tryCatch(`mkdir -p ${this.pxeConfig}`)
        }

        this.pxeFirmware = this.pxeRoot + this.pxeFirmware
        if (!fs.existsSync(this.pxeFirmware)) {
            await this.tryCatch(`mkdir -p ${this.pxeFirmware}`)
            await this.tryCatch(`cp /usr/lib/PXELINUX/pxelinux.0 ${this.pxeFirmware}`)
            await this.tryCatch(`cp /usr/lib/PXELINUX/lpxelinux.0 ${this.pxeFirmware}`)
            await this.tryCatch(`cp /usr/lib/syslinux/modules/bios/ldlinux.c32 ${this.pxeFirmware}`)
            await this.tryCatch(`cp /usr/lib/syslinux/modules/bios/vesamenu.c32 ${this.pxeFirmware}`)
            await this.tryCatch(`cp /usr/lib/syslinux/modules/bios/libcom32.c32 ${this.pxeFirmware}`)
            await this.tryCatch(`cp /usr/lib/syslinux/modules/bios/libutil.c32 ${this.pxeFirmware}`)
            await this.tryCatch(`cp /home/eggs/ovarium/iso/isolinux/isolinux.theme.cfg ${this.pxeFirmware}`)
            await this.tryCatch(`cp /home/eggs/ovarium/iso/isolinux/splash.png ${this.pxeFirmware}`)

            await this.tryCatch(`mkdir ${this.pxeFirmware}/pxelinux.cfg`)
            let content = ``
            content +=`# eggs: pxelinux.cfg/default\n`
            content +=`# search path for the c32 support libraries (libcom32, libutil etc.)\n`
            content +=`path\n`
            content +=`include isolinux.theme.cfg\n`
            content +=`UI vesamenu.c32\n`
            content +=`PROMPT 0\n`
            content +=`TIMEOUT 0\n`
            content +=`MENU TITLE penguins-eggs\n`
            content +=`MENU DEFAULT iso\n`
            content +=`LABEL iso\n`
            content +=`    DEFAULT memdisk\n`
            content +=`    INITRD egg-of-debian-bullseye-colibri-amd64_2022-09-06_0318.iso\n`

            let file = `${this.pxeFirmware}/pxelinux.cfg/default`
            fs.writeFileSync(file, content)
            await this.tryCatch(`cp /usr/lib/syslinux/memdisk ${this.pxeFirmware}`)
            await this.tryCatch(`ln /home/eggs/egg-of-debian-bullseye-colibri-amd64_2022-09-06_0318.iso  /home/eggs/pxe/firmware/egg-of-debian-bullseye-colibri-amd64_2022-09-06_0318.iso`)
        }

        this.pxeIsos = this.pxeRoot + this.pxeIsos
        if (!fs.existsSync(this.pxeIsos)) {
            this.tryCatch(`mkdir -p ${this.pxeIsos}`)
            this.tryCatch(`cp /home/eggs/ovarium/iso/live/vmlinuz-5.10.0-16-amd64 ${this.pxeIsos}/vmlinuz`)
            this.tryCatch(`cp /home/eggs/ovarium/iso/live/initrd.img-5.10.0-16-amd64 ${this.pxeIsos}/initrd.img`)
        }
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
        content += `dhcp-boot=tag:bios-x86,firmware/lpxelinux.0\n\n`
        content += `# boot config for UEFI systems\n\n`
        content += `dhcp-match=set:efi-x86_64,option:client-arch,7\n\n`
        content += `dhcp-match=set:efi-x86_64,option:client-arch,9\n\n`
        //content += `dhcp-boot=tag:efi-x86_64,firmware/ipxe.efi\n\n`
        content += `dhcp-boot=tag:efi-x86_64,firmware/lpxelinux.0\n\n`

        let file = '/etc/dnsmasq.d/cuckoo.conf'
        fs.writeFileSync(file, content)

        await exec(`systemctl stop dnsmasq.service`)
        await exec(`rm /home/artisan/dnsmasq.log\n`)

        await exec(`systemctl start dnsmasq.service`)
        await exec(`systemctl status dnsmasq.service`)

        console.log(content)
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
