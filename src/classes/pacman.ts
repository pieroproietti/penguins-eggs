/**
 * ./src/classes/pacman.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import { execSync } from 'node:child_process'
import fs from 'node:fs'
// _dirname
import path from 'node:path'
import shx from 'shelljs'

import { IDistro, IEggsConfig, IRemix } from '../interfaces/index.js'
import { exec } from '../lib/utils.js'
import Distro from './distro.js'
import Diversions from './diversions.js'

import Alpine from './pacman.d/alpine.js'
import Archlinux from './pacman.d/archlinux.js'
import Debian from './pacman.d/debian.js'
import Fedora from './pacman.d/fedora.js'
import Openmamba from './pacman.d/openmamba.js'
import Opensuse from './pacman.d/opensuse.js'


import Settings from './settings.js'
import Utils from './utils.js'
const __dirname = path.dirname(new URL(import.meta.url).pathname)
const config_file = '/etc/penguins-eggs.d/eggs.yaml' as string
const config_tools = '/etc/penguins-eggs.d/tools.yaml' as string

/**
 * Utils: general porpouse utils
 * @remarks all the utilities
 */
export default class Pacman {
  static debs4calamares = ['calamares', 'qml-module-qtquick2', 'qml-module-qtquick-controls']

  distro = {} as IDistro

  remix = {} as IRemix

  /**
   * autocompleteInstall()
   * @param verbose
   */
  static async autocompleteInstall() {
    if (Pacman.packageIsInstalled('bash-completion')) {
      if (fs.existsSync('/usr/share/bash-completion/completions/')) {
        await exec(`cp ${__dirname}/../../scripts/eggs.bash /usr/share/bash-completion/completions/`)
      }
    }

    if (Pacman.packageIsInstalled('zsh-completion')) {
      if (fs.existsSync('/usr/share/zsh/site-functions')) {
        await exec(`cp ${__dirname}/../../scripts/_eggs /usr/share/zsh/site-functions/`)
      }
    }
  }

  /**
   * autocompleteRemove
   * @param verbose 
   */
  static async autocompleteRemove(verbose = false) {
    await exec(`rm -f /usr/share/bash-completion/completions/eggs.bash`)
    await exec(`rm -f /usr/share/zsh/site-functions/._eggs`)
  }


  /**
   * return true if calamares is installed
   */
  static calamaresExists(): boolean {
    return this.commandIsInstalled('calamares')
  }

  /**
   *
   */
  static async calamaresInstall(verbose = false): Promise<void> {
    if (this.isInstalledGui()) {

      const familyId = this.distro().familyId
      if (familyId === 'alpine') {
        await Alpine.calamaresInstall(verbose)
      } else if (familyId === 'archlinux') {
        if (Diversions.isManjaroBased(this.distro().distroId)) {
          await exec(`pacman -Sy --noconfirm calamares`, Utils.setEcho(true))
        } else {
          await Archlinux.calamaresInstall(verbose)
        }
      } else if (familyId === 'debian') {
        await Debian.calamaresInstall(verbose)
      } else if (familyId === 'fedora') {
        await Fedora.calamaresInstall(verbose)
      } else if (familyId === 'openmamba') {
        await Openmamba.calamaresInstall(verbose)
      } else if (familyId === 'opensuse') {
        await Opensuse.calamaresInstall(verbose)
      }
    }
  }

  /**
   * calamaresPolicies
   */
  static async calamaresPolicies(verbose = false) {
    const familyId = this.distro().familyId
    if (familyId === 'alpine') {
      await Alpine.calamaresPolicies(verbose)
    } else if (familyId === 'archlinux') {
      await Archlinux.calamaresPolicies(verbose)
    } else if (familyId === 'debian') {
      await Debian.calamaresPolicies(verbose)
    } else if (familyId === 'fedora') {
      await Fedora.calamaresPolicies(verbose)
    } else if (familyId === 'openmamba') {
      await Openmamba.calamaresPolicies(verbose)
    } else if (familyId === 'opensuse') {
      await Opensuse.calamaresPolicies(verbose)
    }
  }


  /**
   *
   */
  static async calamaresRemove(verbose = true): Promise<boolean> {
    let retVal = false

    const familyId = this.distro().familyId
    if (familyId === 'alpine') {
      retVal = await Alpine.calamaresRemove(verbose)
    } else if (familyId === 'archlinux') {
      retVal = await Archlinux.calamaresRemove(verbose)
    } else if (familyId === 'debian') {
      retVal = await Debian.calamaresRemove(verbose)
    } else if (familyId === 'fedora') {
      retVal = await Fedora.calamaresRemove(verbose)
    } else if (familyId === 'openmamba') {
      retVal = await Openmamba.calamaresRemove(verbose)
    } else if (familyId === 'opensuse') {
      retVal = await Opensuse.calamaresRemove(verbose)
    }

    return retVal
  }

