/**
 * penguins-eggs-v8
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import { array2spaced, depCommon, depArch, depVersions, depInit } from '../lib/dependencies'

import fs from 'fs'
import os from 'os'
import path from 'path'
import shx from 'shelljs'
import { IRemix, IDistro } from '../interfaces'

import Utils from './utils'
import Distro from './distro'
import Settings from './settings'
import { execSync } from 'child_process'
import { IConfig } from '../interfaces'
import { exec } from '../lib/utils'

import Debian from './family/debian'
import Fedora from './family/fedora'
import Archlinux from './family/archlinux'
import Suse from './family/suse'

const config_file = '/etc/penguins-eggs.d/eggs.yaml' as string
const config_tools = '/etc/penguins-eggs.d/tools.yaml' as string

/**
 * Utils: general porpourse utils
 * @remarks all the utilities
 */
export default class Pacman {
   static debs4calamares = ['calamares', 'qml-module-qtquick2', 'qml-module-qtquick-controls']

   distro = {} as IDistro

   remix = {} as IRemix

   /**
    * 
    * @returns 
    */
   static distro(): IDistro {
      const remix = {} as IRemix
      const distro = new Distro(remix)
      return distro
   }


   static whichGrubIsInstalled() : string{
      let grubInstalled = ''
      if (this.distro().familyId === 'debian') {
         if (this.packageIsInstalled('grub-common')) {
            grubInstalled = 'grub'
         }
      } else if (this.distro().familyId === 'fedora') {
         if (this.packageIsInstalled('grub2-common.noarch')) {
            grubInstalled = 'grub2'
         }
      } else if (this.distro().familyId === 'archlinux') {
         if (this.packageIsInstalled('grub')) {
            grubInstalled = 'grub'
         }
      } else if (this.distro().familyId === 'suse') {
         if (this.packageIsInstalled('grub2')) {
            grubInstalled = 'grub2'
         }
      }
      return grubInstalled
   }
   /**
    * check if it's installed xorg
    * @returns true if xorg is installed
    */
   static isInstalledXorg(): boolean {
      let installed = false
      if (this.distro().familyId === 'debian') {
         if (Debian.isInstalledXorg()) {
            installed = true
         }
      } else if (this.distro().familyId === 'fedora') {
         if (Fedora.isInstalledXorg()) {
            installed = true
         }
      } else if (this.distro().familyId === 'archlinux') {
         if (Archlinux.isInstalledXorg()) {
            installed = true
         }
      } else if (this.distro().familyId === 'suse') {
         if (Suse.isInstalledXorg()) {
            installed = true
         }
      }

      return installed
   }

   /**
    * check if it's installed wayland
    * @returns true if wayland
    */
   static isInstalledWayland(): boolean {
      let installed = false
      if (this.distro().familyId === 'debian') {
         if (Debian.isInstalledWayland()) {
            installed = true
         }
      } else if (this.distro().familyId === 'fedora') {
         if (Fedora.isInstalledWayland()) {
            installed = true
         }
      } else if (this.distro().familyId === 'archlinux') {
         if (Archlinux.isInstalledWayland()) {
            installed = true
         }
      } else if (this.distro().familyId === 'suse') {
         if (Suse.isInstalledWayland()) {
            installed = true
         }
      }
      return installed
   }

   /**
    * Check se la macchina ha grub adatto ad efi
    * Forse conviene spostarlo in pacman
    */
   static isUefi(): boolean {
      let isUefi = false
      if (this.distro().familyId === 'debian') {
         if ((Utils.machineArch() !== 'i386') && (this.packageIsInstalled('grub-efi-' + Utils.machineArch() + '-bin'))) {
            isUefi = true
         }
      } else if (Pacman.distro().familyId === 'fedora') {
         isUefi = true
      } else if (Pacman.distro().familyId === 'archlinux') {
         isUefi = true
      } else if (Pacman.distro().familyId === 'suse') {
         isUefi = true
      }
      return isUefi
   }


   /**
    * 
    * @returns true se GUI
    */
   static isInstalledGui(): boolean {
      return (this.isInstalledXorg() || this.isInstalledWayland())
   }

   /**
    * controlla se è operante xserver-xorg-core
    */
   static isRunningXorg(): boolean {
      return process.env.XDG_SESSION_TYPE === 'x11'
   }

