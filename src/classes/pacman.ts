/**
 * ./src/classes/pacman.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import fs from 'node:fs'
// _dirname
import path from 'node:path'

import { IDistro, IEggsConfig, IRemix } from '../interfaces/index.js'
import { exec, execSync, shx } from '../lib/utils.js'
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
    if (Pacman.packageIsInstalled('bash-completion') && fs.existsSync('/usr/share/bash-completion/completions/')) {
      await exec(`cp ${__dirname}/../../scripts/eggs.bash /usr/share/bash-completion/completions/`)
    }

    // Su arch è ok, su debian God know
    if (Pacman.packageIsInstalled('zsh-completions') && fs.existsSync('/usr/share/zsh/site-functions')) {
      await exec(`cp ${__dirname}/../../scripts/_eggs /usr/share/zsh/site-functions/`)
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
    return Utils.commandExists('calamares')
  }

  /**
   *
   */
  static async calamaresInstall(verbose = false): Promise<void> {
    if (this.isInstalledGui()) {
      const { familyId } = this.distro()
      switch (familyId) {
        case 'alpine': {
          await Alpine.calamaresInstall(verbose)

          break
        }

        case 'archlinux': {
          if (Diversions.isManjaroBased(this.distro().distroId)) {
            await exec(`pacman -Sy --noconfirm calamares`, Utils.setEcho(true))
          } else {
            await Archlinux.calamaresInstall(verbose)
          }

          break
        }

        case 'debian': {
          await Debian.calamaresInstall(verbose)

          break
        }

        case 'fedora': {
          await Fedora.calamaresInstall(verbose)

          break
        }

        case 'openmamba': {
          await Openmamba.calamaresInstall(verbose)

          break
        }

        case 'opensuse': {
          await Opensuse.calamaresInstall(verbose)

          break
        }
        // No default
      }
    }
  }

  /**
   * calamaresPolicies
   */
  static async calamaresPolicies(verbose = false) {
    const { familyId } = this.distro()
    switch (familyId) {
      case 'alpine': {
        await Alpine.calamaresPolicies(verbose)

        break
      }

      case 'archlinux': {
        await Archlinux.calamaresPolicies(verbose)

        break
      }

      case 'debian': {
        await Debian.calamaresPolicies(verbose)

        break
      }

      case 'fedora': {
        await Fedora.calamaresPolicies(verbose)

        break
      }

      case 'openmamba': {
        await Openmamba.calamaresPolicies(verbose)

        break
      }

      case 'opensuse': {
        await Opensuse.calamaresPolicies(verbose)

        break
      }
      // No default
    }
  }

  /**
   *
   */
  static async calamaresRemove(verbose = true): Promise<boolean> {
    let retVal = false

    const { familyId } = this.distro()
    switch (familyId) {
      case 'alpine': {
        retVal = await Alpine.calamaresRemove(verbose)

        break
      }

      case 'archlinux': {
        retVal = await Archlinux.calamaresRemove(verbose)

        break
      }

      case 'debian': {
        retVal = await Debian.calamaresRemove(verbose)

        break
      }

      case 'fedora': {
        retVal = await Fedora.calamaresRemove(verbose)

        break
      }

      case 'openmamba': {
        retVal = await Openmamba.calamaresRemove(verbose)

        break
      }

      case 'opensuse': {
        retVal = await Opensuse.calamaresRemove(verbose)

        break
      }
      // No default
    }

    return retVal
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
    /**
     * Salvo la configurazione di eggs.yaml
     */
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

    /**
     * No remove calamares more
     */
    // if (fs.existsSync('/etc/calamares')) {
    //   await exec('rm /etc/calamares -rf', echo)
    // }
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

    const { distroUniqueId } = this.distro()

    /***********************************************************************************
     * Alpine
     **********************************************************************************/
    switch (distroUniqueId) {
      case 'alpine': {
        // eredita solo da alpine
        const dest = '/etc/penguins-eggs.d/distros/alpine/'
        const alpine = `${rootPen}/conf/distros/alpine/`
        await exec(`cp -r ${alpine}/calamares ${dest}/calamares`, echo)

        /***********************************************************************************
         * Arch Linux
         **********************************************************************************/

        break
      }

      case 'archlinux': {
        const dest = '/etc/penguins-eggs.d/distros/archlinux/'
        const arch = `${rootPen}/conf/distros/archlinux/*`
        await exec(`cp -r ${arch} ${dest}`, echo)

        /***********************************************************************************
         * Manjaro
         **********************************************************************************/

        break
      }

      case 'beowulf': {
        const dest = '/etc/penguins-eggs.d/distros/beowulf'
        await exec(`cp -r ${buster}/calamares ${dest}/calamares`, echo)

        /**
         * Devuan chimaera: eredita tutto da buster
         */

        break
      }

      case 'bookworm': {
        const dest = '/etc/penguins-eggs.d/distros/bookworm'
        await exec(`cp -r ${buster}/calamares ${dest}/calamares`, echo)

        /**
         * Debian 13 trixie: eredita tutto da trixie
         */

        break
      }

      case 'bullseye': {
        const dest = '/etc/penguins-eggs.d/distros/bullseye'
        await exec(`cp -r ${buster}/calamares ${dest}/calamares`, echo)

        /**
         * Debian 12 bookworm: eredita tutto da buster
         */

        break
      }

      case 'buster': {
        const dest = '/etc/penguins-eggs.d/distros/buster'
        await exec(`cp -r ${buster}/calamares ${dest}/calamares`, echo)

        /**
         * Debian 11 bullseye: eredita tutto da buster
         */

        break
      }

      case 'chimaera': {
        const dest = '/etc/penguins-eggs.d/distros/chimaera'
        await exec(`cp -r ${buster}/calamares ${dest}/calamares`, echo)

        /**
         * Devuan daedalus: eredita tutto da buster
         */

        break
      }

      case 'daedalus': {
        const dest = '/etc/penguins-eggs.d/distros/daedalus'
        await exec(`cp -r ${buster}/calamares ${dest}/calamares`, echo)
        /**
         * Devuan excalibur: eredita tutto da trixie
         */

        break
      }

      case 'excalibur': {
        const dest = '/etc/penguins-eggs.d/distros/excalibur'
        await exec(`cp -r ${trixie}/calamares ${dest}/calamares`, echo)

        /***********************************************************************************
         * Fedora
         **********************************************************************************/

        break
      }

      case 'fedora': {
        const dest = '/etc/penguins-eggs.d/distros/fedora/'
        const fedora = `${rootPen}/conf/distros/fedora/*`
        await exec(`cp -r ${fedora} ${dest}`, echo)

        /***********************************************************************************
         * openmamba
         **********************************************************************************/

        break
      }

      case 'focal': {
        const dest = '/etc/penguins-eggs.d/distros/focal'
        const focal = `${rootPen}/conf/distros/focal`
        await exec(`cp -r ${focal}/* ${dest}`, echo)

        /**
         * Ubuntu 22.04 jammy: eredita da focal
         */

        break
      }

      case 'forky': {
        const dest = '/etc/penguins-eggs.d/distros/forky'
        await exec(`cp -r ${trixie}/calamares ${dest}/calamares`, echo)

        /***********************************************************************************
         * Devuan
         **********************************************************************************/

        /**
         * Devuan beowulf: eredita tutto da buster
         */

        break
      }

      case 'jammy': {
        const dest = '/etc/penguins-eggs.d/distros/jammy'
        const focal = `${rootPen}/conf/distros/focal`
        await exec(`cp -r ${focal}/* ${dest}`, echo)

        /**
         * Ubuntu noble: e la nuova baseline per ubuntu
         *
         */

        break
      }

      case 'manjaro': {
        const dest = '/etc/penguins-eggs.d/distros/manjaro/'
        const manjaro = `${rootPen}/conf/distros/manjaro/*`
        await exec(`cp -r ${manjaro} ${dest}`, echo)

        /***********************************************************************************
         * Debian
         **********************************************************************************/

        /**
         * Debian 10 buster: eredita tutto da buster
         */

        break
      }

      case 'openmamba': {
        // eredita solo da openmamba
        const dest = '/etc/penguins-eggs.d/distros/openmamba/'
        const mamba = `${rootPen}/conf/distros/openmamba/*`
        await exec(`cp -r ${mamba} ${dest}`, echo)

        /***********************************************************************************
         * opensuse
         **********************************************************************************/

        break
      }

      case 'opensuse': {
        const dest = '/etc/penguins-eggs.d/distros/opensuse/'
        const suse = `${rootPen}/conf/distros/opensuse/*`
        await exec(`cp -r ${suse} ${dest}`, echo)

        /***********************************************************************************
         * Ubuntu
         **********************************************************************************/

        /**
         * Ubuntu focal: eredita da focal
         */

        break
      }

      case 'trixie': {
        const dest = '/etc/penguins-eggs.d/distros/trixie'
        await exec(`cp -r ${trixie}/calamares ${dest}/calamares`, echo)

        /**
         * Debian 14 forky eredita tutto da trixie
         */

        break
      }

      default: {
        if (this.distro().distroUniqueId === 'noble') {
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

    const { familyId } = this.distro()
    switch (familyId) {
      case 'alpine': {
        if (Alpine.packageIsInstalled('xwayland*')) {
          installed = true
        }

        break
      }

      case 'archlinux': {
        if (Archlinux.packageIsInstalled('xwayland')) {
          installed = true
        }

        break
      }

      case 'debian': {
        if (Debian.packageIsInstalled('xwayland')) {
          installed = true
        }

        break
      }

      case 'fedora': {
        if (Fedora.packageIsInstalled('xorg-x11-server-Xwayland*')) {
          installed = true
        }

        break
      }

      case 'openmamba': {
        if (Openmamba.packageIsInstalled('wayland')) {
          installed = true
        }

        break
      }

      case 'opensuse': {
        if (Opensuse.packageIsInstalled('wayland')) {
          installed = true
        }

        break
      }
      // No default
    }

    return installed
  }

  /**
   * check if it's installed xorg
   * @returns
   */
  static isInstalledXorg(): boolean {
    let installed = false

    const { familyId } = this.distro()
    switch (familyId) {
      case 'alpine': {
        if (Alpine.packageIsInstalled('xorg-server')) {
          installed = true
        }

        break
      }

      case 'archlinux': {
        if (Archlinux.packageIsInstalled('xorg-server-common')) {
          installed = true
        }

        break
      }

      case 'debian': {
        if (Debian.packageIsInstalled('xserver-xorg-core')) {
          installed = true
        }

        break
      }

      case 'fedora': {
        if (Fedora.packageIsInstalled('xorg-x11-server-Xorg.x86_64')) {
          installed = true
        }

        break
      }

      case 'openmamba': {
        if (Openmamba.packageIsInstalled('xorg-server')) {
          installed = true
        }

        break
      }

      case 'opensuse': {
        if (Opensuse.packageIsInstalled('xorg-x11-server')) {
          installed = true
        }

        break
      }
      // No default
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
    const manpageEggs = `/usr/share/man/man1/eggs.1.gz`
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

    const { familyId } = this.distro()
    switch (familyId) {
      case 'alpine': {
        retVal = await Alpine.packageInstall(packageName)

        break
      }

      case 'archlinux': {
        retVal = await Archlinux.packageInstall(packageName)

        break
      }

      case 'debian': {
        retVal = await Debian.packageInstall(packageName)

        break
      }

      case 'fedora': {
        retVal = await Fedora.packageInstall(packageName)

        break
      }

      case 'openmamba': {
        retVal = await Openmamba.packageInstall(packageName)

        break
      }

      case 'opensuse': {
        retVal = await Opensuse.packageInstall(packageName)

        break
      }
      // No default
    }

    return retVal
  }

  /**
   * restuisce VERO se il pacchetto è installato
   * @param debPackage
   */
  static packageIsInstalled(packageName: string): boolean {
    let installed = false

    const { familyId } = this.distro()
    switch (familyId) {
      case 'alpine': {
        installed = Alpine.packageIsInstalled(packageName)

        break
      }

      case 'archlinux': {
        installed = Archlinux.packageIsInstalled(packageName)

        break
      }

      case 'debian': {
        installed = Debian.packageIsInstalled(packageName)

        break
      }

      case 'fedora': {
        installed = Fedora.packageIsInstalled(packageName)

        break
      }

      case 'openmamba': {
        installed = Openmamba.packageIsInstalled(packageName)

        break
      }

      case 'opensuse': {
        installed = Opensuse.packageIsInstalled(packageName)

        break
      }
      // No default
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
