/**
 * penguins-eggs: pxe.ts
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 */

import os from 'os'
import fs from 'fs'
import { Netmask } from 'netmask'
import nodeStatic from 'node-static'
import http, { IncomingMessage, ServerResponse } from 'http'
import path, { dirname } from 'node:path'

import Utils from '../classes/utils'
import Settings from '../classes/settings'
import { exec } from '../lib/utils'
import Distro from './distro'
import { throws } from 'assert'

/**
* Pxe:
*/
export default class Pxe {
    verbose = false

    echo = {}
    settings = {} as Settings
    bootLabel = ''
    pxeRoot = ''
    isoRoot = ''
    vmlinuz = ''
    initrd = ''
    isos: string[] = []

    /**
     * fertilization()
     */
    async fertilization() {
        this.settings = new Settings()
        await this.settings.load()
        if (Utils.isLive()) {
            this.isoRoot = this.settings.distro.liveMediumPath
        } else {
            this.isoRoot = path.dirname(this.settings.work_dir.path) + '/ovarium/iso/'
        }

        if (!Utils.isLive() && !fs.existsSync(this.settings.work_dir.path)) {
            console.log('no image available, build an image with: sudo eggs produce')
            process.exit()
        }

        /**
         * se pxeRoot non esiste viene creato
         */
        this.pxeRoot = path.dirname(this.settings.work_dir.path) + '/pxe/'
        if (!fs.existsSync(this.pxeRoot)) {
            await exec(`mkdir ${this.pxeRoot} -p`)
        }

        /**
         * Ricerca delle immagini ISO
         */
        let isos: string[] = []
        if (!Utils.isLive()) {
            let isos = fs.readdirSync(path.dirname(this.settings.work_dir.path))
            for (const iso of isos) {
                if (path.extname(iso) === ".iso") {
                    this.isos.push(iso)
                }
            }
        }

        /**
         * installed: /home/eggs/ovarium/iso/live
         * live: this.iso/live
         */
        let pathFiles = this.isoRoot + '/live'
        let files = fs.readdirSync(pathFiles)
        for (const file of files) {
            if (path.basename(file).substring(0, 7) === 'vmlinuz') {
                this.vmlinuz = path.basename(file)
            }
            if (path.basename(file).substring(0, 6) === 'initrd') {
                this.initrd = path.basename(file)
            }
        }

        /**
         * bootLabel
         */
        const a = fs.readFileSync(this.isoRoot + '/.disk/mkisofs', "utf-8")
        const b = a.substring(a.indexOf('-o ') + 3)
        const c = b.substring(0, b.indexOf(' '))
        this.bootLabel = c.substring(c.lastIndexOf('/') + 1)
    }



    /**
     * build
     */
    async build() {

        if (fs.existsSync(this.pxeRoot)) {
            await this.tryCatch(`rm ${this.pxeRoot} -rf`)
        }
        let cmd = `mkdir -p ${this.pxeRoot}`
        await this.tryCatch(cmd)

        await this.tryCatch(`mkdir ${this.pxeRoot} -p`)
        await this.tryCatch(`ln -s ${this.isoRoot}live ${this.pxeRoot}/live`)
        await this.tryCatch(`ln -s ${this.isoRoot}.disk ${this.pxeRoot}/.disk`)

        // Qua copio vmlinuz e initrd per renderli scrivibili
        await this.tryCatch(`cp ${this.isoRoot}live/${this.vmlinuz} ${this.pxeRoot}/vmlinuz`)
        await this.tryCatch(`chmod 777 ${this.pxeRoot}/vmlinuz`)
        await this.tryCatch(`cp ${this.isoRoot}live/${this.initrd} ${this.pxeRoot}/initrd`)
        await this.tryCatch(`chmod 777 ${this.pxeRoot}/initrd`)

        // link iso images in pxe
        for (const iso of this.isos) {
            await this.tryCatch(`ln /home/eggs/${iso} ${this.pxeRoot}/${iso}`)
        }
        await this.bios()
        await this.uefi()
        await this.html()
    }