   /**
    * Constrolla se è operante wayland
    */
   static isRunningWayland(): boolean {
      return process.env.XDG_SESSION_TYPE === 'wayland'
   }

   /**
    * Check if the system is GUI able
    */
   static isRunningGui(): boolean {
      return this.isRunningXorg() || this.isRunningWayland()
   }

   /**
    * Check if the system is just CLI
    */
   static isRunningCli(): boolean {
      return !this.isRunningGui()
   }

   /**
    * Crea array packages dei pacchetti da installare
    */
   static packages(remove = false, verbose = false): string[] {
      let packages: string[] = []
      if (this.distro().familyId === 'debian') {
         packages = Debian.packages(remove, verbose)
      } else if (this.distro().familyId === 'fedora') {
         packages = Fedora.packages(remove, verbose)
      } else if (this.distro().familyId === 'archlinux') {
         packages = Archlinux.packages(remove, verbose)
      } else if (this.distro().familyId === 'suse') {
         packages = Suse.packages(remove, verbose)
      }
      return packages
   }

   /**
    * Restituisce VERO se i prerequisiti sono installati
    */
   static async prerequisitesCheck(verbose = false): Promise<boolean> {
      let installed = true
      let packages = this.packages(false, verbose)

      if (packages.length > 0) {
         installed = false
      }
      return installed
   }

   /**
    *
    */
   static async prerequisitesInstall(verbose = true): Promise<boolean> {
      let retVal = false

      if (this.distro().familyId === 'debian') {
         retVal = await Debian.prerequisitesInstall(verbose)
      } else if (this.distro().familyId === 'fedora') {
         retVal = await Fedora.prerequisitesInstall(verbose)
      } else if (this.distro().familyId === 'archlinux') {
         retVal = await Archlinux.prerequisitesInstall(verbose)
      } else if (this.distro().familyId === 'suse') {
         retVal = await Suse.prerequisitesInstall(verbose)
      }
      return retVal
   }


   /**
    * Torna verso se calamares è installato
    */
   static async calamaresCheck(): Promise<boolean> {
      let installed = true
      if (this.distro().familyId === 'debian') {
         installed = await Debian.calamaresCheck()
      } else if (this.distro().familyId === 'fedora') {
         installed = await Fedora.calamaresCheck()
      } else if (this.distro().familyId === 'archlinux') {
         installed = await Archlinux.calamaresCheck()
      } else if (this.distro().familyId === 'suse') {
         installed = await Suse.calamaresCheck()
      }

      return installed
   }

   /**
    * Controlla se calamares è installabile
    * @returns 
    */
   static isCalamaresAvailable(): boolean {
      let result = this.distro().isCalamaresAvailable
      if (process.arch === 'armel' || process.arch === 'arm64') {
         result = false
      }
      return result
   }

   /**
    *
    */
   static async calamaresInstall(verbose = true): Promise<void> {
      if (this.isInstalledGui()) {
         if (this.distro().familyId === 'debian') {
            await Debian.calamaresInstall(verbose)
         } else if (this.distro().familyId === 'fedora') {
            await Fedora.calamaresInstall(verbose)
         } else if (this.distro().familyId === 'archlinux') {
            await Archlinux.calamaresInstall(verbose)
         } else if (this.distro().familyId === 'suse') {
            await Suse.calamaresInstall(verbose)
         }
      }
   }

   /**
   * calamaresPolicies
   */
   static async calamaresPolicies() {
      if (this.distro().familyId === 'debian') {
         await Debian.calamaresPolicies()
      } else if (this.distro().familyId === 'fedora') {
         await Fedora.calamaresPolicies()
      } else if (this.distro().familyId === 'archlinux') {
         await Archlinux.calamaresPolicies()
      } else if (this.distro().familyId === 'suse') {
         await Suse.calamaresPolicies()
      }
   }

   /**
    *
    */
   static async calamaresRemove(verbose = true): Promise<boolean> {
      let retVal = false
      if (this.distro().familyId === 'debian') {
         retVal = await Debian.calamaresRemove(verbose)
      } else if (this.distro().familyId === 'fedora') {
         retVal = await Fedora.calamaresRemove(verbose)
      } else if (this.distro().familyId === 'archlinux') {
         retVal = await Archlinux.calamaresRemove(verbose)
      } else if (this.distro().familyId === 'suse') {
         retVal = await Suse.calamaresRemove(verbose)
      }
      return retVal
   }

