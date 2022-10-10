/**
 * penguins-eggs: pxe.ts
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 */
import fs from 'fs'
import nodeStatic from 'node-static'
import http, { IncomingMessage, ServerResponse } from 'http'
import path, { dirname } from 'node:path'
import Utils from './utils'
import Distro from './distro'
import Settings from './settings'
import { exec } from '../lib/utils'
const tftp = require('tftp')
const dhcpd = require('../dhcpd/dhcpd')
import { ITftpOptions, IDhcpOptions } from '../interfaces/i-pxe-options'

/**
* Pxe:
*/
export default class Pxe {
    verbose = false

    echo = {}
    settings = {} as Settings
    bootLabel = ''
    nest = '' // cuckoo's nest
    pxeRoot = ''
    eggRoot = ''
    vmlinuz = ''
    initrd = ''
    isos: string[] = []

    /**
     * fertilization()
     * 
     * cuckoo's nest
     */
    async fertilization() {
        this.settings = new Settings()
        await this.settings.load()

        if (Utils.isLive()) {
            this.eggRoot = this.settings.distro.liveMediumPath
        } else {
            this.eggRoot = path.dirname(this.settings.work_dir.path) + '/ovarium/iso/'
        }

        if (!Utils.isLive() && !fs.existsSync(this.settings.work_dir.path)) {
            console.log('no image available, build an image with: sudo eggs produce')
            process.exit()
        }

        this.nest = '/home/eggs'
        this.pxeRoot = this.nest + '/pxe'
        console.log('nest: ' + this.nest)
        console.log('pxeRoot: ' + this.pxeRoot)
        console.log('eggRoot: ' + this.eggRoot)

        /**
         * se pxeRoot non esiste viene creato
         */
        if (!fs.existsSync(this.pxeRoot)) {
            await exec(`mkdir ${this.pxeRoot} -p`)
        }

        /**
         * Ricerca delle uova
         */
        let isos: string[] = []
        if (!Utils.isLive()) {
            let isos = fs.readdirSync(this.nest)
            for (const iso of isos) {
                if (path.extname(iso) === ".iso") {
                    this.isos.push(iso)
                }
                this.isos = this.isos.sort()
            }
        }

        /**
         * installed: /home/eggs/ovarium/iso/live
         * live: this.iso/live
         */
        let pathFiles = this.eggRoot + '/live'
        let files = fs.readdirSync(pathFiles)
        for (const file of files) {
            if (this.settings.distro.familyId === 'debian') {
                if (path.basename(file).substring(0, 7) === 'vmlinuz') {
                    this.vmlinuz = path.basename(file)
                }
                if (path.basename(file).substring(0, 6) === 'initrd') {
                    this.initrd = path.basename(file)
                }
            } else if (this.settings.distro.familyId === 'archlinux') {

                if (path.basename(file).substring(0, 7) === 'vmlinuz') {
                    this.vmlinuz = path.basename(file)
                }
                if (path.basename(file) === 'initramfs-linux.img') {
                    this.initrd = path.basename(file)
                }
            }
        }

        /**
         * bootLabel
         */
        const a = fs.readFileSync(this.eggRoot + '/.disk/mkisofs', "utf-8")
        const b = a.substring(a.indexOf('-o ') + 3)
        const c = b.substring(0, b.indexOf(' '))
        this.bootLabel = c.substring(c.lastIndexOf('/') + 1)

        console.log(this.bootLabel)
        console.log(this.vmlinuz)
        console.log(this.initrd)
    }


    /**
     * build
     */
    async build() {

        if (fs.existsSync(this.pxeRoot)) {
            await this.tryCatch(`rm ${this.pxeRoot} -rf`)
        }
        await this.tryCatch(`mkdir ${this.pxeRoot} -p`)

        await this.tryCatch(`mkdir ${this.pxeRoot} -p`)
        await this.tryCatch(`ln -s ${this.eggRoot}/live ${this.pxeRoot}/live`)
        await this.tryCatch(`ln -s ${this.nest}.disk ${this.pxeRoot}/.disk`)

        if (fs.existsSync(this.eggRoot)) {
            await this.tryCatch(`cp ${this.eggRoot}live/${this.vmlinuz} ${this.pxeRoot}/vmlinuz`)
            await this.tryCatch(`chmod 777 ${this.pxeRoot}/vmlinuz`)
            await this.tryCatch(`cp ${this.eggRoot}live/${this.initrd} ${this.pxeRoot}/initrd`)
            await this.tryCatch(`chmod 777 ${this.pxeRoot}/initrd`)
        }


        // link iso images in pxe
        for (const iso of this.isos) {
            await this.tryCatch(`ln -s ${this.nest}/${iso} ${this.pxeRoot}/${iso}`)
        }
        await this.bios()
        await this.ipxe()
        await this.http()
    }


