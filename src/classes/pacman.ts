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

import { IRemix, IDistro } from '../interfaces'

import Utils from './utils'
import Distro from './distro'
import Settings from './settings'
import { settings } from 'cluster'


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
    * Lascio all'utente il compito di installare o rimuover grub-efi-amd64 o grun-efi-ia32
    * 
    */
   static debs4eggs = [
      'isolinux', 'syslinux', 'rsync ', 'squashfs-tools', 'xorriso', 'xterm', 'whois',// strumenti
      'live-boot', 'live-boot-initramfs-tools']
   static debs4calamares = ['calamares', 'qml-module-qtquick2', 'qml-module-qtquick-controls']

   /**
    * controlla se Xserver è installato
    */
   static isXInstalled(): boolean {
      return Pacman.packageIsInstalled('xserver-xorg-core') || Pacman.packageIsInstalled('xserver-xorg-core-hwe-18.04')
   }


   static packagesLocalisation(verbose = false) {
      const remix = {} as IRemix
      const distro = new Distro(remix)
      const packages = []

      const settings = new Settings()
      settings.load()
      const locales: string[] = settings.locales
      if ((distro.versionLike === 'buster') || (distro.versionLike === 'beowulf')) {
         for (let i = 0; i < locales.length; i++) {
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
      const packages = Pacman.debs4eggs

      if ((distro.versionLike === 'buster') || (distro.versionLike === 'beowulf')) {
         packages.push('live-config')
      } else if ((distro.versionLike === 'focal')) {
         packages.push('live-config')
      }

      // systemd / sysvinit
      const init: string = shx.exec('ps --no-headers -o comm 1', { silent: !verbose }).trim()
      let config = ''
      if (init === 'systemd') {
         if (distro.versionLike === 'bionic') {
            config = 'open-infrastructure-system-config'
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
    *
    */
   static async prerequisitesEggsInstall(verbose = true): Promise<boolean> {
      verbose = true
      const echo = Utils.setEcho(verbose)
      const retVal = false
      const remix = {} as IRemix
      const distro = new Distro(remix)

      await exec('apt-get update --yes')
      await exec(`apt-get install --yes ${Pacman.debs2line(Pacman.packages(verbose))}`, echo)
      if ((distro.versionLike === 'buster') || (distro.versionLike === 'beowulf')) {
         await exec(`apt-get install --no-install-recommends --yes ${Pacman.debs2line(Pacman.packagesLocalisation(verbose))}`, echo)
      }
      return retVal
   }

   /**
    *
    */
   static async prerequisitesEggsRemove(verbose = true): Promise<boolean> {
      verbose = true
      const echo = Utils.setEcho(verbose)
      const retVal = false
      const remix = {} as IRemix
      const distro = new Distro(remix)

      await exec(`apt-get remove --purge --yes ${Pacman.debs2line(Pacman.packages(verbose))}`, echo)
      if ((distro.versionLike === 'buster') || (distro.versionLike === 'beowulf')) {
         await exec(`apt-get remove --purge --yes ${Pacman.debs2line(Pacman.packagesLocalisation(verbose))}`, echo)
      }

      await exec('apt-get autoremove --yes')
      return retVal
   }

   /**
    *
    */
   static async prerequisitesCalamaresCheck(): Promise<boolean> {
      let installed = true
      for (const i in this.debs4calamares) {
         if (!Pacman.packageIsInstalled(this.debs4calamares[i])) {
            installed = false
            break
         }
      }
      return installed
   }

   /**
    *
    */
   static async prerequisitesCalamaresInstall(verbose = true): Promise<void> {
      verbose = true
      const echo = Utils.setEcho(verbose)
      if (Pacman.isXInstalled()) {
         await exec('apt-get update --yes', echo)
         await exec(`apt-get install --yes ${Pacman.debs2line(Pacman.debs4calamares)}`, echo)
         await Pacman.clean(verbose)
      } else {
         console.log("It's not possible to use calamares in a system without GUI")
      }
   }

   /**
    *
    */
   static async prerequisitesCalamaresRemove(verbose = true): Promise<boolean> {
      verbose = true
      const echo = Utils.setEcho(verbose)

      const retVal = false
      await exec('rm /etc/calamares -rf', echo)
      await exec(`apt-get remove --purge --yes ${Pacman.debs2line(Pacman.debs4calamares)}`, echo)
      await exec('apt-get autoremove --yes', echo)
      return retVal
   }

   /**
    * Restutuisce VERO se i file di configurazione sono presenti
    */
   static configurationCheck(): boolean {
      let conf = false
      let list = false
      let configured = false
      conf = fs.existsSync(config_file)
      list = fs.existsSync('/usr/local/share/penguins-eggs/exclude.list')
      configured = conf && list
      return configured
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
    * Creazione del file di configurazione /etc/penguins-eggs
    */
   static async configurationInstall(links = true, verbose = true): Promise<void> {
      shx.rm('/etc/penguins-eggs.d/addons')
      shx.rm('/etc/penguins-eggs.d/distros')
      if (!fs.existsSync('/etc/penguins-eggs.d')) {
         shx.mkdir('/etc/penguins-eggs.d')
      }
      shx.ln('-s', path.resolve(__dirname, '../../addons'), '/etc/penguins-eggs.d/addons')
      shx.ln('-s', path.resolve(__dirname, '../../conf/distros'), '/etc/penguins-eggs.d/distros')

      // Link da fare solo per pacchetto deb o per test
      if (Utils.isDebPackage() || links) {

         // const rootPen = '/usr/lib/penguins-eggs'
         const rootPen = Utils.rootPenguin()

         // Buster - Nessun link presente
         const buster = `${rootPen}/conf/distros/buster`

         // bullseye prende tutto da buster
         const bullseye = `${rootPen}/conf/distros/bullseye`
         this.ln('-s', buster, bullseye, verbose)

         // this.ln('-s', `${buster}/grub`, `${bullseye}/grub`, verbose)
         // this.ln('-s', `${buster}/isolinux`, `${bullseye}/isolinux`, verbose)
         // this.ln('-s', `${buster}/locales`, `${bullseye}/locales`, verbose)
         // this.ln('-s', `${buster}/calamares/modules`, `${bullseye}/calamares/modules`, verbose)
         // this.ln('-s', `${buster}/calamares/calamares-modules/bootloader-config`, `${bullseye}/calamares/calamares-modules/bootloader-config`, verbose)
         // this.ln('-s', `${buster}/calamares/calamares-modules/create-tmp`, `${bullseye}/calamares/calamares-modules/create-tmp`, verbose)
         // this.ln('-s', `${buster}/calamares/calamares-modules/remove-link`, `${bullseye}/calamares/calamares-modules/remove-link`, verbose)

         // this.ln('-s', `${buster}/calamares/calamares-modules/sources-final/module.desc`, `${bullseye}/calamares/calamares-modules/sources-final/module.desc`, verbose)
         // this.ln('-s', `${buster}/calamares/calamares-modules/sources-trusted/module.desc`, `${bullseye}/calamares/calamares-modules/sources-trusted/module.desc`, verbose)
         // this.ln('-s', `${buster}/calamares/calamares-modules/sources-trusted-unmount`, `${bullseye}/calamares/calamares-modules/sources-trusied-unmount`, verbose)

         const stretch = `${rootPen}/conf/distros/stretch`
         this.ln('-s', buster, stretch, verbose)

         // Beofulf
         const beowulf = `${rootPen}/conf/distros/beowulf`
         this.ln('-s', `${buster}/grub`, `${beowulf}/grub`, verbose)
         this.ln('-s', `${buster}/isolinux`, `${beowulf}/isolinux`, verbose)
         this.ln('-s', `${buster}/calamares/calamares-modules`, `${beowulf}/calamares/calamares-modules`, verbose)
         this.ln('-s', `${buster}/calamares/modules`, `${beowulf}/calamares/modules`, verbose)

         // Focal
         const focal = `${rootPen}/conf/distros/focal`
         this.ln('-s', `${buster}/grub/loopback.cfg`, `${focal}/grub/loopback.cfg`, verbose)
         this.ln('-s', `${buster}/grub/theme.cfg`, `${focal}/grub/theme.cfg`, verbose)
         this.ln('-s', `${buster}/isolinux/isolinux.template.cfg`, `${focal}/isolinux/isolinux.template.cfg`, verbose)
         this.ln('-s', `${buster}/isolinux/stdmenu.template.cfg`, `${focal}/isolinux/stdmenu.template.cfg`, verbose)
         this.ln('-s', `${buster}/calamares/modules/displaymanager.conf`, `${focal}/calamares/modules/displaymanager.conf`, verbose)
         this.ln('-s', `${buster}/calamares/modules/packages.conf`, `${focal}/calamares/modules/packages.conf`, verbose)
         this.ln('-s', `${buster}/calamares/modules/removeuser.conf`, `${focal}/calamares/modules/removeuser.conf`, verbose)
         this.ln('-s', `${buster}/calamares/calamares-modules/remove-link.conf`, `${focal}/calamares/calamares-modules/remove-link.conf`, verbose)

         // Bionic
         const bionic = `${rootPen}/conf/distros/bionic`
         this.ln('-s', `${focal}/grub/`, `${bionic}/grub`, verbose)
         this.ln('-s', `${focal}/isolinux/`, `${bionic}/isolinux`, verbose)
         this.ln('-s', `${focal}/calamares/modules/displaymanager.conf`, `${bionic}/calamares/modules/displaymanager.conf`, verbose)
         this.ln('-s', `${buster}/calamares/modules/packages.conf`, `${bionic}/calamares/modules/packages.conf`, verbose)
         this.ln('-s', `${buster}/calamares/modules/removeuser.conf`, `${bionic}/calamares/modules/removeuser.conf`, verbose)
         this.ln('-s', `${buster}/calamares/calamares-modules/remove-link.conf`, `${bionic}/calamares/calamares-modules/remove-link.conf`, verbose)
      }

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
            vmlinuz = '/vmlinuz'
            console.log(`Can't find the standard ${vmlinuz}, please edit ${config_file}`)
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
            initrd = '/initrd.img'
            console.log(`Can't find the standard  ${initrd}, please edit ${config_file}`)
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
         console.log(`Due the lacks of calamares package set force_installer=no`)
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
      await exec('rm /etc/penguins-eggs.d/eggs.conf', echo)
      await exec('rm /etc/penguins-eggs.d/eggs.conf?', echo)
      await exec('rm /etc/penguins-eggs.d/tools.conf', echo)
      await exec('rm /etc/penguins-eggs.d/tools.conf?', echo)
      await exec('rm /usr/local/share/penguins-eggs/exclude.list', echo)
      await exec('rm /usr/local/share/penguins-eggs/exclude.list?', echo)
   }
   /**
    *
    */
   static async clean(verbose = true): Promise<void> {
      const echo = Utils.setEcho(verbose)
      await exec('apt-get clean', echo)
      await exec('apt-get autoclean', echo)
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
    * Install the package debPackage
    * @param debPackage {string} Pacchetto Debian da installare
    * @returns {boolean} True if success
    */
   static packageInstall(debPackage: string): boolean {
      let retVal = false

      if (shx.exec('/usr/bin/apt-get update', { silent: true }) === '0') {
         if (
            shx.exec(`/usr/bin/apt-get install -y ${debPackage}`, {
               silent: true
            }) === '0'
         ) {
            retVal = true
         }
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

   /**
    * Restituisce VERO se i prerequisiti sono installati
    */
   static prerequisitesEggsCheck(): boolean {
      let installed = true

      for (const i in this.debs4eggs) {
         if (!Pacman.packageIsInstalled(this.debs4eggs[i])) {
            installed = false
            break
         }
      }
      return installed
   }
}