  /**
   *
   * @param cmd
   */
  static commandIsInstalled(cmd: string): boolean {
    let installed = false
    if (shx.exec(`command -V ${cmd} >/dev/null 2>&1`).code == 0) {
      installed = true
    }

    return installed
  }

  /**
   * Restituisce VERO se i file di configurazione SONO presenti
   */
  static configurationCheck(): boolean {
    const confExists = fs.existsSync(config_file)
    return confExists
  }

  /**
   *
   */
  static async configurationFresh() {
    const config = {} as IEggsConfig

    config.version = Utils.getPackageVersion()
    config.snapshot_dir = '/home/eggs'
    config.snapshot_prefix = ''
    config.snapshot_excludes = '/etc/penguins-eggs.d/exclude.list'
    config.snapshot_basename = '' // before default was hostname
    config.user_opt = 'live'
    config.user_opt_passwd = 'evolution'
    config.root_passwd = 'evolution'
    config.theme = 'eggs'
    config.force_installer = true
    config.make_efi = true
    config.make_md5sum = false
    config.make_isohybrid = true
    config.compression = 'xz'
    config.ssh_pass = false
    config.timezone = 'America/New_York'
    config.pmount_fixed = false

    if (!this.calamaresExists()) {
      config.force_installer = false
      // console.log('Due the lacks of calamares package set force_installer = false')
    }

    if (!Pacman.isUefi() && Utils.uefiArch() !== 'i386') {
      config.make_efi = false
      console.log('Due the lacks of grub-efi-' + Utils.uefiArch() + '-bin package set make_efi = false')
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
  static async configurationInstall(links = true, verbose = false): Promise<void> {
    const confRoot = '/etc/penguins-eggs.d'
    if (!fs.existsSync(confRoot)) {
      execSync(`mkdir ${confRoot}`)
    }

    if (verbose) {
      console.log('configuration install: ' + confRoot)
    }

    const addons = `${confRoot}/addons`
    if (fs.existsSync(addons)) {
      execSync(`rm -rf ${addons}`)
    }

    const distros = `${confRoot}/distros`
    if (fs.existsSync(distros)) {
      execSync(`rm -rf ${distros}`)
    }

    execSync(`mkdir -p ${distros}`)

    /**
     * We use /etc/penguins-eggs.d/init for our init scripts:
     * # unattended.sh -> eggs install --unattended
     * # cuckoo ->        eggs cuckoo
     */
    const init = `${confRoot}/init`
    if (fs.existsSync(init)) {
      execSync(`rm -rf ${init}`)
    }

    execSync(`mkdir -p ${init}`)
    shx.ln('-s', path.resolve(__dirname, '../../addons'), addons)
    shx.cp(path.resolve(__dirname, '../../conf/README.md'), confRoot)

    shx.cp(path.resolve(__dirname, '../../conf/derivatives.yaml'), confRoot)
    shx.cp(path.resolve(__dirname, '../../conf/derivatives_fedora.yaml'), confRoot)
    shx.cp(path.resolve(__dirname, '../../conf/krill.yaml'), confRoot)
    shx.cp(path.resolve(__dirname, '../../conf/love.yaml'), confRoot)
    shx.cp(path.resolve(__dirname, '../../conf/tools.yaml'), config_tools)
    shx.cp(path.resolve(__dirname, '../../conf/yolk.yaml'), confRoot)
    // init
    shx.cp(path.resolve(__dirname, '../../conf/init/unattended.sh'), '/etc/penguins-eggs.d/init')
    shx.chmod('+x', '/etc/penguins-eggs.d/init/unattended.sh')
    shx.cp(path.resolve(__dirname, '../../conf/init/cuckoo.sh'), '/etc/penguins-eggs.d/init')
    shx.chmod('+x', '/etc/penguins-eggs.d/init/cuckoo.sh')

    // creazione cartella exclude.list.d
    execSync(`mkdir -p /etc/penguins-eggs.d/exclude.list.d`)
    shx.cp(path.resolve(__dirname, '../../conf/exclude.list.d/*'), '/etc/penguins-eggs.d/exclude.list.d')

    await this.configurationFresh()
  }

  /**
   * Rimozione dei file di configurazione
   */
  static async configurationRemove(verbose = false): Promise<void> {
    const echo = Utils.setEcho(verbose)

    if (fs.existsSync('/etc/penguins-eggs.d')) {
      await exec('rm /etc/penguins-eggs.d -rf', echo)
    }

    if (fs.existsSync('/etc/calamares')) {
      await exec('rm /etc/calamares -rf', echo)
    }
  }

  /**
   * Ritorna vero se machine-id è uguale
   */
  static async configurationMachineNew(verbose = false): Promise<boolean> {
    const settings = new Settings()
    await settings.load()
    const result = Utils.machineId() !== settings.config.machine_id
    if (verbose && result) {
      console.log('configurationMachineNew: True')
    }

    return result
  }


  /**
   *
   * @returns
   */
  static distro(): IDistro {
    return new Distro()
  }

  /**
   * distroTemplateCheck
   */
  static distroTemplateCheck(): boolean {
    const { distroUniqueId } = this.distro()
    // console.log(distroUniqueId)
    return fs.existsSync(`/etc/penguins-eggs.d/distros/${distroUniqueId}`)
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
    await exec(`mkdir /etc/penguins-eggs.d/distros/${this.distro().distroUniqueId}`)



    /**
     * Debian 10 - Buster: è il master per tutte le altre 
     */
    const buster = `${rootPen}/conf/distros/buster`
    const trixie = `${rootPen}/conf/distros/trixie`

    const distroUniqueId = this.distro().distroUniqueId

    /***********************************************************************************
       * Alpine
       **********************************************************************************/
    if (distroUniqueId === 'alpine') {
      // eredita solo da alpine
      const dest = '/etc/penguins-eggs.d/distros/alpine/'
      const alpine = `${rootPen}/conf/distros/alpine/`
      await exec(`cp -r ${alpine}/calamares ${dest}/calamares`, echo)

      /***********************************************************************************
       * Arch Linux
       **********************************************************************************/
    } else if (distroUniqueId === 'archlinux') {
      const dest = '/etc/penguins-eggs.d/distros/archlinux/'
      const arch = `${rootPen}/conf/distros/archlinux/*`
      await exec(`cp -r ${arch} ${dest}`, echo)

      /***********************************************************************************
       * Manjaro
       **********************************************************************************/
    } else if (distroUniqueId === 'manjaro') {
      const dest = '/etc/penguins-eggs.d/distros/manjaro/'
      const manjaro = `${rootPen}/conf/distros/manjaro/*`
      await exec(`cp -r ${manjaro} ${dest}`, echo)

      /***********************************************************************************
       * Debian
       **********************************************************************************/


      /**
       * Debian 10 buster: eredita tutto da buster
       */
    } else if (distroUniqueId === 'buster') {
      const dest = '/etc/penguins-eggs.d/distros/buster'
      await exec(`cp -r ${buster}/calamares ${dest}/calamares`, echo)

      /**
       * Debian 11 bullseye: eredita tutto da buster
       */
    } else if (distroUniqueId === 'bullseye') {
      const dest = '/etc/penguins-eggs.d/distros/bullseye'
      await exec(`cp -r ${buster}/calamares ${dest}/calamares`, echo)

      /**
       * Debian 12 bookworm: eredita tutto da buster
       */
    } else if (distroUniqueId === 'bookworm') {
      const dest = '/etc/penguins-eggs.d/distros/bookworm'
      await exec(`cp -r ${buster}/calamares ${dest}/calamares`, echo)

      /**
       * Debian 13 trixie: eredita tutto da trixie
       */
    } else if (distroUniqueId === 'trixie') {
      const dest = '/etc/penguins-eggs.d/distros/trixie'
      await exec(`cp -r ${trixie}/calamares ${dest}/calamares`, echo)

      /**
       * Debian 14 forky eredita tutto da trixie
       */
    } else if (distroUniqueId === 'forky') {
      const dest = '/etc/penguins-eggs.d/distros/forky'
      await exec(`cp -r ${trixie}/calamares ${dest}/calamares`, echo)

      /***********************************************************************************
       * Devuan
       **********************************************************************************/

      /**
       * Devuan beowulf: eredita tutto da buster
       */
    } else if (distroUniqueId === 'beowulf') {
      const dest = '/etc/penguins-eggs.d/distros/beowulf'
      await exec(`cp -r ${buster}/calamares ${dest}/calamares`, echo)

      /**
       * Devuan chimaera: eredita tutto da buster
       */
    } else if (distroUniqueId === 'chimaera') {
      const dest = '/etc/penguins-eggs.d/distros/chimaera'
      await exec(`cp -r ${buster}/calamares ${dest}/calamares`, echo)

      /**
       * Devuan daedalus: eredita tutto da buster
       */
    } else if (distroUniqueId === 'daedalus') {
      const dest = '/etc/penguins-eggs.d/distros/daedalus'
      await exec(`cp -r ${buster}/calamares ${dest}/calamares`, echo)
      /**
       * Devuan excalibur: eredita tutto da trixie
       */
    } else if (distroUniqueId === 'excalibur') {
      const dest = '/etc/penguins-eggs.d/distros/excalibur'
      await exec(`cp -r ${trixie}/calamares ${dest}/calamares`, echo)

      /***********************************************************************************
       * Fedora
       **********************************************************************************/
    } else if (distroUniqueId === 'fedora') {
      const dest = '/etc/penguins-eggs.d/distros/fedora/'
      const fedora = `${rootPen}/conf/distros/fedora/*`
      await exec(`cp -r ${fedora} ${dest}`, echo)

      /***********************************************************************************
      * openmamba
      **********************************************************************************/
    } else if (distroUniqueId === 'openmamba') {
      // eredita solo da openmamba
      const dest = '/etc/penguins-eggs.d/distros/openmamba/'
      const mamba = `${rootPen}/conf/distros/openmamba/*`
      await exec(`cp -r ${mamba} ${dest}`, echo)

      /***********************************************************************************
      * opensuse
      **********************************************************************************/
    } else if (distroUniqueId === 'opensuse') {
      const dest = '/etc/penguins-eggs.d/distros/opensuse/'
      const suse = `${rootPen}/conf/distros/opensuse/*`
      await exec(`cp -r ${suse} ${dest}`, echo)

      /***********************************************************************************
       * Ubuntu
       **********************************************************************************/

      /**
       * Ubuntu focal: eredita da focal
       */
    } else if (distroUniqueId === 'focal') {
      const dest = '/etc/penguins-eggs.d/distros/focal'
      const focal = `${rootPen}/conf/distros/focal`
      await exec(`cp -r ${focal}/* ${dest}`, echo)


      /**
       * Ubuntu 22.04 jammy: eredita da focal
       */
    } else if (distroUniqueId === 'jammy') {
      const dest = '/etc/penguins-eggs.d/distros/jammy'
      const focal = `${rootPen}/conf/distros/focal`
      await exec(`cp -r ${focal}/* ${dest}`, echo)

      /**
       * Ubuntu noble: e la nuova baseline per ubuntu
       *
       */
    } else if (this.distro().distroUniqueId === 'noble') {
      const dest = '/etc/penguins-eggs.d/distros/noble'
      const noble = `${rootPen}/conf/distros/noble`
      await exec(`cp -r ${noble}/* ${dest}`, echo)

      /**
       * Ubuntu rhino: devel
       *
       */
    } else if (distroUniqueId === 'devel') {
      const dest = '/etc/penguins-eggs.d/distros/devel'
      const noble = `${rootPen}/conf/distros/noble`
      await exec(`cp -r ${noble}/* ${dest}`, echo)
    }

  }

  /**
   * Controlla se calamares è installabile
   * @returns
   */
  static isCalamaresAvailable(): boolean {
    let result = this.distro().isCalamaresAvailable
    if (process.arch === 'arm' || process.arch === 'arm64') {
      result = false
    }

    return result
  }

  /**
   *
   * @returns true se GUI
   */
  static isInstalledGui(): boolean {
    return this.isInstalledXorg() || this.isInstalledWayland()
  }

  /**
   * check if it's installed wayland
   * @returns true if wayland
   */
  static isInstalledWayland(): boolean {
    let installed = false

    const familyId = this.distro().familyId
    if (familyId === 'alpine') {
      if (Alpine.packageIsInstalled('xwayland*')) {
        installed = true
      }
    } else if (familyId === 'archlinux') {
      if (Archlinux.packageIsInstalled('xwayland')) {
        installed = true
      }
    } else if (familyId === 'debian') {
      if (Debian.packageIsInstalled('xwayland')) {
        installed = true
      }
    } else if (familyId === 'fedora') {
      if (Fedora.packageIsInstalled('xorg-x11-server-Xwayland*')) {
        installed = true
      }
    } else if (familyId === 'openmamba') {
      if (Openmamba.packageIsInstalled('wayland')) {
        installed = true
      }
    } else if (familyId === 'opensuse') {
      if (Opensuse.packageIsInstalled('wayland')) {
        installed = true
      }
    }

    return installed
  }

  /**
   * check if it's installed xorg
   * @returns
   */
  static isInstalledXorg(): boolean {
    let installed = false

    const familyId = this.distro().familyId
    if (familyId === 'alpine') {
      if (Alpine.packageIsInstalled('xorg-server')) {
        installed = true
      }
    } else if (familyId === 'archlinux') {
      if (Archlinux.packageIsInstalled('xorg-server-common')) {
        installed = true
      }
    } else if (familyId === 'debian') {
      if (Debian.packageIsInstalled('xserver-xorg-core')) {
        installed = true
      }
    } else if (familyId === 'fedora') {
      if (Fedora.packageIsInstalled('xorg-x11-server-Xorg.x86_64')) {
        installed = true
      }
    } else if (familyId === 'openmamba') {
      if (Openmamba.packageIsInstalled('xorg-server')) {
        installed = true
      }
    } else if (familyId === 'opensuse') {
      if (Opensuse.packageIsInstalled('xorg-x11-server')) {
        installed = true
      }
    }
    return installed
  }

  /**
   * Check if the system is just CLI
   */
  static isRunningCli(): boolean {
    return !this.isRunningGui()
  }

  /**
   * Check if the system is GUI able
   */
  static isRunningGui(): boolean {
    return this.isRunningXorg() || this.isRunningWayland()
  }

  /**
   * Constrolla se è operante wayland
   */
  static isRunningWayland(): boolean {
    return process.env.XDG_SESSION_TYPE === 'wayland'
  }

  /**
   * controlla se è operante xserver-xorg-core
   */
  static isRunningXorg(): boolean {
    return process.env.XDG_SESSION_TYPE === 'x11'
  }

  /**
   * Check se la macchina ha grub adatto ad efi
   * Forse conviene spostarlo in pacman
   */
  static isUefi(): boolean {
    let isUefi = false
    if (this.distro().familyId === 'debian') {
      if (Utils.uefiArch() !== 'i386' && this.packageIsInstalled('grub-efi-' + Utils.uefiArch() + '-bin')) {
        isUefi = true
      }
    } else {
      isUefi = true
    }

    return isUefi
  }

  /**
   * Installa manPage
   */
  static async manpageInstall() {
    const manpageSrc = path.resolve(__dirname, '../../manpages/doc/man/eggs.1.gz')
    if (fs.existsSync(manpageSrc)) {
      const manpageDest = `/usr/share/man/man1`
      if (!fs.existsSync(manpageDest)) {
        await exec(`mkdir ${manpageDest} -p`)
      }
      await exec(`cp ${manpageSrc} ${manpageDest}`)
      // if (shx.exec('which mandb', { silent: true }).stdout.trim() !== '') {
      // await exec('mandb > /dev/null')
      // }
    }
  }


  /**
   * manpageRemove
   */
  static async manpageRemove() {
    const manpageEggs = `/usr/share/man/man1/man/eggs.1.gz`
    await exec(`rm -rf ${manpageEggs}`)
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

  /**
   * Install the package packageName
   * @param packageName {string} Pacchetto Debian da installare
   * @returns {boolean} True if success
   */
  static async packageInstall(packageName: string): Promise<boolean> {
    let retVal = false

    const familyId = this.distro().familyId
    if (familyId === 'alpine') {
      retVal = await Alpine.packageInstall(packageName)
    } else if (familyId === 'archlinux') {
      retVal = await Archlinux.packageInstall(packageName)
    } else if (familyId === 'debian') {
      retVal = await Debian.packageInstall(packageName)
    } else if (familyId === 'fedora') {
      retVal = await Fedora.packageInstall(packageName)
    } else if (familyId === 'openmamba') {
      retVal = await Openmamba.packageInstall(packageName)
    } else if (familyId === 'opensuse') {
      retVal = await Opensuse.packageInstall(packageName)
    }
    return retVal
  }

  /**
   * restuisce VERO se il pacchetto è installato
   * @param debPackage
   */
  static packageIsInstalled(packageName: string): boolean {
    let installed = false

    const familyId = this.distro().familyId
    if (familyId === 'alpine') {
      installed = Alpine.packageIsInstalled(packageName)
    } else if (familyId === 'archlinux') {
      installed = Archlinux.packageIsInstalled(packageName)
    } else if (familyId === 'debian') {
      installed = Debian.packageIsInstalled(packageName)
    } else if (familyId === 'fedora') {
      installed = Fedora.packageIsInstalled(packageName)
    } else if (familyId === 'openmamba') {
      installed = Openmamba.packageIsInstalled(packageName)
    } else if (familyId === 'opensuse') {
      installed = Opensuse.packageIsInstalled(packageName)
    }
    return installed
  }

  /**
   * 
   * @param packageNpm 
   * @returns 
   */
  static async packageNpmLast(packageNpm = 'penguins-eggs'): Promise<string> {
    return shx.exec('npm show ' + packageNpm + ' version', { silent: true }).stdout.trim()
  }
}