    /**
     * configure PXE bios
     */
    async bios() {
        console.log('creating cuckoo configuration pxe: BIOS')

        await this.tryCatch(`cp ${__dirname}/../../addons/eggs/theme/livecd/isolinux.theme.cfg ${this.pxeRoot}/isolinux.theme.cfg`)
        await this.tryCatch(`cp ${__dirname}/../../addons/eggs/theme/livecd/splash.png ${this.pxeRoot}/splash.png`)

        /**
         * ipxe.efi
         */
        await this.tryCatch(`ln -s ${__dirname}/../../ipxe/ipxe.efi ${this.pxeRoot}/ipxe.efi`)

        // pxe
        const distro = new Distro()

        await this.tryCatch(`ln -s ${distro.pxelinuxPath}pxelinux.0 ${this.pxeRoot}/pxelinux.0`)
        await this.tryCatch(`ln -s ${distro.pxelinuxPath}lpxelinux.0 ${this.pxeRoot}/lpxelinux.0`)

        // syslinux
        await this.tryCatch(`ln -s ${distro.syslinuxPath}ldlinux.c32 ${this.pxeRoot}/ldlinux.c32`)
        await this.tryCatch(`ln -s ${distro.syslinuxPath}vesamenu.c32 ${this.pxeRoot}/vesamenu.c32`)
        await this.tryCatch(`ln -s ${distro.syslinuxPath}libcom32.c32 ${this.pxeRoot}/libcom32.c32`)
        await this.tryCatch(`ln -s ${distro.syslinuxPath}libutil.c32 ${this.pxeRoot}/libutil.c32`)
        await this.tryCatch(`ln -s ${distro.memdiskPath}memdisk ${this.pxeRoot}/memdisk`)
        await this.tryCatch(`mkdir ${this.pxeRoot}/pxelinux.cfg`)

        let content = ``
        content += `# eggs: pxelinux.cfg/default\n`
        content += `# search path for the c32 support libraries (libcom32, libutil etc.)\n`
        content += `path\n`
        content += `include isolinux.theme.cfg\n`
        content += `UI vesamenu.c32\n`
        content += `\n`
        content += `menu title cuckoo: when you need a flying PXE server! ${Utils.address()}\n`
        content += `PROMPT 0\n`
        content += `TIMEOUT 0\n`
        content += `\n`
        content += `label egg\n`
        content += `menu label ${this.bootLabel}\n`
        let clid = this.settings.distro.codenameLikeId
        if (clid === 'bionic' || clid === 'stretch' || clid === 'jessie') {
            content += `kernel vmlinuz\n`
            content += `append initrd=initrd boot=live config noswap noprompt fetch=http://${Utils.address()}/live/filesystem.squashfs\n`
        } else {
            content += `kernel http://${Utils.address()}/vmlinuz\n`
            content += `append initrd=http://${Utils.address()}/initrd boot=live config noswap noprompt fetch=http://${Utils.address()}/live/filesystem.squashfs\n`
        }
        content += `SYSAPPEND 3\n`
        content += `\n`

        /*
        if (this.isos.length > 0) {
            for (const iso of this.isos) {
                content += `\n`
                content += `label ${iso}\n`
                content += `menu label ${iso}\n`
                content += `kernel http://${Utils.address()}/memdisk\n`
                content += `initrd http://${Utils.address()}/${iso}\n`
                content += `append  iso raw\n`
            }
        }
        */
        let file = `${this.pxeRoot}/pxelinux.cfg/default`
        fs.writeFileSync(file, content)
    }

