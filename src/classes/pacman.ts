/**
 * penguins-eggs-v7
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import fs = require('fs')
import os = require('os')
import path = require('path')
import shx = require('shelljs')
import { IRemix } from '../interfaces'

import Utils from './utils'
import Distro from './distro'
import Settings from './settings'


const exec = require('../lib/utils').exec

const config_file = '/etc/penguins-eggs.d/eggs.conf' as string
const config_tools = '/etc/penguins-eggs.d/tools.conf' as string

/**
 * Utils: general porpourse utils
 * @remarks all the utilities
 */
export default class Pacman {
   /**
    * buster   OK
    * beowulf  OK
    * focal    live-task-localization
    * bionic   live-config live-task-localization
    * 
    */
   static debs4eggs = ['isolinux', 'syslinux', 'squashfs-tools', 'xorriso', 'live-boot', 'live-boot-initramfs-tools', 'dpkg-dev']
   static debs4notRemove = ['rsync', 'xterm', 'whois', 'dosfstools', 'parted']
   static debs4calamares = ['calamares', 'qml-module-qtquick2', 'qml-module-qtquick-controls']

   /**
    * controlla se Xserver è installato
    */
   static isXInstalled(): boolean {
      return this.packageIsInstalled('xserver-xorg-core') || this.packageIsInstalled('xserver-xorg-core-hwe-18.04')
   }


   /**
    * 
    * @param remove 
    * @param verbose 
    */
   static packagesLocalisation(remove = false, verbose = false) {
      const remix = {} as IRemix
      const distro = new Distro(remix)
      const packages = []

      const settings = new Settings()
      settings.load()
      const locales: string[] = settings.locales

      if ((distro.versionLike === 'buster') || (distro.versionLike === 'beowulf')) {
         for (let i = 0; i < locales.length; i++) {
            if (locales[i] === process.env.LANG) {
               continue
            }
            if (locales[i] === `it_IT.UTF-8`) {
               packages.push('task-italian')
            } else if (locales[i] === `en_US.UTF-8`) {
               packages.push('task-english')
            } else if (locales[i] === `es_PE.UTF-8`) {
               packages.push('task-spanish')
            } else if (locales[i] === `pt_BR.UTF-8`) {
               packages.push('task-brazilian-portuguese')
            } else if (locales[i] === `fr_FR.UTF-8`) {
               packages.push('task-french')
            } else if (locales[i] === `de_DE.UTF-8`) {
               packages.push('task-german')
            }
         }
         packages.push('live-task-localisation')
      }

      return packages
   }
   /**
    * Crea array packages dei pacchetti da installare/rimuovere
    */
   static packages(verbose = false): string[] {
      const remix = {} as IRemix
      const distro = new Distro(remix)
      const packages = this.debs4eggs

      if ((distro.versionLike === 'buster') || (distro.versionLike === 'beowulf') || (distro.versionLike === 'bullseye') || (distro.versionLike === 'stretch')) {
         packages.push('live-config')
      } else if ((distro.versionLike === 'focal')) {
         packages.push('live-config')
      }

      // systemd / sysvinit
      const init: string = shx.exec('ps --no-headers -o comm 1', { silent: !verbose }).trim()
      let config = ''
      if (init === 'systemd') {
         if (distro.versionLike === 'bionic') {
            // config = 'open-infrastructure-system-config'
         } else {
            config = 'live-config-systemd'
         }
      } else {
         config = 'live-config-sysvinit'
      }
      packages.push(config)
      return packages
   }


   /**
    * Restituisce VERO se i prerequisiti sono installati
    */
   static async prerequisitesCheck(): Promise<boolean> {
      let installed = true

      for (const i in this.debs4notRemove) {
         if (!this.packageIsInstalled(this.debs4notRemove[i])) {
            installed = false
            break
         }
      }

      for (const i in this.debs4eggs) {
         if (!this.packageIsInstalled(this.debs4eggs[i])) {
            installed = false
            break
         }
      }
      return installed
   }