   /**
    * Restituisce VERO se i file di configurazione SONO presenti
    */
   static configurationCheck(): boolean {
      const confExists = fs.existsSync(config_file)
      const listExists = fs.existsSync('/usr/local/share/penguins-eggs/exclude.list')
      return (confExists && listExists)
   }



   /**
    * Ritorna vero se machine-id è uguale
    */
   static async configurationMachineNew(verbose = false): Promise<boolean> {
      const settings = new Settings()
      await settings.load()
      const result = Utils.machineId() !== settings.config.machine_id
      if (verbose) {
         if (result) {
            console.log('configurationMachineNew: True')
         }
      }
      return result
   }

   /**
    * 
    */
   static async configurationFresh() {
      const config = {} as IConfig
      config.version = Utils.getPackageVersion()
      config.snapshot_dir = '/home/eggs'
      config.snapshot_prefix = ''
      config.snapshot_excludes = '/usr/local/share/penguins-eggs/exclude.list'
      config.snapshot_basename = 'hostname'
      config.user_opt = 'live'
      config.user_opt_passwd = 'evolution'
      config.root_passwd = 'evolution'
      config.theme = 'eggs'
      config.force_installer = true
      config.make_efi = true
      config.make_md5sum = false
      config.make_isohybrid = true
      config.compression = 'xz'
      config.ssh_pass = true
      config.timezone = 'Europe/Rome'
      config.pmount_fixed = false
      const env = process.env
      if (env.LANG !== undefined) {
         config.locales_default = env.LANG
      } else {
         config.locales_default = 'en_US.UTF-8'
      }
      if (config.locales_default === 'en_US.UTF-8') {
         config.locales = ['en_US.UTF-8']
      } else {
         config.locales = [config.locales_default, 'en_US.UTF-8']
      }

      if (!this.packageIsInstalled('calamares')) {
         config.force_installer = false
         console.log(`Due the lacks of calamares package set force_installer = false`)
      }

      if (!Pacman.isUefi()) {
         config.make_efi = false
         console.log('Due the lacks of grub-efi-' + Utils.machineArch() + '-bin package set make_efi = false')
      }

      /**
       * Salvo la configurazione di eggs.yaml
       */
      config.machine_id = Utils.machineId()
      config.vmlinuz = Utils.vmlinuz()
      config.initrd_img = Utils.initrdImg()
      const settings = new Settings()
      await settings.save(config)
   }


   /**
    * Creazione del file di configurazione /etc/penguins-eggs
    */
   static async configurationInstall(links = true, verbose = true): Promise<void> {
      const confRoot = '/etc/penguins-eggs.d'
      if (!fs.existsSync(confRoot)) {
         execSync(`mkdir ${confRoot}`)
      }
      const addons = `${confRoot}/addons`
      const distros = `${confRoot}/distros`
      if (fs.existsSync(addons)) {
         execSync(`rm -rf ${addons}`)
      }
      if (fs.existsSync(distros)) {
         execSync(`rm -rf ${distros}`)
      }
      execSync(`mkdir -p ${distros}`)

      shx.ln('-s', path.resolve(__dirname, '../../addons'), addons)
      shx.cp(path.resolve(__dirname, '../../conf/README.md'), '/etc/penguins-eggs.d/')
      shx.cp(path.resolve(__dirname, '../../conf/tools.yaml'), config_tools)

      // creazione del file delle esclusioni
      shx.mkdir('-p', '/usr/local/share/penguins-eggs/')
      shx.cp(path.resolve(__dirname, '../../conf/exclude.list'), '/usr/local/share/penguins-eggs')

      await this.configurationFresh()
   }

   /**
    * Rimozione dei file di configurazione
    */
   static async configurationRemove(verbose = true): Promise<void> {
      const echo = Utils.setEcho(verbose)

      if (fs.existsSync('/etc/penguins-eggs.d')) {
         await exec('rm /etc/penguins-eggs.d -rf', echo)
      }
      if (fs.existsSync('/usr/local/share/penguins-eggs/exclude.list')) {
         await exec('rm /usr/local/share/penguins-eggs/exclude.list', echo)
      }
      if (fs.existsSync('/etc/calamares')) {
         await exec('rm /etc/calamares -rf', echo)
      }
   }