    /**
    * 
    */
    async ipxe() {
        console.log('creating cuckoo configuration pxe: UEFI')

        let content = "#!ipxe\n"
        if (this.isos.length > 0) {
            content += `dhcp\n`
            content += `set net0/ip=dhcp\n`
            content += `console --picture http://${Utils.address()}/splash.png -x 1024 -y 768\n`
            content += "goto start ||\n"
            content += "\n"
            content += ':start\n'
            content += `set server_root http://${Utils.address()}:80/\n`
            const serverRootVars = '${server_root}'
            content += `menu cuckoo: when you need a flying PXE server! ${Utils.address()}\n`
            content += 'item --gap boot from ovarium\n'
            content += `item egg      ${this.bootLabel}\n`

            /*
            content += 'item --gap boot iso images\n'
            for (const iso of this.isos) {
                const menu = iso.replace('.iso', '')
                const label = menu
                content += `item ${menu}      ${label}\n`
            }
            */
            content += 'item --gap boot from internet\n'
            content += `item netboot     netboot\n`
            // content += `item salstar     salstar\n`

            content += 'choose target || goto start\n'
            content += 'goto ${target}\n'
            content += '\n'

            content += `:egg\n`
            content += `kernel http://${Utils.address()}/vmlinuz\n`
            content += `initrd http://${Utils.address()}/initrd \n`
            content += `imgargs vmlinuz boot=live config noswap noprompt fetch=http://${Utils.address()}/live/filesystem.squashfs SYSAPPEND 3\n`
            content += `boot || goto start\n\n`

            /*
            for (const iso of this.isos) {
                const menu = iso.replace('.iso', '')
                content += `:${menu}\n`
                content += `sanboot ${serverRootVars}/${iso}\n`
                // content += `kernel ${serverRootVars}bullseye/vmlinuz\n`
                // content += `initrd ${serverRootVars}bullseye/initrd\n`
                // content += `imgargs vmlinuz initrd=initrd root=/dev/ram0 ip=dhcp ramdisk_size=4194304 url=${serverRootVars}${iso} locale=en_US ro syslinux=3\n`
                content += `boot || goto start\n\n`
            }
            */

            /**
             * netboot.xyz
             */
            content += `:netboot\n`
            content += `ifopen net0\n`
            content += `set conn_type https\n`
            content += `chain --autofree https://boot.netboot.xyz/menu.ipxe || echo HTTPS failed... attempting HTTP...\n`
            content += `set conn_type http\n`
            content += `chain --autofree http://boot.netboot.xyz/menu.ipxe || echo HTTP failed, localbooting...\n`
            content += `goto start\n\n`

            /*
            content += `:salstar\n`
            content += `ifopen net0\n`
            content += `set conn_type https\n`
            content += `chain --autofree https://boot.salstar.sk/menu.ipxe || echo HTTPS failed... attempting HTTP...\n`
            content += `set conn_type http\n`
            content += `chain --autofree http://boot.salstar.sk/menu.ipxe || echo HTTP failed, localbooting...\n`
            content += `goto start\n\n`
            */
        }
        let file = `${this.pxeRoot}/autoexec.ipxe`
        fs.writeFileSync(file, content)
    }



    /**
     * configure PXE http server
     */
    async http() {
        console.log('creating cuckoo configuration: PXE html')

        let file = `${this.pxeRoot}/index.html`
        let content = ``
        content += `<html><title>Penguin's eggs PXE server</title>`
        content += `<div style="background-image:url('/splash.png');background-repeat:no-repeat;width: 640;height:480;padding:5px;border:1px solid black;">`
        content += `<h1>Cucko PXE server</h1>`
        content += `<body>address: <a href=http://${Utils.address()}>${Utils.address()}</a><br/>`
        if (!Utils.isLive()) {
            content += `Serving:<li>`
            for (const iso of this.isos) {
                content += `<ul><a href='http://${Utils.address()}/${iso}'>${iso}</a></ul>`
            }
            content += `</li>`
        } else {
            content += `started from live iso image<br/>`
        }
        content += `source: <a href='https://github.com/pieroproietti/penguins-eggs'>https://github.com/pieroproietti/penguins-eggs</a><br/>`
        content += `manual: <a href='https://penguins-eggs.net/book/italiano9.2.html'>italiano</a>, <a href='https://penguins--eggs-net.translate.goog/book/italiano9.2?_x_tr_sl=auto&_x_tr_tl=en&_x_tr_hl=en'>translated</a><br/>`
        content += `discuss: <a href='https://t.me/penguins_eggs'>Telegram group<br/></body</html>`
        fs.writeFileSync(file, content)
    }

    /**
     * 
     * @param dhcpOptions 
     */
    dhcpStart(dhcpOptions: IDhcpOptions) {
        let dhcpdProxy = new dhcpd(dhcpOptions)
    }

    /**
    * start http server for images
    * 
    */
    async httpStart() {
        const port = 80
        const httpRoot = this.pxeRoot + "/"
        console.log(`http listening: 0.0.0.0:` + port)

        var file = new (nodeStatic.Server)(httpRoot)
        http.createServer(function (req: IncomingMessage, res: ServerResponse) {
            file.serve(req, res)
        }).listen(port)
    }


    /**
     * start tftp
     */
    async tftpStart(tftpOptions: ITftpOptions) {
        let tftpServer = tftp.createServer(tftpOptions)

        tftpServer.on("error", function (error: any) {
            // Errors from the main socket 
            // The current transfers are not aborted 
            console.error(error)
        })

        tftpServer.on("request", function (req: any, res: any) {
            req.on("error", function (error: any) {
                //Error from the request 
                //The connection is already closed 
                console.error("[" + req.stats.remoteAddress + ":" + req.stats.remotePort + "] (" + req.file + ") " + error.message)
            })
        })

        tftpServer.listen()
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
