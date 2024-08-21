/**
 * ./src/classes/pxe.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import fs from 'node:fs'
import http, { IncomingMessage, ServerResponse } from 'node:http'
import path, { dirname } from 'node:path'
import { dhcpd } from 'node-proxy-dhcpd'
import nodeStatic from 'node-static'
// @ts-ignore
import tftp from 'tftp'

import { IDhcpOptions, ITftpOptions } from '../interfaces/i-pxe.js'
import { exec } from '../lib/utils.js'
import Distro from './distro.js'
import Settings from './settings.js'
import Utils from './utils.js'

// _dirname
const __dirname = path.dirname(new URL(import.meta.url).pathname)

/**
 * Pxe:
 */
export default class Pxe {
  bootLabel = ''

  echo = {}
  eggRoot = ''
  initrdImg = ''
  isos: string[] = [] // cuckoo's eggs
  nest = ''
  pxeRoot = ''
  settings = {} as Settings
  verbose = false
  vmlinuz = ''

  /**
   * constructor
   * @param nest
   * @param pxeRoot
   */
  constructor(nest = '', pxeRoot = '') {
    this.nest = nest
    this.pxeRoot = pxeRoot
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
    await this.tryCatch(`ln -s ${this.eggRoot}live ${this.pxeRoot}/live`)
    await this.tryCatch(`ln -s ${this.nest}.disk ${this.pxeRoot}/.disk`)

    if (this.settings.distro.distroId === 'ManjaroLinux') {
      await this.tryCatch(`ln -s ${this.eggRoot}manjaro ${this.pxeRoot}/manjaro`)
    } else if (this.settings.distro.distroId === 'Arch' || this.settings.distro.distroId === 'RebornOS') {
      await this.tryCatch(`ln -s ${this.eggRoot}arch ${this.pxeRoot}/arch`)
    }

    if (fs.existsSync(this.eggRoot)) {
      await this.tryCatch(`cp ${this.eggRoot}live/${this.vmlinuz} ${this.pxeRoot}/vmlinuz`, true)
      await this.tryCatch(`chmod 777 ${this.pxeRoot}/vmlinuz`)
      await this.tryCatch(`cp ${this.eggRoot}live/${this.initrdImg} ${this.pxeRoot}/initrd`, true)
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
   *
   * @param dhcpOptions
   */
  dhcpStart(dhcpOptions: IDhcpOptions) {
    new dhcpd(dhcpOptions)
  }

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
      if (
        // ArchisoCompatibles
        this.settings.distro.distroId === 'Arch' ||
        this.settings.distro.distroId === 'ArcoLinux' ||
        this.settings.distro.distroId === 'blendOS' ||
        this.settings.distro.distroId === 'EndeavourOS' ||
        this.settings.distro.distroId === 'Garuda' ||
        this.settings.distro.distroId === 'phyOS' ||
        this.settings.distro.distroId === 'RebornOS'
      ) {
        this.eggRoot = '/run/archiso/bootmnt/'
        await exec(`mkdir ${this.eggRoot} -p`)
        await exec(`mount /dev/sr0 ${this.eggRoot}`)
      }
    } else {
      this.eggRoot = this.settings.config.snapshot_mnt + 'iso/'
    }

    if (!Utils.isLive() && !fs.existsSync(this.settings.config.snapshot_mnt)) {
      console.log('no image available, build an image with: sudo eggs produce')
      process.exit()
    }

    const settings = new Settings()
    settings.load()

    /**
     * se pxeRoot non esiste viene creato
     */
    if (!fs.existsSync(this.pxeRoot)) {
      await exec(`mkdir ${this.pxeRoot} -p`)
    }

    /**
     * Ricerca delle ISOs
     */
    const isos: string[] = []

    /*
    if (!Utils.isLive()) {
      const isos = fs.readdirSync(this.nest)
      for (const iso of isos) {
        if (path.extname(iso) === '.iso') {
          this.isos.push(iso)
        }
 
        this.isos = this.isos.sort()
      }
    }
    */

    /**
     * installed: /home/eggs/.mnt/iso/live
     * live: this.iso/live
     */
    const pathFiles = this.eggRoot + 'live'
    const files = fs.readdirSync(pathFiles)
    for (const file of files) {
      if (this.settings.distro.familyId === 'debian') {
        if (path.basename(file).slice(0, 7) === 'vmlinuz') {
          this.vmlinuz = path.basename(file)
        }

        if (path.basename(file).slice(0, 6) === 'initrd') {
          this.initrdImg = path.basename(file)
        }
      } else if (this.settings.distro.familyId === 'archlinux') {
        if (path.basename(file).slice(0, 7) === 'vmlinuz') {
          this.vmlinuz = path.basename(file)
        }

        if (path.basename(file).slice(0, 9) === 'initramfs') {
          this.initrdImg = path.basename(file)
        }
      }
    }

    /**
     * bootLabel
     */
    this.bootLabel = 'not found'
    if (fs.existsSync(this.eggRoot + '/.disk/mkisofs')) {
      const a = fs.readFileSync(this.eggRoot + '/.disk/mkisofs', 'utf8')
      const b = a.slice(Math.max(0, a.indexOf('-o ') + 3))
      const c = b.slice(0, Math.max(0, b.indexOf(' ')))
      this.bootLabel = c.slice(Math.max(0, c.lastIndexOf('/') + 1))
    }

    console.log(`bootLabel: ${this.bootLabel}`)
    console.log(`vmlinuz: ${this.vmlinuz}`)
    console.log(`initrd: ${this.initrdImg}`)
  }