    /**
     * configure PXE bios
     */
     async bios() {

        // isolinux.theme.cfg, splash.png MUST to be on root
        await this.tryCatch(`ln -s ${this.isoRoot}isolinux/isolinux.theme.cfg ${this.pxeRoot}/isolinux.theme.cfg`)
        await this.tryCatch(`ln -s ${this.isoRoot}isolinux/splash.png ${this.pxeRoot}/splash.png`)

        // pxe
        const distro = this.settings.distro
        await this.tryCatch(`ln ${distro.pxelinuxPath}pxelinux.0 ${this.pxeRoot}/pxelinux.0`)
        await this.tryCatch(`ln ${distro.pxelinuxPath}lpxelinux.0 ${this.pxeRoot}/lpxelinux.0`)

        // syslinux
        await this.tryCatch(`ln ${distro.syslinuxPath}ldlinux.c32 ${this.pxeRoot}/ldlinux.c32`)
        await this.tryCatch(`ln ${distro.syslinuxPath}vesamenu.c32 ${this.pxeRoot}/vesamenu.c32`)
        await this.tryCatch(`ln ${distro.syslinuxPath}libcom32.c32 ${this.pxeRoot}/libcom32.c32`)
        await this.tryCatch(`ln ${distro.syslinuxPath}libutil.c32 ${this.pxeRoot}/libutil.c32`)
        await this.tryCatch(`ln /usr/lib/syslinux/memdisk ${this.pxeRoot}/memdisk`)
        await this.tryCatch(`mkdir ${this.pxeRoot}/pxelinux.cfg`)

        let content = ``
        content += `# eggs: pxelinux.cfg/default\n`
        content += `# search path for the c32 support libraries (libcom32, libutil etc.)\n`
        content += `path\n`
        content += `include isolinux.theme.cfg\n`
        content += `UI vesamenu.c32\n`
        content += `\n`
        content += `menu title Penguin's eggs - Perri's brewery edition - ${Utils.address()}\n`
        content += `PROMPT 0\n`
        content += `TIMEOUT 0\n`
        content += `\n`

        content += `LABEL http\n`
        content += `MENU LABEL ${this.bootLabel}\n`
        content += `MENU DEFAULT\n`
        let clid = this.settings.distro.codenameLikeId
        if ( clid === 'bionic' || clid === 'stretch' || clid === 'jessie') {
            content += `KERNEL vmlinuz\n`
            content += `APPEND initrd=initrd boot=live config noswap noprompt fetch=http://${Utils.address()}/live/filesystem.squashfs\n`
        } else {
            content += `KERNEL http://${Utils.address()}/vmlinuz\n`
            content += `APPEND initrd=http://${Utils.address()}/initrd boot=live config noswap noprompt fetch=http://${Utils.address()}/live/filesystem.squashfs\n`
        }
        content += `SYSAPPEND 3\n`
        content += `\n`

        if (this.isos.length > 0) {
            content += `MENU SEPARATOR\n`
            for (const iso of this.isos) {
                content += `\n`
                content += `LABEL isos\n`
                content += `MENU LABEL memdisk ${iso}\n`
                content += `KERNEL memdisk\n`
                content += `APPEND iso initrd=http://${Utils.address()}/${iso}\n`
            }
        }
        let file = `${this.pxeRoot}/pxelinux.cfg/default`
        fs.writeFileSync(file, content)
    }