   /**
    *
    */
   static async prerequisitesInstall(verbose = true): Promise<boolean> {
      // verbose = true
      const echo = Utils.setEcho(verbose)
      const retVal = false
      const remix = {} as IRemix
      const distro = new Distro(remix)

      await exec(`apt-get install --yes ${this.debs2line(this.packages(verbose))}`, echo)
      await exec(`apt-get install --yes ${this.debs2line(this.debs4notRemove)}`, echo)
      if ((distro.versionLike === 'buster') || (distro.versionLike === 'beowulf') || (distro.versionLike === 'bullseye') || (distro.versionLike === 'stretch')) {
         await exec(`apt-get install --yes --no-install-recommends ${this.debs2line(this.packagesLocalisation(verbose))}`, echo)
      }
      if (!this.isXInstalled()) {
         /**
          * live-config-getty-generator
          * 
          * Viene rimosso in naked, altrimenti non funziona il login
          * generando un errore getty. Sarebbe utile individuarne le ragioni.
          */
         await exec(`rm /lib/systemd/system-generators/live-config-getty-generator`)
      }
      return retVal
   }

   /**
    *
    */
   static async prerequisitesRemove(verbose = true): Promise<boolean> {
      // verbose = true
      const echo = Utils.setEcho(verbose)
      const retVal = false
      const remix = {} as IRemix
      const distro = new Distro(remix)

      await exec(`apt-get purge --yes ${this.debs2line(this.packages(verbose))}`, echo)
      if ((distro.versionLike === 'buster') || (distro.versionLike === 'beowulf')) {
         await exec(`apt-get purge --yes  ${this.debs2line(this.packagesLocalisation(verbose))}`, echo)
      }

      await exec('apt-get autoremove --yes', echo)
      return retVal
   }

   /**
    *
    */
   static async calamaresCheck(): Promise<boolean> {
      let installed = true
      for (const i in this.debs4calamares) {
         if (!this.packageIsInstalled(this.debs4calamares[i])) {
            installed = false
            break
         }
      }
      return installed
   }

   /**
    *
    */
   static async calamaresInstall(verbose = true): Promise<void> {
      // verbose = true
      const echo = Utils.setEcho(verbose)
      if (this.isXInstalled()) {
         await exec(`apt-get install --yes ${this.debs2line(this.debs4calamares)}`, echo)
      } else {
         console.log("It's not possible to use calamares in a system without GUI")
      }
   }

   /**
    *
    */
   static async calamaresRemove(verbose = true): Promise<boolean> {
      const echo = Utils.setEcho(verbose)

      const retVal = false
      if (fs.existsSync('/etc/calamares')) {
         await exec('rm /etc/calamares -rf', echo)
      }
      await exec(`apt-get remove --purge --yes ${this.debs2line(this.debs4calamares)}`, echo)
      await exec('apt-get autoremove --yes', echo)
      return retVal
   }

   /**
    * Restutuisce VERO se i file di configurazione SONO presenti
    */
   static configurationCheck(): boolean {
      const confExists: boolean = fs.existsSync(config_file)
      const listExists: boolean = fs.existsSync('/usr/local/share/penguins-eggs/exclude.list')
      return (confExists && listExists)
   }