  /**
   * start http server for images
   *
   */
  async httpStart() {
    const port = 80
    const httpRoot = this.pxeRoot + '/'
    console.log('http root: ' + httpRoot)
    console.log('http listening: 0.0.0.0:' + port)
    // const file = new nodeStatic.Server(httpRoot, { followSymlinks: true })
    const file = new nodeStatic.Server(httpRoot)
    http
      .createServer((req: IncomingMessage, res: ServerResponse) => {
        file.serve(req, res)
      })
      .listen(port)
  }

  /**
   * start tftp
   */
  async tftpStart(tftpOptions: ITftpOptions) {
    const tftpServer = tftp.createServer(tftpOptions)
    console.log('tftp listening: ' + tftpOptions.host + ':' + tftpOptions.port)

    tftpServer.on('error', (error: any) => {
      // Errors from the main socket
      // The current transfers are not aborted
      console.error(error)
    })

    tftpServer.on('request', (req: any, res: any) => {
      req.on('error', (error: any) => {
        // Error from the request
        // The connection is already closed
        console.error('[' + req.stats.remoteAddress + ':' + req.stats.remotePort + '] (' + req.file + ') ' + error.message)
      })
    })

    tftpServer.listen()
  }

  /**
   * Il resto PRIVATO
   */

  /**
   * configure PXE bios
   */
  private async bios() {
    console.log('creating cuckoo configuration: BIOS')

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

    let content = ''
    content += '# eggs: pxelinux.cfg/default\n'
    content += '# search path for the c32 support libraries (libcom32, libutil etc.)\n'
    content += 'path\n'
    content += 'include isolinux.theme.cfg\n'
    content += 'UI vesamenu.c32\n'
    content += '\n'
    content += `menu title cuckoo: when you need a flying PXE server! ${Utils.address()}\n`
    content += 'PROMPT 0\n'
    content += 'TIMEOUT 200\n'
    content += '\n'
    content += 'label egg\n'
    content += `menu label ${this.bootLabel.replace('.iso', '')}\n`
    if (this.settings.distro.familyId === 'debian') {
      /**
       * DEBIAN
       */
      const clid = this.settings.distro.codenameLikeId
      if (clid === 'bionic' || clid === 'stretch' || clid === 'jessie') {
        content += 'kernel vmlinuz\n'
        content += `append initrd=initrd boot=live config noswap noprompt fetch=http://${Utils.address()}/live/filesystem.squashfs\n`
      } else {
        content += `kernel http://${Utils.address()}/vmlinuz\n`
        content += `append initrd=http://${Utils.address()}/initrd boot=live config noswap noprompt fetch=http://${Utils.address()}/live/filesystem.squashfs\n`
      }
    } else if (distro.familyId === 'archlinux') {
      /**
       * ARCH LINUX
       */
      let tool = 'archiso'
      if (distro.distroId === 'ManjaroLinux') {
        tool = 'miso'
      }

      content += `kernel http://${Utils.address()}/vmlinuz\n`
      content += `append initrd=http://${Utils.address()}/initrd boot=live config noswap noprompt ${tool}_http_srv=http://${Utils.address()}/\n`
      content += 'sysappend 3\n'
      content += '\n'
    }

    if (this.isos.length > 0) {
      content += 'menu separator\n'
      for (const iso of this.isos) {
        content += '\n'
        content += `label ${iso}\n`
        content += `menu label ${iso}\n`
        content += `kernel http://${Utils.address()}/memdisk\n`
        content += `initrd http://${Utils.address()}/${iso}\n`
        content += 'append iso raw sysappend 3\n'
      }
    }

    const file = `${this.pxeRoot}/pxelinux.cfg/default`
    fs.writeFileSync(file, content)
  }