    /**
     * configure PXE UEFI
     */
         async uefi() {
            await this.tryCatch(`mkdir ${this.pxeRoot}/grub`)
            if (fs.existsSync('/usr/share/grub/unicode.pf2')) {
                await this.tryCatch(`ln -s /usr/share/grub/unicode.pf2 ${this.pxeRoot}grub/font.pf2`)
            }
    
            // Copia spash.png, theme.cfg in /grub
            await this.tryCatch(`ln -s ${this.isoRoot}boot/grub/splash.png ${this.pxeRoot}/grub/splash.png`)
            await this.tryCatch(`ln -s ${this.isoRoot}boot/grub/theme.cfg ${this.pxeRoot}/grub/theme.cfg`)
    
            // UEFI:                   /usr/lib/shim/shimx64.efi.signed
            await this.tryCatch(`ln -s /usr/lib/shim/shimx64.efi.signed ${this.pxeRoot}/bootx64.efi`)
            // UEFI:                   /usr/lib/grub/x86_64-efi-signed/grubnetx64.efi.signed
            await this.tryCatch(`ln -s /usr/lib/grub/x86_64-efi-signed/grubnetx64.efi.signed ${this.pxeRoot}/grubx64.efi`)
    
            /**
             * creating /grub/grub.cfg
             */
            let grubContent = ''
            grubContent += `set default="0"\n`
            grubContent += `set timeout=-1\n`
            grubContent += `\n`
            grubContent += `if loadfont unicode ; then\n`
            grubContent += `  set gfxmode=auto\n`
            grubContent += `  set locale_dir=$prefix/locale\n`
            grubContent += `  set lang=en_US\n`
            grubContent += `fi\n`
            grubContent += `terminal_output gfxterm\n`
            grubContent += `\n`
            grubContent += `set menu_color_normal=white/black\n`
            grubContent += `set menu_color_highlight=black/light-gray\n`
            grubContent += `if background_color 44,0,30; then\n`
            grubContent += `  clear\n`
            grubContent += `fi\n`
            grubContent += `\n`
            grubContent += `function gfxmode {\n`
            grubContent += `\n`
            grubContent += `  set gfxpayload="${1}"\n`
            grubContent += `  if [ "${1}" = "keep" ]; then\n`
            grubContent += `    set vt_handoff=vt.handoff=7\n`
            grubContent += `  else\n`
            grubContent += `    set vt_handoff=\n`
            grubContent += `  fi\n`
            grubContent += `}\n`
            grubContent += `set linux_gfx_mode=keep\n`
            grubContent += `\n`
            grubContent += `export linux_gfx_mode\n`
            grubContent += `\n`
    
            grubContent += `if loadfont $prefix/font.pf2 ; then\n`
            grubContent += `  set gfxmode=640x480\n`
            grubContent += `  insmod efi_gop\n`
            grubContent += `  insmod efi_uga\n`
            grubContent += `  insmod video_bochs\n`
            grubContent += `  insmod video_cirrus\n`
            grubContent += `  insmod gfxterm\n`
            grubContent += `  insmod jpeg\n`
            grubContent += `  insmod png\n`
            grubContent += `  terminal_output gfxterm\n`
            grubContent += `fi\n`
            grubContent += `set theme=/grub/theme.cfg\n`
 
           
            grubContent += `menuentry '${this.bootLabel}' {\n`
            grubContent += `  gfxmode $linux_gfx_mode\n`
            grubContent += `  linuxefi vmlinuz boot=live config noswap noprompt fetch=http://${Utils.address()}/live/filesystem.squashfs quiet splash sysappend 0x40000\n`
            grubContent += `  initrdefi initrd\n`
    
            grubContent += `}\n`
            let grubFile = `${this.pxeRoot}grub/grub.cfg`
            fs.writeFileSync(grubFile, grubContent)
    
        }
    
