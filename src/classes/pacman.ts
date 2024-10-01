/**
 * ./src/classes/pacman.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
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

import Alpine from './families/alpine.js'
import Archlinux from './families/archlinux.js'
import Debian from './families/debian.js'
import Fedora from './families/fedora.js'
import Opensuse from './families/opensuse.js'

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
   *
   * @param verbose
   */
  static async autocompleteInstall(verbose = false) {
    if (this.distro().familyId === 'debian') {
      if (Pacman.packageIsInstalled('bash-completion')) {
        if (fs.existsSync('/usr/share/bash-completion/completions/')) {
          await exec(`cp ${__dirname}/../../scripts/eggs.bash /usr/share/bash-completion/completions/`)
        } else if (fs.existsSync('/etc/bash_completion.d/')) {
          await exec(`cp ${__dirname}/../../scripts/eggs.bash /etc/bash_completion.d/`)
        }
      }
    } else if (this.distro().familyId === 'archlinux' && Pacman.packageIsInstalled('bash-completion')) {
      await exec(`cp ${__dirname}/../../scripts/eggs.bash /usr/share/bash-completion/completions/`)
    }
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
      if (this.distro().familyId === 'debian') {
        await Debian.calamaresInstall(verbose)
      } else if (this.distro().familyId === 'fedora') {
        await Fedora.calamaresInstall(verbose)
      } else if (this.distro().familyId === 'archlinux') {
        if (this.distro().distroId === 'ManjaroLinux') {
          const cmd = `pacman -Sy --noconfirm calamares`
          try {
            await exec(cmd, Utils.setEcho(true))
          } catch {
            Utils.error(`manjaro: ${cmd}`) // + e.error)
          }
        } else {
          await Archlinux.calamaresInstall(verbose)
        }
      } else if (this.distro().familyId === 'alpine') {
        await Alpine.calamaresInstall(verbose)
      } else if (this.distro().familyId === 'opensuse') {
        await Opensuse.calamaresInstall(verbose)
      }

      // remove others calamares links
      await exec('rm -f /usr/share/applications/calamares-eggs-debugging.desktop')
      await exec('rm -f /usr/share/applications/calamares-eggs.desktop')
      await exec('rm -f /usr/share/applications/calamares.desktop')
    }
  }

  /**
   * calamaresPolicies
   */
  static async calamaresPolicies(verbose = false) {
    const echo = Utils.setEcho(verbose)
    const policyFile = '/usr/share/polkit-1/actions/com.github.calamares.calamares.policy'
    await exec(`sed -i 's/auth_admin/yes/' ${policyFile}`, echo)
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
    } else if (this.distro().familyId === 'alpine') {
      retVal = await Alpine.calamaresRemove(verbose)
    } else if (this.distro().familyId === 'opensuse') {
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
    // if (shx.exec(`command -V ${cmd} &>/dev/null`).code == 0) {
    // remove output
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
    config.timezone = 'Europe/Rome'
    // config.locales_default = '__NOT_USED_MORE'
    // config.locales = ['__NOT_USED_MORE']

    // config.timezone = 'America/New_York'
    // const env = process.env
    // config.locales_default = env.LANG !== undefined ? env.LANG : 'en_US.UTF-8'
    // config.locales = config.locales_default === 'en_US.UTF-8' ? ['en_US.UTF-8'] : [config.locales_default, 'en_US.UTF-8']
    config.pmount_fixed = false

    if (!this.calamaresExists()) {
      config.force_installer = false
      console.log('Due the lacks of calamares package set force_installer = false')
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
   * Rimozione dei file di configurazione
   */
  static async configurationRemove(verbose = true): Promise<void> {
    const echo = Utils.setEcho(verbose)

    if (fs.existsSync('/etc/penguins-eggs.d')) {
      await exec('rm /etc/penguins-eggs.d -rf', echo)
    }

    if (fs.existsSync('/etc/calamares')) {
      await exec('rm /etc/calamares -rf', echo)
    }
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
    const { codenameLikeId } = this.distro()
    return fs.existsSync(`/etc/penguins-eggs.d/distros/${codenameLikeId}`)
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
    await exec(`mkdir /etc/penguins-eggs.d/distros/${this.distro().codenameLikeId}`)

    /**
     * Debian 10 - Buster: è il master per tutte le distro
     */
    const buster = `${rootPen}/conf/distros/buster`

    /**
     * Debian 8 jessie:  eredita grub, isolinux e locales da buster, contiene krill al posto di calamares
     */
    if (this.distro().codenameLikeId === 'jessie') {
      const dest = '/etc/penguins-eggs.d/distros/jessie'
      await exec(`cp -r ${rootPen}/conf/distros/jessie/krill ${dest}/krill`, echo)

      /**
       * Debian 9 stretch:  eredita grub, isolinux e locales da buster, contiene krill al posto di calamares
       */
    } else if (this.distro().codenameLikeId === 'stretch') {
      const dest = '/etc/penguins-eggs.d/distros/stretch'
      await exec(`cp -r ${rootPen}/conf/distros/jessie/krill ${dest}/krill`, echo)

      /**
       * Debian 10 buster: eredita tutto da buster
       */
    } else if (this.distro().codenameLikeId === 'buster') {
      const dest = '/etc/penguins-eggs.d/distros/buster'
      await exec(`cp -r ${buster}/calamares ${dest}/calamares`, echo)

      /**
       * Debian 11 bullseye: eredita tutto da buster
       */
    } else if (this.distro().codenameLikeId === 'bullseye') {
      const dest = '/etc/penguins-eggs.d/distros/bullseye'
      await exec(`cp -r ${buster}/calamares ${dest}/calamares`, echo)

      /**
       * Debian 12 bookworm: eredita tutto da buster
       */
    } else if (this.distro().codenameLikeId === 'bookworm') {
      const dest = '/etc/penguins-eggs.d/distros/bookworm'
      await exec(`cp -r ${buster}/calamares ${dest}/calamares`, echo)

      /**
       * Debian 13 trixie: eredita tutto da buster
       */
    } else if (this.distro().codenameLikeId === 'trixie') {
      const dest = '/etc/penguins-eggs.d/distros/trixie'
      await exec(`cp -r ${buster}/calamares ${dest}/calamares`, echo)

      /***********************************************************************************
       * Devuan
       **********************************************************************************/

      /**
       * Devuan beowulf: eredita tutto da buster
       */
    } else if (this.distro().codenameLikeId === 'beowulf') {
      const dest = '/etc/penguins-eggs.d/distros/beowulf'
      await exec(`cp -r ${buster}/calamares ${dest}/calamares`, echo)

      /**
       * Devuan chimaera: eredita tutto da buster
       */
    } else if (this.distro().codenameLikeId === 'chimaera') {
      const dest = '/etc/penguins-eggs.d/distros/chimaera'
      await exec(`cp -r ${buster}/calamares ${dest}/calamares`, echo)

      /**
       * Devuan daedalus: eredita tutto da buster
       */
    } else if (this.distro().codenameLikeId === 'daedalus') {
      const dest = '/etc/penguins-eggs.d/distros/daedalus'
      await exec(`cp -r ${buster}/calamares ${dest}/calamares`, echo)

      /***********************************************************************************
       * Ubuntu
       **********************************************************************************/

      /**
       * Ubuntu 10.04 bionic: eredita da bionic, focal grub ed isolinux, da buster i seguenti
       */
    } else if (this.distro().codenameLikeId === 'bionic') {
      const dest = '/etc/penguins-eggs.d/distros/bionic'

      const bionic = `${rootPen}/conf/distros/bionic`
      await exec(`cp -r ${bionic}/* ${dest}`, echo)

      // Poi da buster
      await exec(`cp -r ${buster}/calamares/calamares-modules/cleanup ${dest}/calamares/calamares-modules/cleanup`, echo)
      await exec(`cp -r ${buster}/calamares/calamares-modules/sources-yolk ${dest}/calamares/calamares-modules/sources-yolk`, echo)
      await exec(`cp -r ${buster}/calamares/calamares-modules/sources-yolk-undo ${dest}/calamares/calamares-modules/sources-yolk-undo`, echo)
      await exec(`cp -r ${buster}/calamares/modules/packages.yml ${dest}/calamares/modules/packages.yml`, echo)
      await exec(`cp -r ${buster}/calamares/modules/removeuser.yml ${dest}/calamares/modules/removeuser.yml`, echo)
      await exec(`cp -r ${buster}/calamares/modules/unpackfs.yml ${dest}/calamares/modules/unpackfs.yml`, echo)
      await exec(`cp -r ${buster}/calamares/modules/displaymanager.yml ${dest}/calamares/modules/displaymanager.yml`, echo)

      /**
       * Ubuntu focal: eredita da noble e buster
       */
    } else if (this.distro().codenameLikeId === 'focal') {
      const dest = '/etc/penguins-eggs.d/distros/focal'
      const noble = `${rootPen}/conf/distros/noble`
      await exec(`cp -r ${noble}/* ${dest}`, echo)

      //  backport per focal e jammy: fstab, mount, users
      await exec(`cp ${noble}/calamares/modules/focal-jammy/* ${dest}/calamares/modules/`, echo)

      await exec(`cp -r ${buster}/calamares/calamares-modules/cleanup ${dest}/calamares/calamares-modules/cleanup`, echo)
      await exec(`cp -r ${buster}/calamares/calamares-modules/sources-yolk ${dest}/calamares/calamares-modules/sources-yolk`, echo)
      await exec(`cp -r ${buster}/calamares/calamares-modules/sources-yolk-undo ${dest}/calamares/calamares-modules/sources-yolk-undo`, echo)
      await exec(`cp -r ${buster}/calamares/modules/packages.yml ${dest}/calamares/modules/packages.yml`, echo)
      await exec(`cp -r ${buster}/calamares/modules/removeuser.yml ${dest}/calamares/modules/removeuser.yml`, echo)
      await exec(`cp -r ${buster}/calamares/modules/unpackfs.yml ${dest}/calamares/modules/unpackfs.yml`, echo)
      await exec(`cp -r ${buster}/calamares/modules/displaymanager.yml ${dest}/calamares/modules/displaymanager.yml`, echo)

      /**
       * Ubuntu 22.04 jammy: eredita da noble e buster
       */
    } else if (this.distro().codenameLikeId === 'jammy') {
      const dest = '/etc/penguins-eggs.d/distros/jammy'
      const noble = `${rootPen}/conf/distros/noble`
      await exec(`cp -r ${noble}/* ${dest}`, echo)

      //  backport per focal e jammy: fstab, mount, users
      await exec(`cp ${noble}/calamares/modules/focal-jammy/* ${dest}/calamares/modules/`, echo)

      await exec(`cp -r ${buster}/calamares/calamares-modules/cleanup ${dest}/calamares/calamares-modules/cleanup`, echo)
      await exec(`cp -r ${buster}/calamares/calamares-modules/sources-yolk ${dest}/calamares/calamares-modules/sources-yolk`, echo)
      await exec(`cp -r ${buster}/calamares/calamares-modules/sources-yolk-undo ${dest}/calamares/calamares-modules/sources-yolk-undo`, echo)
      await exec(`cp -r ${buster}/calamares/modules/packages.yml ${dest}/calamares/modules/packages.yml`, echo)
      await exec(`cp -r ${buster}/calamares/modules/removeuser.yml ${dest}/calamares/modules/removeuser.yml`, echo)
      await exec(`cp -r ${buster}/calamares/modules/unpackfs.yml ${dest}/calamares/modules/unpackfs.yml`, echo)
      await exec(`cp -r ${buster}/calamares/modules/displaymanager.yml ${dest}/calamares/modules/displaymanager.yml`, echo)

      /**
       * Ubuntu noble: e la nuova baseline per ubuntu
       *
       */
    } else if (this.distro().codenameLikeId === 'noble') {
      const dest = '/etc/penguins-eggs.d/distros/noble'
      const noble = `${rootPen}/conf/distros/noble`
      await exec(`cp -r ${noble}/* ${dest}`, echo)

      await exec(`cp -r ${buster}/calamares/calamares-modules/cleanup ${dest}/calamares/calamares-modules/cleanup`, echo)
      await exec(`cp -r ${buster}/calamares/calamares-modules/sources-yolk ${dest}/calamares/calamares-modules/sources-yolk`, echo)
      await exec(`cp -r ${buster}/calamares/calamares-modules/sources-yolk-undo ${dest}/calamares/calamares-modules/sources-yolk-undo`, echo)
      await exec(`cp -r ${buster}/calamares/modules/packages.yml ${dest}/calamares/modules/packages.yml`, echo)
      await exec(`cp -r ${buster}/calamares/modules/removeuser.yml ${dest}/calamares/modules/removeuser.yml`, echo)
      await exec(`cp -r ${buster}/calamares/modules/unpackfs.yml ${dest}/calamares/modules/unpackfs.yml`, echo)
      await exec(`cp -r ${buster}/calamares/modules/displaymanager.yml ${dest}/calamares/modules/displaymanager.yml`, echo)

      /**
       * Ubuntu rhino: eredita da noble e buster
       *
       */
    } else if (this.distro().codenameLikeId === 'devel') {
      const dest = '/etc/penguins-eggs.d/distros/devel'
      const noble = `${rootPen}/conf/distros/noble`
      await exec(`cp -r ${noble}/* ${dest}`, echo)

      await exec(`cp -r ${buster}/calamares/calamares-modules/cleanup ${dest}/calamares/calamares-modules/cleanup`, echo)
      await exec(`cp -r ${buster}/calamares/calamares-modules/sources-yolk ${dest}/calamares/calamares-modules/sources-yolk`, echo)
      await exec(`cp -r ${buster}/calamares/calamares-modules/sources-yolk-undo ${dest}/calamares/calamares-modules/sources-yolk-undo`, echo)
      await exec(`cp -r ${buster}/calamares/modules/packages.yml ${dest}/calamares/modules/packages.yml`, echo)
      await exec(`cp -r ${buster}/calamares/modules/removeuser.yml ${dest}/calamares/modules/removeuser.yml`, echo)
      await exec(`cp -r ${buster}/calamares/modules/unpackfs.yml ${dest}/calamares/modules/unpackfs.yml`, echo)
      await exec(`cp -r ${buster}/calamares/modules/displaymanager.yml ${dest}/calamares/modules/displaymanager.yml`, echo)

      /***********************************************************************************
       * Fedora
       **********************************************************************************/
    } else if (this.distro().codenameLikeId === 'fedora') {
      const dest = '/etc/penguins-eggs.d/distros/fedora/'
      const fedora = `${rootPen}/conf/distros/fedora/*`
      await exec(`cp -r ${fedora} ${dest}`, echo)

      /***********************************************************************************
       * Arch Linux
       **********************************************************************************/

      /**
       * Endeavour rolling: eredita da rolling
       */
    } else if (this.distro().codenameLikeId === 'rolling') {
      const dest = '/etc/penguins-eggs.d/distros/rolling/'
      const rolling = `${rootPen}/conf/distros/rolling/*`
      await exec(`cp -r ${rolling} ${dest}`, echo)

      /***********************************************************************************
       * Alpine
       **********************************************************************************/
    } else if (this.distro().codenameLikeId === 'alpine') {
      // eredita solo da alpine
      const dest = '/etc/penguins-eggs.d/distros/alpine/'
      const alpine = `${rootPen}/conf/distros/alpine/`
      await exec(`cp -r ${alpine}/calamares ${dest}/calamares`, echo)

      /***********************************************************************************
      * opensuse
      **********************************************************************************/
    } else if (this.distro().codenameLikeId === 'opensuse') {
      const dest = '/etc/penguins-eggs.d/distros/opensuse/'
      const suse = `${rootPen}/conf/distros/opensuse/*`
      await exec(`cp -r ${suse} ${dest}`, echo)
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
    if (this.distro().familyId === 'debian') {
      if (Debian.packageIsInstalled('xwayland')) {
        installed = true
      }
    } else if (this.distro().familyId === 'fedora') {
      if (Fedora.packageIsInstalled('xorg-x11-server-Xwayland*')) {
        installed = true
      }
    } else if (this.distro().familyId === 'archlinux') {
      if (Archlinux.packageIsInstalled('xwayland')) {
        installed = true
      }
    } else if (this.distro().familyId === 'alpine') {
      if (Alpine.packageIsInstalled('xwayland*')) {
        installed = true
      }
    } else if (this.distro().familyId === 'opensuse') {
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
    if (this.distro().familyId === 'debian') {
      if (Debian.packageIsInstalled('xserver-xorg-core')) {
        installed = true
      }
    } else if (this.distro().familyId === 'fedora') {
      if (Fedora.packageIsInstalled('xorg-x11-server-Xorg.x86_64')) {
        installed = true
      }
    } else if (this.distro().familyId === 'archlinux') {
      if (Archlinux.packageIsInstalled('xorg-server-common')) {
        installed = true
      }
    } else if (this.distro().familyId === 'alpine') {
      if (Alpine.packageIsInstalled('xorg-server')) {
        installed = true
      }
    } else if (this.distro().familyId === 'opensuse') {
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
    } else if (Pacman.distro().familyId === 'fedora') {
      isUefi = true
    } else if (Pacman.distro().familyId === 'archlinux') {
      isUefi = true
    } else if (Pacman.distro().familyId === 'alpine') {
      isUefi = true
    } else if (Pacman.distro().familyId === 'opensuse') {
      isUefi = true
    } else if (Pacman.distro().familyId === 'void') {
      isUefi = true
    }

    return isUefi
  }

  /**
   * Installa manPage
   */
  static async manPageInstall(verbose = false) {
    const manPageSrc = path.resolve(__dirname, '../../manpages/doc/man/eggs.roll.gz')
    if (fs.existsSync(manPageSrc)) {
      const man1Dir = '/usr/share/man/man1/'
      if (!fs.existsSync(man1Dir)) {
        exec(`mkdir ${man1Dir} -p`)
      }

      const manPageDest = man1Dir + 'eggs.1.gz'
      exec(`cp ${manPageSrc} ${manPageDest}`)
      if (shx.exec('which mandb', { silent: true }).stdout.trim() !== '') {
        await exec('mandb > /dev/null')
        if (verbose) {
          console.log('manPage eggs installed...')
        }
      }
    }
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
    } else if (this.distro().familyId === 'alpine') {
      retVal = await Alpine.packageInstall(packageName)
    } else if (this.distro().familyId === 'opensuse') {
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
    if (this.distro().familyId === 'debian') {
      installed = Debian.packageIsInstalled(packageName)
    } else if (this.distro().familyId === 'fedora') {
      installed = Fedora.packageIsInstalled(packageName)
    } else if (this.distro().familyId === 'archlinux') {
      installed = Archlinux.packageIsInstalled(packageName)
    } else if (this.distro().familyId === 'alpine') {
      installed = Alpine.packageIsInstalled(packageName)
    } else if (this.distro().familyId === 'opensuse') {
      installed = Opensuse.packageIsInstalled(packageName)
    }

    return installed
  }

  static async packageNpmLast(packageNpm = 'penguins-eggs'): Promise<string> {
    return shx.exec('npm show ' + packageNpm + ' version', { silent: true }).stdout.trim()
  }

  /**
   *
   * @returns grub
   */
  static whichGrubIsInstalled(): string {
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
    } else if (this.distro().familyId === 'alpine') {
      grubInstalled = 'grub'
    } else if (this.distro().familyId === 'opensuse') {
      grubInstalled = 'grub'
    } else if (this.distro().familyId === 'void') {
      grubInstalled = 'grub'
    }

    return grubInstalled
  }
}