   /**
    * 
    * @param verbose 
    */
   static async autocompleteInstall(verbose = false) {
      if (Pacman.packageIsInstalled('bash-completion')) {
         if (!fs.existsSync('/etc/bash_completion.d/')) {
            Utils.warning('/etc/bash_completion.d/ NOT exists')
            await exec(`mkdir /etc/bash_completion.d/`)
         } else[
            Utils.warning('/etc/bash_completion.d/ exists')
         ]
         await exec(`cp ${__dirname}/../../scripts/eggs.bash /etc/bash_completion.d/`)
         if (verbose) {
            console.log('autocomplete installed...')
         }
      }
   }

   /**
   * Installa manPage
   */
   static async manPageInstall(verbose = false) {
      const manPage = path.resolve(__dirname, '../../manpages/doc/man/eggs.1.gz')
      if (fs.existsSync(manPage)) {
         const man1Dir = '/usr/share/man/man1/'
         if (!fs.existsSync(man1Dir)) {
            exec(`mkdir ${man1Dir} -p`)
         }
         exec(`cp ${manPage} ${man1Dir}`)
         if (shx.exec('which mandb', { silent: true }).stdout.trim() !== '') {
            await exec(`mandb > /dev/null`)
            if (verbose) {
               console.log('manPage eggs installed...')
            }
         }
      }
   }

   /**
    * distroTemplateCheck
    */
   static distroTemplateCheck(): boolean {
      const versionLike = this.distro().versionLike
      return fs.existsSync(`/etc/penguins-eggs.d/distros/${versionLike}`)
   }

