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

/**
 * Utils: general porpourse utils
 * @remarks all the utilities
 */
export default class Pacman {
   static deb4uefi = ['grub-efi-amd64', 'grun-efi-ia32']
   static debs4eggs = [
      'isolinux',
      'live-boot',
      'live-boot-initramfs-tools',
      'lvm2',
      'squashfs-tools',
      'xorriso',
      'xterm',
      'whois'
   ]
   static debs4calamares = [
      'calamares',
      'qml-module-qtquick2',
      'qml-module-qtquick-controls'
   ]

   /**
    * controlla se Xserver è installato
    */
   static isXInstalled(): boolean {

      return (Pacman.packageIsInstalled('xserver-xorg-core') || Pacman.packageIsInstalled('xserver-xorg-core-hwe-18.04'))
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

   /**
    *
    */
   static async prerequisitesEggsInstall(verbose = true): Promise<boolean> {
      const echo = Utils.setEcho(verbose)
      const retVal = false

      const remix = {} as IRemix
      let distro = {} as IDistro
      distro = new Distro(remix)

      const init: string = shx
         .exec('ps --no-headers -o comm 1', { silent: !verbose })
         .trim()
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
      Pacman.debs4eggs.push(config)

      await exec('apt-get update --yes')
      await exec(
         `apt-get install --yes ${Pacman.debs2line(Pacman.debs4eggs)}`,
         echo
      )

      return retVal
   }

   /**
    *
    */
   static async prerequisitesEggsRemove(verbose = true): Promise<boolean> {
      const echo = Utils.setEcho(verbose)
      const retVal = false

      const remix = {} as IRemix
      let distro = {} as IDistro
      distro = new Distro(remix)

      const init: string = shx
         .exec('ps --no-headers -o comm 1', { silent: !verbose })
         .trim()
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
      Pacman.debs4eggs.push(config)

      await exec(
         `apt-get remove --purge --yes ${Pacman.debs2line(Pacman.debs4eggs)}`,
         echo
      )
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
      const echo = Utils.setEcho(verbose)
      if (Pacman.isXInstalled()) {
         await exec('apt-get update --yes', echo)
         await exec(
            `apt-get install --yes ${Pacman.debs2line(Pacman.debs4calamares)}`,
            echo
         )
         await Pacman.clean(verbose)
      } else {
         console.log(
            "It's not possible to use calamares in a system without GUI"
         )
      }
   }

   /**
    *
    */
   static async prerequisitesCalamaresRemove(verbose = true): Promise<boolean> {
      const echo = Utils.setEcho(verbose)

      const retVal = false
      await exec('rm /etc/calamares -rf', echo)
      await exec(
         `apt-get remove --purge --yes ${Pacman.debs2line(
            Pacman.debs4calamares
         )}`,
         echo
      )
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
      conf = fs.existsSync('/etc/penguins-eggs.conf')
      list = fs.existsSync('/usr/local/share/penguins-eggs/exclude.list')
      configured = conf && list
      return configured
   }

   /**
    *
    */
   static async configurationInstall(verbose = true): Promise<void> {
      shx.cp(path.resolve(__dirname, '../../conf/penguins-eggs.conf'), '/etc')

      /**
       * version
       */
      const version = Utils.getPackageVersion()
      shx.sed('-i', '%version%', version, '/etc/penguins-eggs.conf')

      /**
       * vmlinuz
       */
      let vmlinuz = '/vmlinuz'
      if (!fs.existsSync(vmlinuz)) {
         vmlinuz = '/boot/vmlinuz'
         if (!fs.existsSync(vmlinuz)) {
            vmlinuz = '/vmlinuz'
            console.log(
               `Can't find the standard ${vmlinuz}, please edit /etc/penguins-eggs.conf`
            )
         }
      }
      shx.sed('-i', '%vmlinuz%', vmlinuz, '/etc/penguins-eggs.conf')

      /**
       * initrd
       */
      let initrd = '/initrd.img'
      if (!fs.existsSync(initrd)) {
         initrd = '/boot/initrd.img'
         if (!fs.existsSync(initrd)) {
            initrd = '/initrd.img'
            console.log(
               `Can't find the standard  ${initrd}, please edit /etc/penguins-eggs.conf`
            )
         }
      }
      shx.sed('-i', '%initrd%', initrd, '/etc/penguins-eggs.conf')

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
      shx.sed('-i', '%gui_editor%', gui_editor, '/etc/penguins-eggs.conf')

      /**
       * force_installer
       */
      let force_installer = 'yes'
      if (!this.packageIsInstalled('calamares')) {
         force_installer = 'no'
         console.log(
            `Due the lacks of calamares package set force_installer=no`
         )
      }
      shx.sed(
         '-i',
         '%force_installer%',
         force_installer,
         '/etc/penguins-eggs.conf'
      )

      /**
       * make_efi
       */
      let make_efi = 'yes'
      if (!this.packageIsInstalled('grub-efi-amd64')) {
         make_efi = 'no'
         console.log(
            `Due the lacks of grub-efi-amd64 or grub-efi-ia32 package set make_efi=No`
         )
      }
      shx.sed('-i', '%make_efi%', make_efi, '/etc/penguins-eggs.conf')

      // creazione del file delle esclusioni
      shx.mkdir('-p', '/usr/local/share/penguins-eggs/')
      shx.cp(
         path.resolve(__dirname, '../../conf/exclude.list'),
         '/usr/local/share/penguins-eggs'
      )
   }

   /**
    *
    */
   static async configurationRemove(verbose = true): Promise<void> {
      const echo = Utils.setEcho(verbose)
      await exec('rm /etc/penguins-eggs.conf', echo)
      await exec('rm /etc/penguins-eggs.conf?', echo)
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
}
