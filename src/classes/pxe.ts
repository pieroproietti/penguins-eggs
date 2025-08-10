/**
 * ./src/classes/pxe.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import fs from 'node:fs'
import path, { dirname } from 'node:path'
import { startSimpleProxy } from '../dhcpd-proxy/simple-proxy.js'
import { IDhcpOptions, ITftpOptions } from '../dhcpd-proxy/interfaces/i-pxe.js'
import express from 'express';
// @ts-ignore
import tftp from 'tftp'
import { exec } from '../lib/utils.js'
import Distro from './distro.js'
import Settings from './settings.js'
import Utils from './utils.js'
import Diversions from './diversions.js'

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
  distro = {} as Distro
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
   * fertilization()
   *
   * cuckoo's nest
   */
  async fertilization() {
    this.settings = new Settings()
    this.settings.load()

    this.distro = new Distro()

    if (Utils.isLive()) {
      this.eggRoot = this.distro.liveMediumPath
    } else {
      this.eggRoot = this.settings.config.snapshot_mnt + 'iso/'
    }

    if (!Utils.isLive() && !fs.existsSync(this.settings.config.snapshot_mnt)) {
      console.log('no image available, build an image with: sudo eggs produce')
      process.exit()
    }

    /**
     * se pxeRoot non esiste viene creato
     */
    if (!fs.existsSync(this.pxeRoot)) {
      await exec(`mkdir ${this.pxeRoot} -p`)
    }

    /**
     * Ricerca delle ISOs
     * installed: /home/eggs/.mnt/iso/live
     * live: this.iso/live
     */
    const isos: string[] = []
    const pathFiles = this.eggRoot + 'live'
    const files = fs.readdirSync(pathFiles)

    // rieva nome vmlinuz e initrdImg
    for (const file of files) {
      if (path.basename(file).slice(0, 7) === 'vmlinuz') {
        this.vmlinuz = path.basename(file)
      }
      if (path.basename(file).slice(0, 4) === 'init') {
        this.initrdImg = path.basename(file)
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

    console.log(`eggRoot: ${this.eggRoot}`)
    console.log(`bootLabel: ${this.bootLabel}`)
    console.log(`vmlinuz: ${this.vmlinuz}`)
    console.log(`initrd: ${this.initrdImg}`)
  }

  /**
   * build
   */
  async build() {
    const echoYes = Utils.setEcho(true)

    // pxeRoot erase
    if (fs.existsSync(this.pxeRoot)) {
      await exec(`rm ${this.pxeRoot} -rf`, this.echo)
    }

    // Struttura
    await exec(`mkdir ${this.pxeRoot} -p`, this.echo)
    await exec(`ln -s ${this.eggRoot}live ${this.pxeRoot}/live`, this.echo)
    await exec(`ln -s ${this.nest}.disk ${this.pxeRoot}/.disk`, this.echo)

    // Link supplementari distro
    if (this.distro.familyId === 'archlinux') {
      let filesystemName = `arch/x86_64/airootfs.sfs`
      if (Diversions.isManjaroBased(this.settings.distro.distroId)) {
        filesystemName = `manjaro/x86_64/livefs.sfs`
      }
      await exec(`mkdir ${this.pxeRoot}/${path.dirname(filesystemName)} -p`, this.echo)
      await exec(`ln -s ${this.eggRoot}/live/filesystem.squashfs ${this.pxeRoot}/${filesystemName}`, this.echo)
    }

    // Firewall per fedora
    if (this.distro.familyId === 'fedora' || this.distro.familyId === 'opensuse') {
      await exec(`firewall-cmd --add-service=dhcp --permanent`, this.echo)
      await exec(`firewall-cmd --add-service=tftp --permanent`, this.echo)
      await exec(`firewall-cmd --add-service=http --permanent`, this.echo)
      await exec(`firewall-cmd --reload`, this.echo)
    }

    await this.grubCfg()
    await this.bios()
    await this.uefi()
    await this.http()

  }

  /**
   *
   * @param dhcpOptions
   */
  dhcpdStart(dhcpOptions: IDhcpOptions) {
    startSimpleProxy(dhcpOptions)
  }


  /**
   * start http server for images
   */
  async httpStart() {
    const port = 80;
    const httpRoot = this.pxeRoot + '/';

    // 1. Crea un'applicazione Express
    const app = express();

    // 2. Usa il middleware di Express per servire i file statici.
    app.use(express.static(httpRoot));

    // 3. Avvia il server
    app.listen(port, () => {
      console.log(`HTTP server (Express) listening on 0.0.0.0:${port}`);
      console.log(`Serving files from ${httpRoot}`);
    });
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
   * configure PXE http server
   */
  private async http() {
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
   * configure PXE bios
   */
  private async bios() {
    const bootloaders = Diversions.bootloaders(this.distro.familyId)
   
    await exec(`cp ${__dirname}/../../addons/eggs/theme/livecd/isolinux.theme.cfg ${this.pxeRoot}/isolinux.theme.cfg`, this.echo)
    await exec(`cp ${__dirname}/../../addons/eggs/theme/livecd/splash.png ${this.pxeRoot}/splash.png`, this.echo)

    // ipxe.pxe
    await exec(`ln -s ${bootloaders}/ipxe.pxe ${this.pxeRoot}/ipxe.pxe`, this.echo)

    // pxe
    await exec(`cp ${bootloaders}/PXELINUX/pxelinux.0 ${this.pxeRoot}/pxelinux.0`, this.echo)
    await exec(`cp ${bootloaders}/PXELINUX/lpxelinux.0 ${this.pxeRoot}/lpxelinux.0`, this.echo)

    // syslinux
    await exec(`ln -s ${bootloaders}/syslinux/modules/bios/ldlinux.c32 ${this.pxeRoot}/ldlinux.c32`, this.echo)
    await exec(`ln -s ${bootloaders}/syslinux/modules/bios/vesamenu.c32 ${this.pxeRoot}/vesamenu.c32`, this.echo)
    await exec(`ln -s ${bootloaders}/syslinux/modules/bios/libcom32.c32 ${this.pxeRoot}/libcom32.c32`, this.echo)
    await exec(`ln -s ${bootloaders}/syslinux/modules/bios/libutil.c32 ${this.pxeRoot}/libutil.c32`, this.echo)
    await exec(`ln -s ${bootloaders}/syslinux/modules/bios/memdisk ${this.pxeRoot}/memdisk`, this.echo)

    await exec(`mkdir ${this.pxeRoot}/pxelinux.cfg`, this.echo)

    let content = ''
    content += '# eggs: pxelinux.cfg/default\n'
    content += '# search path for the c32 support libraries (libcom32, libutil etc.)\n'
    content += `path /\n`
    content += 'include isolinux.theme.cfg\n'
    content += 'UI vesamenu.c32\n'
    content += '\n'
    content += `menu title cuckoo: when you need a flying PXE server! ${Utils.address()}\n`
    content += 'PROMPT 0\n'
    content += 'TIMEOUT 200\n'
    content += '\n'
    content += `label ${this.distro.distroId}\n`
    content += `menu label ${this.bootLabel.replace('.iso', '')}\n`
    content += `kernel http://${Utils.address()}/live/${path.basename(this.vmlinuz)}\n`
    const kernelParams = this._getKernelParameters();
    content += `append initrd=http://${Utils.address()}/live/${path.basename(this.initrdImg)} ${kernelParams}\n`;

    const file = `${this.pxeRoot}/pxelinux.cfg/default`
    fs.writeFileSync(file, content)
  }

  /**
  * uefi: uso ipxe solo per chainload di grub
  */
  private async uefi() {
    let content = '#!ipxe\n';
    content += 'dhcp\n';
    content += `chain http://${Utils.address()}/grub.efi\n`

    const file = `${this.pxeRoot}/autoexec.ipxe`;
    fs.writeFileSync(file, content);
  }

  /**
   * grubCfg
   * @param familyId 
   */
  private async grubCfg() {
    const bootloaders = Diversions.bootloaders(this.distro.familyId)
    const echoYes = Utils.setEcho(true);

    /**
     * On Debian bookworm:
     */
    await exec(`mkdir -p ${this.pxeRoot}/grub`, this.echo)
    
    await exec(`cp ${bootloaders}/grub/x86_64-efi-signed/grubnetx64.efi.signed ${this.pxeRoot}/grub.efi`, this.echo)
    await exec(`cp -r ${bootloaders}/grub/x86_64-efi ${this.pxeRoot}/grub`, this.echo)

    // Genera il file grub.cfg
    const grubName = `${this.pxeRoot}/grub/grub.cfg`; // Il file deve chiamarsi grub.cfg
    let grubContent = '';
    grubContent += `set timeout=10\n`;
    grubContent += `set default=0\n\n`;

    // Titolo del menu dinamico
    grubContent += `menuentry "${this.bootLabel.replace('.iso', '')} via PXE" {\n`
    grubContent += `  echo "Booting ${this.bootLabel.replace('.iso', '')}..."\n`
    grubContent += `  echo "Loading Linux Kernel..."\n`
    const kernelParams = this._getKernelParameters()
    grubContent += `  linux (http,${Utils.address()})/live/${path.basename(this.vmlinuz)} ${kernelParams}\n`

    grubContent += `  echo "Loading Initial Ramdisk..."\n`
    grubContent += `  initrd (http,${Utils.address()})/live/${path.basename(this.initrdImg)}\n`

    grubContent += `}\n`;

    fs.writeFileSync(grubName, grubContent, 'utf-8');
  }

  /**
   * Metodo helper per ottenere i parametri corretti per GRUB
   * in base alla famiglia della distribuzione.
   */
  private _getKernelParameters(): string {
    let lp = ''
    // .replaceAll(/\s\s+/g, ' ')
    switch (this.distro.familyId) {

      case 'alpine':
        lp =  `alpine_repo=http://${Utils.address()}/live/filesystem.squashfs \
               modules=loop,squashfs,sd-mod,usb-storage,virtio-net,e1000e \
               acpi=off \
               ip=dhcp`
      break

      case 'archlinux':
        let basedir = 'archisobasedir=arch'
        let hook = 'archiso_http_srv'
        if (Diversions.isManjaroBased(this.distro.distroId)) {
          basedir = ''
          hook = 'miso_http_srv'
        } 
        lp =  `${hook}=http://${Utils.address()}/ \
              ${basedir} \
              ip=dhcp \
              copytoram=n`
      break

      case 'debian':
        lp =  `fetch=http://${Utils.address()}/live/filesystem.squashfs \
                boot=live \
                config \
                noswap \
                noprompt \
                ip=dhcp`
      break

      case 'fedora':
        lp=   `initrd=http://${Utils.address()}/live/${path.basename(this.initrdImg)} \
               root=live:http://${Utils.address()}/live/filesystem.squashfs \
               rootfstype=auto \
               ro \
               rd.live.image \
               rd.luks=0 \
               rd.md=0 \
               rd.dm=0\n`
      break

      case 'opensuse':
        lp=   `initrd=http://${Utils.address()}/live/${path.basename(this.initrdImg)} \
               root=live:http://${Utils.address()}/live/filesystem.squashfs \
               rootfstype=auto \
               ro \
               rd.live.image \
               rd.luks=0 \
               rd.md=0 \
               rd.dm=0\n`
      break
      

      default:
        console.warn(`Attenzione: famiglia distro '${this.distro.familyId}' non riconosciuta per GRUB.`);
    }
    return lp.replaceAll(/\s\s+/g, ' ')
  }

}