   /**
    * 
    */
   static async distroTemplateInstall(verbose = false) {
      if (verbose) {
         console.log('distroTemplateInstall')
      }
      const echo = Utils.setEcho(verbose)

      const rootPen = Utils.rootPenguin()
      await exec(`mkdir /etc/penguins-eggs.d/distros/${this.distro().versionLike}`)

      /**
       * Debian 10 - Buster: è il master per tutte le distro
       */
      const buster = `${rootPen}/conf/distros/buster`

      /**
       * Debian 8 jessie:  eredita grub, isolinux e locales da buster, contiene krill al posto di calamares
       */
      if (this.distro().versionLike === 'jessie') {
         const dest = `/etc/penguins-eggs.d/distros/jessie`
         await exec(`cp -r ${buster}/grub ${dest}/grub`, echo)
         await exec(`cp -r ${buster}/isolinux ${dest}/isolinux`, echo)
         await exec(`cp -r ${buster}/locales ${dest}/locales`, echo)
         await exec(`cp -r ${rootPen}/conf/distros/jessie/krill ${dest}/krill`, echo)

         /**
          * Debian 9 stretch:  eredita grub, isolinux e locales da buster, contiene krill al posto di calamares
          */
      } else if (this.distro().versionLike === 'stretch') {
         const dest = `/etc/penguins-eggs.d/distros/stretch`
         await exec(`cp -r ${buster}/grub ${dest}/grub`, echo)
         await exec(`cp -r ${buster}/isolinux ${dest}/isolinux`, echo)
         await exec(`cp -r ${buster}/locales ${dest}/locales`, echo)
         await exec(`cp -r ${rootPen}/conf/distros/jessie/krill ${dest}/krill`, echo)

         /**
          * Debian 10 buster: eredita tutto da buster
          */
      } else if (this.distro().versionLike === 'bollseye') {
         const dest = `/etc/penguins-eggs.d/distros/buster`
         await exec(`cp -r ${buster}/grub ${dest}/grub`, echo)
         await exec(`cp -r ${buster}/isolinux ${dest}/isolinux`, echo)
         await exec(`cp -r ${buster}/locales ${dest}/locales`, echo)
         await exec(`cp -r ${buster}/calamares ${dest}/calamares`, echo)

         /**
          * Debian 11 bullseye: eredita tutto da buster
          */
      } else if (this.distro().versionLike === 'bollseye') {
         const dest = `/etc/penguins-eggs.d/distros/bullseye`
         await exec(`cp -r ${buster}/grub ${dest}/grub`, echo)
         await exec(`cp -r ${buster}/isolinux ${dest}/isolinux`, echo)
         await exec(`cp -r ${buster}/locales ${dest}/locales`, echo)
         await exec(`cp -r ${buster}/calamares ${dest}/calamares`, echo)

         /**
          * Debian 12 bookworm: eredita tutto da buster
          */
      } else if (this.distro().versionLike === 'bookworm') {
         const dest = `/etc/penguins-eggs.d/distros/bookworm`
         await exec(`cp -r ${buster}/grub ${dest}/grub`, echo)
         await exec(`cp -r ${buster}/isolinux ${dest}/isolinux`, echo)
         await exec(`cp -r ${buster}/locales ${dest}/locales`, echo)
         await exec(`cp -r ${buster}/calamares ${dest}/calamares`, echo)

         /***********************************************************************************
          * Devuan
          **********************************************************************************/

         /**
          * Devuan beowulf: eredita tutto da buster
          */
      } else if (this.distro().versionLike === 'beowulf') {
         const dest = `/etc/penguins-eggs.d/distros/beowulf`
         await exec(`cp -r ${buster}/grub ${dest}/grub`, echo)
         await exec(`cp -r ${buster}/isolinux ${dest}/isolinux`, echo)
         await exec(`cp -r ${buster}/locales ${dest}/locales`, echo)
         await exec(`cp -r ${buster}/calamares ${dest}/calamares`, echo)

         /**
          * Devuan chimaera: eredita tutto da buster
          */
      } else if (this.distro().versionLike === 'chimaera') {
         const dest = `/etc/penguins-eggs.d/distros/chimaera`
         await exec(`cp -r ${buster}/grub ${dest}/grub`, echo)
         await exec(`cp -r ${buster}/isolinux ${dest}/isolinux`, echo)
         await exec(`cp -r ${buster}/locales ${dest}/locales`, echo)
         await exec(`cp -r ${buster}/calamares ${dest}/calamares`, echo)

         /**
          * Devuan daedalus: eredita tutto da buster
          */
      } else if (this.distro().versionLike === 'daedalus') {
         const dest = `/etc/penguins-eggs.d/distros/daedalus`
         await exec(`cp -r ${buster}/grub ${dest}/grub`, echo)
         await exec(`cp -r ${buster}/isolinux ${dest}/isolinux`, echo)
         await exec(`cp -r ${buster}/locales ${dest}/locales`, echo)
         await exec(`cp -r ${buster}/calamares ${dest}/calamares`, echo)

         /***********************************************************************************
          * Ubuntu
          **********************************************************************************/

         /**
          * Ubuntu 10.04 bionic: eredita da bionic, focal grub ed isolinux, da buster i seguenti
          */
      } else if (this.distro().versionLike === 'bionic') {
         const dest = `/etc/penguins-eggs.d/distros/bionic`

         const bionic = `${rootPen}/conf/distros/bionic/*`
         await exec(`cp -r ${bionic} ${dest}`, echo)

         // Prendo prima da focal
         const focal = `${rootPen}/conf/distros/focal/`
         await exec(`cp -r ${focal}/grub ${dest}/grub`, echo)
         await exec(`cp -r ${focal}/isolinux ${dest}/isolinux`, echo)

         // Poi da buster
         await exec(`cp -r ${buster}/grub/loopback.cfg ${dest}/grub/loopback.cfg`, echo)
         await exec(`cp -r ${buster}/grub/theme.cfg ${dest}/grub/theme.cfg`, echo)
         await exec(`cp -r ${buster}/isolinux/isolinux.template.cfg ${dest}/isolinux/isolinux.template.cfg`, echo)
         await exec(`cp -r ${buster}/isolinux/stdmenu.template.cfg ${dest}/isolinux/stdmenu.template.cfg`, echo)

         await exec(`cp -r ${buster}/calamares/calamares-modules/remove-link ${dest}/calamares/calamares-modules/remove-link`, echo)
         await exec(`cp -r ${buster}/calamares/calamares-modules/sources-yolk ${dest}/calamares/calamares-modules/sources-yolk`, echo)
         await exec(`cp -r ${buster}/calamares/calamares-modules/sources-yolk-unmount ${dest}/calamares/calamares-modules/sources-yolk-unmount`, echo)
         await exec(`cp -r ${buster}/calamares/modules/packages.yml ${dest}/calamares/modules/packages.yml`, echo)
         await exec(`cp -r ${buster}/calamares/modules/removeuser.yml ${dest}/calamares/modules/removeuser.yml`, echo)
         await exec(`cp -r ${buster}/calamares/modules/unpackfs.yml ${dest}/calamares/modules/unpackfs.yml`, echo)
         await exec(`cp -r ${buster}/calamares/modules/displaymanager.yml ${dest}/calamares/modules/displaymanager.yml`, echo)

         /**
          * Ubuntu focal: eredita da focal e buster
          */
      } else if (this.distro().versionLike === 'focal') {
         const dest = `/etc/penguins-eggs.d/distros/focal`
         const focal = `${rootPen}/conf/distros/focal/*`
         await exec(`cp -r ${focal} ${dest}`, echo)

         await exec(`cp -r ${buster}/grub/loopback.cfg ${dest}/grub/loopback.cfg`, echo)
         await exec(`cp -r ${buster}/grub/theme.cfg ${dest}/grub/theme.cfg`, echo)
         await exec(`cp -r ${buster}/isolinux/isolinux.template.cfg ${dest}/isolinux/isolinux.template.cfg`, echo)
         await exec(`cp -r ${buster}/isolinux/stdmenu.template.cfg ${dest}/isolinux/stdmenu.template.cfg`, echo)

         await exec(`cp -r ${buster}/calamares/calamares-modules/remove-link ${dest}/calamares/calamares-modules/remove-link`, echo)
         await exec(`cp -r ${buster}/calamares/calamares-modules/sources-yolk ${dest}/calamares/calamares-modules/sources-yolk`, echo)
         await exec(`cp -r ${buster}/calamares/calamares-modules/sources-yolk-unmount ${dest}/calamares/calamares-modules/sources-yolk-unmount`, echo)
         await exec(`cp -r ${buster}/calamares/modules/packages.yml ${dest}/calamares/modules/packages.yml`, echo)
         await exec(`cp -r ${buster}/calamares/modules/removeuser.yml ${dest}/calamares/modules/removeuser.yml`, echo)
         await exec(`cp -r ${buster}/calamares/modules/unpackfs.yml ${dest}/calamares/modules/unpackfs.yml`, echo)
         await exec(`cp -r ${buster}/calamares/modules/displaymanager.yml ${dest}/calamares/modules/displaymanager.yml`, echo)

         /**
          * Ubuntu 20.10 groovy: eredita da focal e buster
          */
      } else if (this.distro().versionLike === 'groovy') {
         const dest = `/etc/penguins-eggs.d/distros/groovy`
         const focal = `${rootPen}/conf/distros/focal/*`
         await exec(`cp -r ${focal} ${dest}`, echo)

         await exec(`cp -r ${buster}/grub/loopback.cfg ${dest}/grub/loopback.cfg`, echo)
         await exec(`cp -r ${buster}/grub/theme.cfg ${dest}/grub/theme.cfg`, echo)
         await exec(`cp -r ${buster}/isolinux/isolinux.template.cfg ${dest}/isolinux/isolinux.template.cfg`, echo)
         await exec(`cp -r ${buster}/isolinux/stdmenu.template.cfg ${dest}/isolinux/stdmenu.template.cfg`, echo)

         await exec(`cp -r ${buster}/calamares/calamares-modules/remove-link ${dest}/calamares/calamares-modules/remove-link`, echo)
         await exec(`cp -r ${buster}/calamares/calamares-modules/sources-yolk ${dest}/calamares/calamares-modules/sources-yolk`, echo)
         await exec(`cp -r ${buster}/calamares/calamares-modules/sources-yolk-unmount ${dest}/calamares/calamares-modules/sources-yolk-unmount`, echo)
         await exec(`cp -r ${buster}/calamares/modules/packages.yml ${dest}/calamares/modules/packages.yml`, echo)
         await exec(`cp -r ${buster}/calamares/modules/removeuser.yml ${dest}/calamares/modules/removeuser.yml`, echo)
         await exec(`cp -r ${buster}/calamares/modules/unpackfs.yml ${dest}/calamares/modules/unpackfs.yml`, echo)
         await exec(`cp -r ${buster}/calamares/modules/displaymanager.yml ${dest}/calamares/modules/displaymanager.yml`, echo)

         /**
          * Ubuntu 21.04 hirsute: eredita da focal e buster
          */
      } else if (this.distro().versionLike === 'hirsute') {
         const dest = `/etc/penguins-eggs.d/distros/hirsute`
         const focal = `${rootPen}/conf/distros/focal/*`
         await exec(`cp -r ${focal} ${dest}`, echo)

         await exec(`cp -r ${buster}/grub/loopback.cfg ${dest}/grub/loopback.cfg`, echo)
         await exec(`cp -r ${buster}/grub/theme.cfg ${dest}/grub/theme.cfg`, echo)
         await exec(`cp -r ${buster}/isolinux/isolinux.template.cfg ${dest}/isolinux/isolinux.template.cfg`, echo)
         await exec(`cp -r ${buster}/isolinux/stdmenu.template.cfg ${dest}/isolinux/stdmenu.template.cfg`, echo)

         await exec(`cp -r ${buster}/calamares/calamares-modules/remove-link ${dest}/calamares/calamares-modules/remove-link`, echo)
         await exec(`cp -r ${buster}/calamares/calamares-modules/sources-yolk ${dest}/calamares/calamares-modules/sources-yolk`, echo)
         await exec(`cp -r ${buster}/calamares/calamares-modules/sources-yolk-unmount ${dest}/calamares/calamares-modules/sources-yolk-unmount`, echo)
         await exec(`cp -r ${buster}/calamares/modules/packages.yml ${dest}/calamares/modules/packages.yml`, echo)
         await exec(`cp -r ${buster}/calamares/modules/removeuser.yml ${dest}/calamares/modules/removeuser.yml`, echo)
         await exec(`cp -r ${buster}/calamares/modules/unpackfs.yml ${dest}/calamares/modules/unpackfs.yml`, echo)
         await exec(`cp -r ${buster}/calamares/modules/displaymanager.yml ${dest}/calamares/modules/displaymanager.yml`, echo)

         /**
          * Ubuntu 21.10 impish: eredita da focal e buster
          */
      } else if (this.distro().versionLike === 'impish') {
         const dest = `/etc/penguins-eggs.d/distros/impish`
         const focal = `${rootPen}/conf/distros/focal/*`
         await exec(`cp -r ${focal} ${dest}`, echo)

         await exec(`cp -r ${buster}/grub/loopback.cfg ${dest}/grub/loopback.cfg`, echo)
         await exec(`cp -r ${buster}/grub/theme.cfg ${dest}/grub/theme.cfg`, echo)
         await exec(`cp -r ${buster}/isolinux/isolinux.template.cfg ${dest}/isolinux/isolinux.template.cfg`, echo)
         await exec(`cp -r ${buster}/isolinux/stdmenu.template.cfg ${dest}/isolinux/stdmenu.template.cfg`, echo)

         await exec(`cp -r ${buster}/calamares/calamares-modules/remove-link ${dest}/calamares/calamares-modules/remove-link`, echo)
         await exec(`cp -r ${buster}/calamares/calamares-modules/sources-yolk ${dest}/calamares/calamares-modules/sources-yolk`, echo)
         await exec(`cp -r ${buster}/calamares/calamares-modules/sources-yolk-unmount ${dest}/calamares/calamares-modules/sources-yolk-unmount`, echo)
         await exec(`cp -r ${buster}/calamares/modules/packages.yml ${dest}/calamares/modules/packages.yml`, echo)
         await exec(`cp -r ${buster}/calamares/modules/removeuser.yml ${dest}/calamares/modules/removeuser.yml`, echo)
         await exec(`cp -r ${buster}/calamares/modules/unpackfs.yml ${dest}/calamares/modules/unpackfs.yml`, echo)
         await exec(`cp -r ${buster}/calamares/modules/displaymanager.yml ${dest}/calamares/modules/displaymanager.yml`, echo)

         /**
          * Ubuntu 22.04 jammy: eredita da focal e buster
          */
      } else if (this.distro().versionLike === 'jammy') {
         const dest = `/etc/penguins-eggs.d/distros/jammy`
         const focal = `${rootPen}/conf/distros/focal/*`
         await exec(`cp -r ${focal} ${dest}`, echo)

         await exec(`cp -r ${buster}/grub/loopback.cfg ${dest}/grub/loopback.cfg`, echo)
         await exec(`cp -r ${buster}/grub/theme.cfg ${dest}/grub/theme.cfg`, echo)
         await exec(`cp -r ${buster}/isolinux/isolinux.template.cfg ${dest}/isolinux/isolinux.template.cfg`, echo)
         await exec(`cp -r ${buster}/isolinux/stdmenu.template.cfg ${dest}/isolinux/stdmenu.template.cfg`, echo)

         await exec(`cp -r ${buster}/calamares/calamares-modules/remove-link ${dest}/calamares/calamares-modules/remove-link`, echo)
         await exec(`cp -r ${buster}/calamares/calamares-modules/sources-yolk ${dest}/calamares/calamares-modules/sources-yolk`, echo)
         await exec(`cp -r ${buster}/calamares/calamares-modules/sources-yolk-unmount ${dest}/calamares/calamares-modules/sources-yolk-unmount`, echo)
         await exec(`cp -r ${buster}/calamares/modules/packages.yml ${dest}/calamares/modules/packages.yml`, echo)
         await exec(`cp -r ${buster}/calamares/modules/removeuser.yml ${dest}/calamares/modules/removeuser.yml`, echo)
         await exec(`cp -r ${buster}/calamares/modules/unpackfs.yml ${dest}/calamares/modules/unpackfs.yml`, echo)
         await exec(`cp -r ${buster}/calamares/modules/displaymanager.yml ${dest}/calamares/modules/displaymanager.yml`, echo)

         /***********************************************************************************
         * Fedora
         **********************************************************************************/

         /**
          * Fedora 35 ThirtyFive: eredita da ThirtyFive
          */
       } else if (this.distro().versionLike === 'thirtyfive') {
         const dest = `/etc/penguins-eggs.d/distros/thirtyfive/`
         const thirtytive = `${rootPen}/conf/distros/thirtyfive/*`
         await exec(`cp -r ${thirtytive} ${dest}`, echo)

         /***********************************************************************************
         * Arch Linux
         **********************************************************************************/

         /**
          * Endeavour rolling: eredita da rolling
          */
       } else if (this.distro().versionLike === 'rolling') {
         const dest = `/etc/penguins-eggs.d/distros/rolling/`
         const rolling = `${rootPen}/conf/distros/rolling/*`
         await exec(`cp -r ${rolling} ${dest}`, echo)

         /***********************************************************************************
         * openSuse
         **********************************************************************************/

         /**
          * openSUSE tumbleweed: eredita da tumbleweed
          */
       } else if (this.distro().versionLike === 'tumbleweed') {
         const dest = `/etc/penguins-eggs.d/distros/tumbleweed/`
         const tumbleweed = `${rootPen}/conf/distros/tumbleweed/*`
         await exec(`cp -r ${tumbleweed} ${dest}`, echo)
      }
   }