   /**
    * Creazione del file di configurazione /etc/penguins-eggs
    */
   static async configurationInstall(links = true, verbose = true): Promise<void> {
      if (!fs.existsSync('/etc/penguins-eggs.d')) {
         shx.mkdir('/etc/penguins-eggs.d')
      }
      const addons = '/etc/penguins-eggs.d/addons'
      const distros = '/etc/penguins-eggs.d/distros'
      shx.rm(addons)
      shx.rm(distros)
      shx.ln('-s', path.resolve(__dirname, '../../addons'), addons)
      shx.ln('-s', path.resolve(__dirname, '../../conf/distros'), distros)

      // this.linksInstall(links)

      shx.cp(path.resolve(__dirname, '../../conf/README.md'), '/etc/penguins-eggs.d/')
      shx.cp(path.resolve(__dirname, '../../conf/tools.conf'), config_tools)
      shx.cp(path.resolve(__dirname, '../../conf/eggs.conf'), config_file)

      /**
       * version
       */
      const version = Utils.getPackageVersion()
      shx.sed('-i', '%version%', version, config_file)

      /**
       * vmlinuz
       */
      let vmlinuz = '/vmlinuz'
      if (!fs.existsSync(vmlinuz)) {
         vmlinuz = '/boot/vmlinuz'
         if (!fs.existsSync(vmlinuz)) {
            vmlinuz = '/boot/pve/vmlinuz'
            if (!fs.existsSync(vmlinuz)) {
               vmlinuz = '/vmlinuz'
               console.log(`Can't find the standard ${vmlinuz}, please edit ${config_file}`)
            }
         }
      }
      shx.sed('-i', '%vmlinuz%', vmlinuz, config_file)

      /**
       * initrd
       */
      let initrd = '/initrd.img'
      if (!fs.existsSync(initrd)) {
         initrd = '/boot/initrd.img'
         if (!fs.existsSync(initrd)) {
            initrd = '/boot/pve/initrd.img'
            if (!fs.existsSync(initrd)) {
               initrd = '/initrd.img'
               console.log(`Can't find the standard  ${initrd}, please edit ${config_file}`)
            }
         }
      }
      shx.sed('-i', '%initrd%', initrd, config_file)

      /**
       * gui_editor
       */
      let gui_editor = '/usr/bin/nano'
      if (this.packageIsInstalled('gedit')) {
         gui_editor = '/usr/bin/gedit'
      } else if (this.packageIsInstalled('leafpad')) {
         gui_editor = '/usr/bin/leafpad'
      } else if (this.packageIsInstalled('caja')) {
         gui_editor = '/usr/bin/caja'
      }
      shx.sed('-i', '%gui_editor%', gui_editor, config_file)

      /**
       * force_installer
       */
      let force_installer = 'yes'
      if (!this.packageIsInstalled('calamares')) {
         force_installer = 'no'
      }
      shx.sed('-i', '%force_installer%', force_installer, config_file)

      /**
       * Questa cosa andrebbe spostata in settings 
       * make_efi
       */
      let make_efi = 'yes'
      if (!Utils.efiTest()) {
         make_efi = 'no'
         console.log(`Due the lacks of grub-efi-amd64 or grub-efi-ia32 package set make_efi=No`)
      }
      shx.sed('-i', '%make_efi%', make_efi, config_file)

      // creazione del file delle esclusioni
      shx.mkdir('-p', '/usr/local/share/penguins-eggs/')
      shx.cp(path.resolve(__dirname, '../../conf/exclude.list'), '/usr/local/share/penguins-eggs')
   }

   /**
    * Rimozione dei file di configurazione
    */
   static async configurationRemove(verbose = true): Promise<void> {
      const echo = Utils.setEcho(verbose)
      if (fs.existsSync('/etc/penguins-eggs.d/eggs.conf')) {
         await exec('rm /etc/penguins-eggs.d/eggs.conf', echo)
      }
      if (fs.existsSync('/etc/penguins-eggs.d/tools.conf')) {
         await exec('rm /etc/penguins-eggs.d/tools.conf', echo)
      }
      if (fs.existsSync('/usr/local/share/penguins-eggs/exclude.list')) {
         await exec('rm /usr/local/share/penguins-eggs/exclude.list', echo)
      }
   }

   /**
    * 
    */
   static linksCheck(): boolean {
      return fs.existsSync('/etc/penguins-eggs.d/distros/stretch')
   }