  /**
   * configure PXE http server
   */
  private async http() {
    console.log('creating cuckoo configuration: html')

    const file = `${this.pxeRoot}/index.html`
    let content = ''
    content += "<html><title>Penguin's eggs PXE server</title>"
    content += '<div style="background-image:url(\'/splash.png\');background-repeat:no-repeat;width: 640;height:480;padding:5px;border:1px solid black;">'
    content += '<h1>Cuckoo PXE server</h1>'
    content += `<body>address: <a href=http://${Utils.address()}>${Utils.address()}</a><br/>`
    if (Utils.isLive()) {
      content += 'started from live iso image<br/>'
    } else {
      content += 'Serving:<li>'
      for (const iso of this.isos) {
        content += `<ul><a href='http://${Utils.address()}/${iso}'>${iso}</a></ul>`
      }

      content += '</li>'
    }

    content += "source: <a href='https://github.com/pieroproietti/penguins-eggs'>https://github.com/pieroproietti/penguins-eggs</a><br/>"
    content += "manual: <a href='https://penguins-eggs.net/book/italiano9.2.html'>italiano</a>, <a href='https://penguins--eggs-net.translate.goog/book/italiano9.2?_x_tr_sl=auto&_x_tr_tl=en&_x_tr_hl=en'>translated</a><br/>"
    content += "discuss: <a href='https://t.me/penguins_eggs'>Telegram group<br/></body</html>"
    fs.writeFileSync(file, content)
  }

  /**
   *
   */
  private async ipxe() {
    console.log('creating cuckoo configuration: UEFI')

    let content = '#!ipxe\n'
    content += 'dhcp\n'
    content += 'set net0/ip=dhcp\n'
    content += `console --picture http://${Utils.address()}/splash.png -x 1024 -y 768\n`
    content += 'goto start ||\n'
    content += '\n'
    content += ':start\n'
    content += `set server_root http://${Utils.address()}:80/\n`
    const serverRootVars = '${server_root}'
    content += `menu cuckoo: when you need a flying PXE server! ${Utils.address()}\n`
    content += 'item --gap boot from ovarium\n'
    content += `item egg-menu \${space} ${this.bootLabel.replaceAll('.iso', '')}\n\n`

    if (this.isos.length > 0) {
      content += 'item --gap boot iso images\n'
      for (const iso of this.isos) {
        const menu = iso
        const label = menu
        content += `item ${menu} \${space} ${label}\n\n`
      }
    }

    content += 'item --gap boot from internet\n'
    content += 'item netboot ${space} netboot\n'

    content += 'choose target || goto start\n'
    content += 'goto ${target}\n'
    content += '\n'

    content += ':egg-menu\n'
    content += `kernel http://${Utils.address()}/vmlinuz\n`
    content += `initrd http://${Utils.address()}/initrd\n`
    /**
     * CORRECT:
     * content += `imgargs vmlinuz fetch=http://${Utils.address()}/live/filesystem.squashfs boot=live dhcp initrd=initrd ro\n`
     */
    if (this.settings.distro.familyId === 'debian') {
      /**
       * DEBIAN
       */
      content += `imgargs vmlinuz fetch=http://${Utils.address()}/live/filesystem.squashfs boot=live dhcp initrd=initrd ro\n`
    } else if (this.settings.distro.familyId === 'archlinux') {
      /**
       * ARCH LINUX
       */
      let tool = 'archiso'
      if (this.settings.distro.codenameId === 'Qonos' || this.settings.distro.codenameId === 'Ruah' || this.settings.distro.codenameId === 'Sikaris' || this.settings.distro.codenameId === 'UltimaThule') {
        tool = 'miso'
      }

      content += `imgargs vmlinuz ${tool}_http_srv=http://${Utils.address()}/ boot=live dhcp initrd=initrd ro\n`
      // content += 'ipappend 3\n'
    }

    content += 'sleep 5\n'
    content += 'boot || goto start\n\n'

    if (this.isos.length > 0) {
      for (const iso of this.isos) {
        const menu = iso.replace('.iso', '')
        content += `:${menu}\n`
        content += `sanboot ${serverRootVars}/${iso}\n`
        content += 'boot || goto start\n\n'
      }
    }

    /**
     * netboot.xyz
     */
    content += ':netboot\n'
    content += 'ifopen net0\n'
    content += 'set conn_type https\n'
    content += 'chain --autofree https://boot.netboot.xyz/menu.ipxe || echo HTTPS failed... attempting HTTP...\n'
    content += 'set conn_type http\n'
    content += 'chain --autofree http://boot.netboot.xyz/menu.ipxe || echo HTTP failed, localbooting...\n'
    content += 'goto start\n\n'

    const file = `${this.pxeRoot}/autoexec.ipxe`
    fs.writeFileSync(file, content)
  }

  /**
   *
   * @param cmd
   */
  private async tryCatch(cmd = '', echo = false) {
    try {
      if (echo) {
        console.log(cmd)
      }

      await exec(cmd, this.echo)
    } catch (error) {
      console.log(`Error: ${error}`)
      await Utils.pressKeyToExit(cmd)
    }
  }
}