   /**
   * restuisce VERO se il pacchetto è installato
   * @param debPackage
   */
   static packageIsInstalled(packageName: string): boolean {

      let installed = false
      if (this.distro().familyId === 'debian') {
         installed = Debian.packageIsInstalled(packageName)
      } else if (this.distro().familyId === 'fedora') {
         installed = Fedora.packageIsInstalled(packageName)
      } else if (this.distro().familyId === 'archlinux') {
         installed = Archlinux.packageIsInstalled(packageName)
      } else if (this.distro().familyId === 'suse') {
         installed = Suse.packageIsInstalled(packageName)
      }
      return installed
   }


   /**
   * restuisce VERO se il pacchetto è installato
   * @param debPackage
   */
   static async packageAptAvailable(packageName: string): Promise<boolean> {
      let available = false

      if (this.distro().familyId === 'debian') {
         available = Debian.packageIsInstalled(packageName)
      }
      return available
   }

   /**
    * 
    * @param debPackage 
    * @returns 
    */
   static async packageAptLast(debPackage: string): Promise<string> {
      let version = ''
      if (this.distro().familyId === 'debian') {
         version = await Debian.packageAptLast(debPackage)
      }
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
    * Install the package packageName
    * @param packageName {string} Pacchetto Debian da installare
    * @returns {boolean} True if success
    */
   static async packageInstall(packageName: string): Promise<boolean> {
      let retVal = false

      if (this.distro().familyId === 'debian') {
         retVal = await Debian.packageInstall(packageName)
      } else if (this.distro().familyId === 'archlinux') {
         retVal = await Archlinux.packageInstall(packageName)
      } else if (this.distro().familyId === 'fedora') {
         retVal = await Fedora.packageInstall(packageName)
      }
      return retVal
   }

   /**
    *
    * @param packages array packages
    * 
    * Probabilmente da rimuovere, viene usata solo da prerequisitesRemove
    * 
    */
   static filterInstalled(packages: string[]): string[] {

      let installed: string[] = []

      for (const i in packages) {
         if (Pacman.packageIsInstalled(packages[i])) {
            installed.push(packages[i])
         }
      }
      return installed
   }
}