   /**
    * 
    */
   static async linksInstall(force = false, verbose = false) {
      if (!fs.existsSync('/etc/penguins-eggs.d')) {
         shx.mkdir('/etc/penguins-eggs.d')
      }
      const addons = '/etc/penguins-eggs.d/addons'
      const distros = '/etc/penguins-eggs.d/distros'
      shx.rm(addons)
      shx.rm(distros)
      shx.ln('-s', path.resolve(__dirname, '../../addons'), addons)
      shx.ln('-s', path.resolve(__dirname, '../../conf/distros'), distros)


      // Link da fare solo per pacchetto deb o per test
      if (Utils.isDebPackage() || force) {

         // const rootPen = '/usr/lib/penguins-eggs'
         const rootPen = Utils.rootPenguin()

         // Buster - Nessun link presente
         const buster = `${rootPen}/conf/distros/buster`

         /**
          * In bullseye niente tmp 
          */
         const bullseye = `${rootPen}/conf/distros/bullseye`
         this.ln('-s', `${buster}/grub`, `${bullseye}/grub`, verbose)
         this.ln('-s', `${buster}/isolinux`, `${bullseye}/isolinux`, verbose)
         this.ln('-s', `${buster}/locales`, `${bullseye}/locales`, verbose)
         this.ln('-s', `${buster}/calamares/calamares-modules/remove-link`, `${bullseye}/calamares/calamares-modules/remove-link`, verbose)
         this.ln('-s', `${buster}/calamares/calamares-modules/sources-yolk`, `${bullseye}/calamares/calamares-modules/sources-yolk`, verbose)
         this.ln('-s', `${buster}/calamares/calamares-modules/sources-yolk-unmount`, `${bullseye}/calamares/calamares-modules/sources-yolk-unmount`, verbose)
         this.ln('-s', `${buster}/calamares/modules`, `${bullseye}/calamares/modules`, verbose)

         const stretch = `${rootPen}/conf/distros/stretch`
         this.ln('-s', buster, stretch, verbose)

         // Beofulf
         const beowulf = `${rootPen}/conf/distros/beowulf`
         this.ln('-s', `${buster}/grub`, `${beowulf}/grub`, verbose)
         this.ln('-s', `${buster}/isolinux`, `${beowulf}/isolinux`, verbose)
         this.ln('-s', `${buster}/locales`, `${beowulf}/locales`, verbose)
         this.ln('-s', `${buster}/calamares/calamares-modules`, `${beowulf}/calamares/calamares-modules`, verbose)
         this.ln('-s', `${buster}/calamares/modules`, `${beowulf}/calamares/modules`, verbose)

         // Focal
         const focal = `${rootPen}/conf/distros/focal`
         this.ln('-s', `${buster}/grub/loopback.cfg`, `${focal}/grub/loopback.cfg`, verbose)
         this.ln('-s', `${buster}/grub/theme.cfg`, `${focal}/grub/theme.cfg`, verbose)
         this.ln('-s', `${buster}/isolinux/isolinux.template.cfg`, `${focal}/isolinux/isolinux.template.cfg`, verbose)
         this.ln('-s', `${buster}/isolinux/stdmenu.template.cfg`, `${focal}/isolinux/stdmenu.template.cfg`, verbose)
         this.ln('-s', `${buster}/calamares/calamares-modules/remove-link`, `${focal}/calamares/calamares-modules/remove-link`, verbose)
         this.ln('-s', `${buster}/calamares/calamares-modules/sources-yolk`, `${focal}/calamares/calamares-modules/sources-yolk`, verbose)
         this.ln('-s', `${buster}/calamares/calamares-modules/sources-yolk-unmount`, `${focal}/calamares/calamares-modules/sources-yolk-unmount`, verbose)
         this.ln('-s', `${buster}/calamares/modules/displaymanager.yml`, `${focal}/calamares/modules/displaymanager.yml`, verbose)
         this.ln('-s', `${buster}/calamares/modules/packages.yml`, `${focal}/calamares/modules/packages.yml`, verbose)
         this.ln('-s', `${buster}/calamares/modules/removeuser.yml`, `${focal}/calamares/modules/removeuser.yml`, verbose)

         // Bionic
         const bionic = `${rootPen}/conf/distros/bionic`
         this.ln('-s', `${focal}/grub`, `${bionic}/grub`, verbose)
         this.ln('-s', `${focal}/isolinux`, `${bionic}/isolinux`, verbose)
         this.ln('-s', `${buster}/calamares/calamares-modules/remove-link`, `${bionic}/calamares/calamares-modules/remove-link`, verbose)
         this.ln('-s', `${buster}/calamares/calamares-modules/sources-yolk`, `${bionic}/calamares/calamares-modules/sources-yolk`, verbose)
         this.ln('-s', `${buster}/calamares/calamares-modules/sources-yolk-unmount`, `${bionic}/calamares/calamares-modules/sources-yolk-unmount`, verbose)
         this.ln('-s', `${focal}/calamares/modules/displaymanager.yml`, `${bionic}/calamares/modules/displaymanager.yml`, verbose)
         this.ln('-s', `${buster}/calamares/modules/packages.yml`, `${bionic}/calamares/modules/packages.yml`, verbose)
         this.ln('-s', `${buster}/calamares/modules/removeuser.yml`, `${bionic}/calamares/modules/removeuser.yml`, verbose)
         this.ln('-s', `${buster}/calamares/modules/unpackfs.yml`, `${bionic}/calamares/modules/unpackfs.yml`, verbose)

         // Groovy
         const groovy = `${rootPen}/conf/distros/groovy`
         this.ln('-s', focal, groovy, verbose)
      }
   }


