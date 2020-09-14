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


   /**
    * Crea array packages dei pacchetti da installare/rimuovere
    */
   static packages(verbose = false): string[] {
      const remix = {} as IRemix
      const distro = new Distro(remix)
      let packages = Pacman.debs4eggs

      if ((distro.versionLike === 'buster') || (distro.versionLike === 'beowulf')) {
         packages.push('live-config')
         packages.push('live-task-localisation')
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

      await exec('apt-get update --yes')
      await exec(`apt-get install --yes ${Pacman.debs2line(Pacman.packages(verbose))}`, echo)
      return retVal
   }

   /**
    *
    */
   static async prerequisitesEggsRemove(verbose = true): Promise<boolean> {
      verbose = true
      const echo = Utils.setEcho(verbose)
      const retVal = false

      await exec(`apt-get remove --purge --yes ${Pacman.debs2line(Pacman.packages(verbose))}`, echo)
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

   /**
    * Creazione del file di configurazione /etc/penguins-eggs
    */
   static async configurationInstall(verbose = true): Promise<void> {
      shx.rm('/etc/penguins-eggs.d/addons')
      shx.rm('/etc/penguins-eggs.d/distros')
      if (!fs.existsSync('/etc/penguins-eggs.d')) {
         shx.mkdir('/etc/penguins-eggs.d')
      }
      shx.ln('-s', path.resolve(__dirname, '../../addons'), '/etc/penguins-eggs.d/addons')
      shx.ln('-s', path.resolve(__dirname, '../../conf/distros'), '/etc/penguins-eggs.d/distros')

      // Link da fare solo per pacchetto deb
      const pep =process.execPath
      console.log(`Process exec path: ${pep}`)
      if (pep !== '/usr/bin/node') {
         const rootPen = '/usr/lib/penguins-eggs'

         // Buster - Nessun link presente

         // Beofulf
         shx.ln('-s', `${rootPen}/conf/distros/buster/grub/`, `${rootPen}/conf/distros/beowulf/grub`)
         shx.ln('-s', `${rootPen}/conf/distros/buster/isolinux/`, `${rootPen}/conf/distros/beowulf/isolinux`)
         shx.ln('-s', `${rootPen}/conf/distros/buster/calamares/calamares-modules/`, `${rootPen}/conf/distros/beowulf/calamares/calamares-modules`)
         shx.ln('-s', `${rootPen}/conf/distros/buster/calamares/modules/`, `${rootPen}/conf/distros/beowulf/calamares/modules`)

         // Focal
         shx.ln('-s', `${rootPen}/conf/distros/focal/grub/loopback.cfg`, `${rootPen}/conf/distros/buster/grub/loopback.cfg`)
         shx.ln('-s', `${rootPen}/conf/distros/focal/grub/theme.cfg`, `${rootPen}/conf/distros/buster/grub/theme.cfg`)
         shx.ln('-s', `${rootPen}/conf/distros/focal/isolinux/isolinux.template.cfg`, `${rootPen}/conf/distros/buster/isolinux/isolinux.template.cfg`)
         shx.ln('-s', `${rootPen}/conf/distros/focal/isolinux/stdmenu.template.cfg`, `${rootPen}/conf/distros/buster/isolinux/stdmenu.template.cfg`)

         // Bionic
         shx.ln('-s', `${rootPen}/conf/distros/focal/grub/`, `${rootPen}/conf/distros/bionic/grub`)
         shx.ln('-s', `${rootPen}/conf/distros/focal/isolinux/`, `${rootPen}/conf/distros/bionic/isolinux`)
         shx.ln('-s', `${rootPen}/conf/distros/focal/calamares/calamares-modules/`, `${rootPen}/conf/distros/bionic/calamares/calamares-modules`)
         shx.ln('-s', `${rootPen}/conf/distros/focal/calamares/modules/`, `${rootPen}/conf/distros/bionic/calamares/modules`)
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
       * make_efi
       */
      let make_efi = 'yes'
      if (!this.packageIsInstalled('grub-efi-amd64')) {
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
      await exec('rm /etc/penguins-eggs.d/penguins-eggs.conf', echo)
      await exec('rm /etc/penguins-eggs.d/penguins-eggs.conf?', echo)
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