    /**
     * configure PXE html
     */
    async html() {

        let file = `${this.pxeRoot}/index.html`
        let content = ``
        content += `<html><title>Penguin's eggs PXE server</title>`
        content += `<div style="background-image:url('/splash.png');background-repeat:no-repeat;width: 640;height:480;padding:5px;border:1px solid black;">`
        content += `<h1>Penguin's eggs PXE server</h1>`
        content += `<body>address: <a href=http://${Utils.address()}>${Utils.address()}</a><br/>`
        if (!Utils.isLive()) {
            content += `download: <a href='http://${Utils.address()}/${this.isos[0]}'>${this.isos[0]}</a><br/>`
        } else {
            content += `started from live iso image<br/>`
        }
        content += `<br/>`
        content += `source: <a href='https://github.com/pieroproietti/penguins-eggs'>https://github.com/pieroproietti/penguins-eggs</a><br/>`
        content += `manual: <a href='https://penguins-eggs.net/book/italiano9.2.html'>italiano</a>, <a href='https://penguins--eggs-net.translate.goog/book/italiano9.2?_x_tr_sl=auto&_x_tr_tl=en&_x_tr_hl=en'>translated</a><br/>`
        content += `discuss: <a href='https://t.me/penguins_eggs'>Telegram group<br/></body</html>`
        fs.writeFileSync(file, content)
    }

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //
    // dncp: actually install and configure dnsmaq
    //
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    /**
     * 
     * @param real 
     */
    async dhcp(real = false, dnsmasq = true) {
        if (dnsmasq) {
            await this.dnsmasq(real)
        } else {
            await this.nodeDhcp(real)
        }
    }

    /**
     * 
     */
    private async nodeDhcp(real = false) {
        console.log('to do!')
        process.exit()
    }


    /**
     * 
     * @param real 
     */
    private async dnsmasq(real = false) {

        if (Utils.isSystemd()) {
            await exec(`systemctl stop dnsmasq.service`)
        } else {
            await exec(`service dnsmasq stop`)
        }

        let domain = `penguins-eggs.lan`
        let n = new Netmask(`${Utils.address()}/${Utils.netmask()}`)

        let content = ``
        content += `# cuckoo.conf\n`
        content += `port=0\n`
        content += `interface=${await Utils.iface()}\n`
        content += `bind-interfaces\n`
        content += `domain=${domain}\n`
        content += `dhcp-no-override\n`
        content += `dhcp-option=option:router,${n.first}\n`
        content += `dhcp-option=option:dns-server,${n.first}\n`
        content += `dhcp-option=option:dns-server,8.8.8.8\n`
        content += `dhcp-option=option:dns-server,8.8.4.4\n`
        content += `enable-tftp\n`
        content += `tftp-root=${this.pxeRoot}\n`
        content += `# boot config for BIOS\n`
        content += `dhcp-match=set:bios-x86,option:client-arch,0\n`
        content += `dhcp-boot=tag:bios-x86,lpxelinux.0\n`
        content += `# boot config for UEFI\n`
        content += `dhcp-match=set:efi-x86_64,option:client-arch,7\n`
        content += `dhcp-match=set:efi-x86_64,option:client-arch,9\n`
        content += `dhcp-boot=tag:efi-x86_64,/bootx64.efi\n`
        // Here we are OK Starting grub

        /**
         * https://thekelleys.org.uk/dnsmasq/CHANGELOG
         * 
         * Don't do any PXE processing, even for clients with the 
         * correct vendorclass, unless at least one pxe-prompt or 
         * pxe-service option is given. This stops dnsmasq 
         * interfering with proxy PXE subsystems when it is just 
         * the DHCP server. Thanks to Spencer Clark for spotting this.
         */
        content += `pxe-service=X86PC,"penguin's eggs cuckoo",pxelinux.0\n`

        if (real) {
            content += `dhcp-range=${await Utils.iface()},${n.first},${n.last},${n.mask},8h\n`
        } else {
            content += `dhcp-range=${await Utils.iface()},${n.base},proxy,${n.mask},${n.broadcast} # dhcp proxy\n`
        }

        let file = '/etc/dnsmasq.d/cuckoo.conf'
        fs.writeFileSync(file, content)

        // console.log(content)
        if (Utils.isSystemd()) {
            await exec(`systemctl start dnsmasq.service`)
        } else {
            await exec(`service dnsmasq start`)
        }
    }

    /**
     * start http server for images
     * 
     */
    async httpStart() {
        const port = 80
        const httpRoot = this.pxeRoot + "/"

        var file = new (nodeStatic.Server)(httpRoot)
        http.createServer(function (req: IncomingMessage, res: ServerResponse) {
            file.serve(req, res)
        }).listen(port)
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