   static async ln(mode: string, src: string, dest: string, verbose = true) {
      // console.log(`src : ${src}`)
      // console.log(`dest: ${dest}`)

      const rel = path.relative(dest, src).substring(3)
      if (fs.existsSync(dest)) {
         if (verbose) console.log(`remove ${dest}`)
         shx.rm(dest)
      }
      const dirname = path.dirname(dest)
      const basename = path.basename(dest)

      process.chdir(dirname)
      if (verbose) console.log(`cd ${dirname}`)
      if (verbose) console.log(`ln ${mode} ${rel} ${basename}\n`)
      fs.symlinkSync(rel, basename)
   }


   /**
   * restuisce VERO se il pacchetto è installato
   * @param debPackage
   */
   static packageIsInstalled(debPackage: string): boolean {
      let installed = false
      const cmd = `/usr/bin/dpkg -s ${debPackage} | grep Status`
      const stdout = shx.exec(cmd, { silent: true }).stdout.trim()
      if (stdout === 'Status: install ok installed') {
         installed = true
      }
      return installed
   }


   /**
   * restuisce VERO se il pacchetto è installato
   * @param debPackage
   */
   static async packageAptAvailable(debPackage: string): Promise<boolean> {
      let disponible = false
      let cmd = `apt-cache show ${debPackage} | grep Package:`
      const test = `Package: ${debPackage}`
      const stdout = shx.exec(cmd, { silent: true }).stdout.trim()
      // console.log('===================================')
      // console.log('[' + stdout + ']')
      // console.log('[' + test + ']')
      // console.log('===================================')
      if (stdout === test) {
         disponible = true
      }
      return disponible
   }


   static async packageAptLast(debPackage: string): Promise<string> {
      let version = ''
      const cmd = `apt-cache show ${debPackage} | grep Version:`
      const stdout = shx.exec(cmd, { silent: true }).stdout.trim()
      version = stdout.substring(9)
      // console.log('===================================')
      // console.log('[' + version + ']')
      // console.log('===================================')
      return version
   }

   static async packageNpmLast(packageNpm = 'penguins-eggs'): Promise<string> {
      return shx.exec('npm show ' + packageNpm + ' version', { silent: true }).stdout.trim()
   }

   /**
    * 
    * @param cmd 
    */
   static async commandIsInstalled(cmd: string): Promise<boolean> {
      let installed = false
      const stdout = shx.exec(`command -v ${cmd}`, { silent: true }).stdout.trim()
      if (stdout !== '') {
         installed = true
      } else {
         Utils.warning(`${cmd} is not in your search path or is not installed!`)
      }

      return installed
   }

   /**
    * Install the package debPackage
    * @param debPackage {string} Pacchetto Debian da installare
    * @returns {boolean} True if success
    */
   static async packageInstall(debPackage: string): Promise<boolean> {
      let retVal = false

      if (shx.exec(`/usr/bin/apt-get install -y ${debPackage}`, { silent: true }) === '0') {
         retVal = true
      }
      return retVal
   }

   /**
    *
    * @param packages array packages
    */
   static debs2line(packages: string[]): string {
      let line = ''
      for (const i in packages) {
         line += packages[i] + ' '
      }
      return line
   }

}
