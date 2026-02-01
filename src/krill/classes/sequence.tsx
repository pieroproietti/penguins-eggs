/**
 * Sequence - Simple Refactoring
 * ./src/krill/sequence.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import path from 'path'
const __dirname = path.dirname(new URL(import.meta.url).pathname)

import cliCursor from 'cli-cursor'
import fs from 'fs'
import { Box, render, RenderOptions, Text } from 'ink'
import yaml from 'js-yaml'
import React from 'react'

import CliAutologin from '../../classes/cli-autologin.js'
import Distro from '../../classes/distro.js'
import { installer } from '../../classes/incubation/installer.js'
import Pacman from '../../classes/pacman.js'
import Settings from '../../classes/settings.js'
import Utils from '../../classes/utils.js'
import Xdg from '../../classes/xdg.js'
import { IDevice, IDevices, IDistro, IInstaller, INet, IRemix } from '../../interfaces/index.js'
import { exec, spawnSync } from '../../lib/utils.js'
import Finished from '../components/finished.js'
import Install from '../components/install.js'
import Title from '../components/title.js'
import { ICalamaresModule, IKeyboard, ILocation, IPartitions, IUsers } from '../interfaces/i_krill.js'
import CFS from './cfs.js'
import addUser from './sequence.d/add_user.js'
import bootloader from './sequence.d/bootloader.js'
import bootloaderConfig from './sequence.d/bootloader_config.js'
import changePassword from './sequence.d/change_password.js'
import delLiveUser from './sequence.d/del_live_user.js'
import fstab from './sequence.d/fstab.js'
import grubcfg from './sequence.d/grubcfg.js'
import hostname from './sequence.d/hostname.js'
import initramfs from './sequence.d/initramfs.js'
import initramfsCfg from './sequence.d/initramfs_cfg.js'
import locale from './sequence.d/locale.js'
import localeCfg from './sequence.d/locale_cfg.js'
import mKeyboard from './sequence.d/m_keyboard.js'
import machineId from './sequence.d/machine_id.js'
import mkfs from './sequence.d/mkfs.js'
import { mountFs, umountFs } from './sequence.d/mount_fs.js'
import { mountVfs, umountVfs } from './sequence.d/mount_vfs.js'
import networkCfg from './sequence.d/network_cfg.js'
import packages from './sequence.d/packages.js'
import biosLuks from './sequence.d/partition.d/bios_luks.js'
import biosStandard from './sequence.d/partition.d/bios_standard.js'
import uefiLuks from './sequence.d/partition.d/uefi_luks.js'
import uefiStandard from './sequence.d/partition.d/uefi_standard.js'
// Import all modules (unchanged)
import partition from './sequence.d/partition.js'
import removeHomecryptHack from './sequence.d/remove-homecrypt-hack.js'
import removeInstallerLink from './sequence.d/remove_installer_link.js'
import umount from './sequence.d/umount.js'
import unpackfs from './sequence.d/unpackfs.js'

/**
 * Main Sequence class - Simple Refactoring
 */
export default class Sequence {
  addUser = addUser
  bootloader = bootloader
  bootloaderConfig = bootloaderConfig
  changePassword = changePassword
  chroot = false
  cliAutologin = new CliAutologin()
  cryptedHomeDevice = '/dev/mapper/live-home'
  delLiveUser = delLiveUser
  devices = {} as IDevices
  distro = {} as IDistro
  echo = {}
  efi = false
  fstab = fstab
  grubcfg = grubcfg
  halt = false
  hostname = hostname
  initramfs = initramfs
  initramfsCfg = initramfsCfg
  // All properties (unchanged)
  installer = {} as IInstaller
  installTarget = '/tmp/calamares-krill-root'
  is_clone = fs.existsSync('/etc/penguins-eggs.d/is_clone')
  keyboard = mKeyboard
  keyboardLayout = ''
  keyboardModel = ''
  keyboardVariant = ''
  language = ''
  locale = locale
  localeCfg = localeCfg
  // luksMappedName = 'luks-volume'                    // encrypted ISOs
  // luksFile = ``                                     // encrypted ISOs
  // luksDevice = `/dev/mapper/${this.luksMappedName}` // encrypted ISOs
  // luksMountpoint = `/mnt`
  luksRootName = ''
  machineId = machineId
  mkfs = mkfs
  mountFs = mountFs
  mountVfs = mountVfs
  network = {} as INet
  networkCfg = networkCfg
  nointeractive = false
  packages = packages
  // All module references (unchanged)
  partition = partition
  partitionBiosLuks = biosLuks
  partitionBiosStandard = biosStandard
  partitions = {} as IPartitions
  partitionUefiLuks = uefiLuks
  partitionUefiStandard = uefiStandard
  region = ''
  remix = {} as IRemix
  removeHomecryptHack = removeHomecryptHack
  removeInstallerLink = removeInstallerLink
  settings = {} as Settings
  spinner = true
  swapSize: number = 0
  toNull = ' > /dev/null 2>&1'
  umount = umount
  umountFs = umountFs
  umountVfs = umountVfs
  unattended = false
  unpackfs = unpackfs
  users = {} as IUsers
  verbose = false
  zone = ''

  /**
   * Constructor (unchanged)
   */
  constructor(location: ILocation, keyboard: IKeyboard, partitions: IPartitions, users: IUsers, network: INet) {
    this.installer = installer()
    this.settings = new Settings()
    this.language = location.language
    this.region = location.region
    this.zone = location.zone
    this.keyboardModel = keyboard.keyboardModel
    this.keyboardLayout = keyboard.keyboardLayout
    this.keyboardVariant = keyboard.keyboardVariant
    this.network = network
    this.partitions = partitions
    this.users = users
    this.devices.efi = {} as IDevice
    this.devices.boot = {} as IDevice
    this.devices.root = {} as IDevice
    this.devices.data = {} as IDevice
    this.devices.swap = {} as IDevice
    this.distro = new Distro()
    this.efi = fs.existsSync('/sys/firmware/efi/efivars');
    // this.luksFile = `${this.distro.liveMediumPath}live/${this.luksMappedName}`
    this.luksRootName = `${this.distro.distroLike}_root`
    this.luksRootName = this.luksRootName.toLowerCase() // installation encrypted
  }

  async emergencyShell(message: string) {
    try {
      await redraw(
        <>
          <Title />
          <Box>
            <Text>{message}</Text>
          </Box>
        </>
      )
      cliCursor.show()
      await exec(`chroot ${this.installTarget} /bin/bash`)
      cliCursor.hide()
    } catch (error) {
      await Utils.pressKeyToExit(error instanceof Error ? error.message : JSON.stringify(error))
    }
  }

  // Keep all existing methods unchanged
  async execCalamaresModule(name: string) {
    const moduleName = this.installer.multiarchModules + name + '/module.desc'
    if (fs.existsSync(moduleName)) {
      const calamaresModule = yaml.load(fs.readFileSync(moduleName, 'utf8')) as ICalamaresModule
      let { command } = calamaresModule
      if (command !== '' || command !== undefined) {
        command += this.toNull
        await exec(command, this.echo)
      }
    }
  }

  async showProblem(message: string, currErr: any) {
    message = `We was on "${message}", get error: ${currErr instanceof Error ? currErr.message : JSON.stringify(currErr)}, type "exit" to exit from krill emergency shell.`
    try {
      await redraw(
        <>
          <Title />
          <Box>
            <Text>{message}</Text>
          </Box>
        </>
      )
      cliCursor.show()
      await exec("/bin/bash")
      cliCursor.hide()
    } catch (error) {
      await Utils.pressKeyToExit(error instanceof Error ? error.message : JSON.stringify(error))
    }
  }

  /**
   * Main start method - Much cleaner sequence
   */
  async start(domain = '', unattended = false, nointeractive = false, chroot = false, halt = false, verbose = false) {
    // Setup (unchanged)
    await this.setupInstallation(domain, unattended, nointeractive, chroot, halt, verbose)

    // Installation sequence - each step clearly visible
    await this.runInstallationSequence(chroot)

    // Completion
    await this.completeInstallation()
  }

  /**
   * Complete installation with reboot/halt
   */
  private async completeInstallation(): Promise<void> {
    await sleep(500)

    const cmd = this.halt ? "poweroff" : "reboot"
    let message = `Press a key to ${cmd}`

    if (this.unattended && this.nointeractive) {
      message = `System will ${cmd} in 5 seconds...`
    }

    await redraw(<Finished
      hostName={this.users.hostname}
      installationDevice={this.partitions.installationDevice}
      message={message}
      userName={this.users.username} />)

    if (this.unattended && this.nointeractive) {
      await sleep(5000)
    } else {
      spawnSync('read _ ', [], { shell: true, stdio: [0, 1, 2] })
    }

    await exec(cmd, { echo: false })
  }

  /**
   * Helper method to execute a step with standard error handling
   */
  private async executeStep(message: string, percent: number, action: () => Promise<any>): Promise<void> {
    await redraw(<Install message={message} percent={percent} spinner={this.spinner} />)
    try {
      await action()
    } catch (error) {
      await this.showProblem(message, error)
    }
  }

  /**
   * Main installation sequence - Linear and clear
   */
  private async runInstallationSequence(chroot = false): Promise<void> {
    // 1. Partitioning and formatting
    let isPartitioned = false
    await this.executeStep("Creating partitions", 0, async () => {
      isPartitioned = await this.partition()
    })

    if (!isPartitioned) return

    await this.executeStep("Formatting file system", 6, () => this.mkfs())

    // 2. Mounting
    await this.executeStep("Mounting target file system", 9, async () => {
      await this.mountFs()
      await sleep(500) // Give time to mount
    })

    await this.executeStep("Mounting on target VFS", 12, () => this.mountVfs())

    // 3. System setup
    await this.executeStep("Unpacking filesystem", 15, () => this.unpackfs())

    // 4. Debian-specific steps
    if (this.distro.familyId === 'debian') {
      await this.executeStep("Force dpkg-unsafe-io", 40, () => this.execCalamaresModule('dpkg-unsafe-io'))
      await this.executeStep("Add sources-yolk", 43, () => this.execCalamaresModule('sources-yolk'))
    }

    // 5. Core system configuration
    await this.executeStep("machineid", 46, () => this.machineId())
    await this.executeStep("Creating fstab", 49, () => this.fstab(this.partitions.installationDevice))

    // 7. Network and hostname
    await this.executeStep("Network configuration", 61, () => this.networkCfg())
    await this.executeStep("Create hostname", 64, () => this.hostname(this.network.domain))

    // 8. Debian cleanup
    if (this.distro.familyId === 'debian') {
      await this.executeStep("Remove dpkg-unsafe-io", 65, () => this.execCalamaresModule('dpkg-unsafe-io-undo'))
    }

    // 9. User configuration (only if not clone)
    if (!this.is_clone) {
      // Locale
      await this.executeStep("Locale", 70, async () => {
        if (this.distro.familyId === 'alpine' ||
          this.distro.familyId === 'archlinux' ||
          this.distro.familyId === 'debian') {
          await this.locale()
        }
      })

      await this.executeStep("Settings keyboard", 71, () => this.keyboard())

      // Locale configuration
      if (this.distro.familyId === 'archlinux' || this.distro.familyId === 'debian') {
        await this.executeStep("Locale configuration", 72, async () => {
          await this.localeCfg()
          await exec("chroot " + this.installTarget + " locale-gen" + this.toNull)
        })
      }

      await this.executeStep("Remove live user", 73, () => this.delLiveUser())
      await this.executeStep(`Add user ${this.users.username}`, 74, () => this.addUser(this.users.username, this.users.password, this.users.fullname, '', '', ''))
      await this.executeStep("Add root password", 75, () => this.changePassword('root', this.users.rootPassword))

      // GUI autologin
      if (Pacman.isInstalledGui()) {
        await this.executeStep("Autologin GUI", 78, async () => {
          if (this.users.autologin) {
            await Xdg.autologin(this.users.username, this.installTarget)
            if (this.distro.distroLike === 'Arch') {
              await exec(`chroot ${this.installTarget} groupadd autologin ${this.toNull}`)
              await exec(`chroot ${this.installTarget} gpasswd -a ${this.users.username} autologin ${this.toNull}`)
            }
          }
        })
      }

    }

    // 10. Always remove CLI autologin
    await this.executeStep("Remove autologin CLI", 80, () => this.cliAutologin.remove(this.installTarget))

    // 10. mkinitramfs
    await this.executeStep("initramfs configure", 81, () => this.initramfsCfg(this.partitions.installationDevice))
    await this.executeStep("initramfs", 82, () => this.initramfs())

    // 11. Bootloader configuration
    await this.executeStep("bootloader-config", 83, () => this.bootloaderConfig())
    await this.executeStep("grubcfg", 84, () => this.grubcfg())
    await this.executeStep("bootloader", 85, () => this.bootloader())

    // 12. Final system setup
    if (this.distro.familyId === 'debian') {
      await this.executeStep("Remove sources-yolk", 86, () => this.execCalamaresModule('sources-yolk-undo'))
    }

    await this.executeStep("Add/remove packages", 87, () => this.packages())
    await this.executeStep("Remove GUI installer link", 88, () => this.removeInstallerLink())

    await this.executeStep("Cleanup", 89, async () => {
      await exec(`rm -f ${this.installTarget}/etc/penguins-eggs.d/is_clone`)
    })

    // 6. homecrypt clone restoration
    if (fs.existsSync(this.cryptedHomeDevice)) {
      await this.executeStep("Restoring data from homecrypt", 90, async () => {
        const restoreHomeCrypt = path.resolve(__dirname, '../../../scripts/restore_homecrypt_krill.sh')
        await exec(`${restoreHomeCrypt} ${this.cryptedHomeDevice} ${this.installTarget}`)
      })

      await this.executeStep("Remove Homecrypt hack", 91, async () => {
        await this.removeHomecryptHack()
      })
    }

    // 13. Custom final steps
    const cfs = new CFS()
    const steps = await cfs.steps()
    if (steps.length > 0) {
      for (const step of steps) {
        await this.executeStep(`running ${step}`, 92, () => this.execCalamaresModule(step))
      }
    }

    // 14- Handle chroot if requested
    if (chroot) {
      const message = `You are in chroot mode under ${this.installTarget}, type "exit" to exit.`
      await this.emergencyShell(message)
    }

    // Before to unmount
    await exec('sync')

    // 15. Unmounting
    await this.executeStep("umount Virtual File System", 96, () => this.umountVfs())
    await this.executeStep("umount File system", 99, () => this.umountFs())

  }

  /**
   * Setup installation parameters and environment
   */
  private async setupInstallation(domain: string, unattended: boolean, nointeractive: boolean, chroot: boolean, halt: boolean, verbose: boolean): Promise<void> {
    // Set domain
    if (domain !== '') {
      if (domain.at(0) !== '.') {
        domain = '.' + domain
      }

      this.network.domain = domain
    }

    // Arch-specific setup
    if (this.distro.familyId === 'archlinux') {
      if (this.distro.distroId === 'Manjarolinux') {
        await exec(`ln -s /run/miso/bootmnt/live/ /live`)
      } else {
        await exec(`ln -s /run/archiso/bootmnt/live/ /live`)
      }
    }

    // OpenSUSE-specific setup
    if (this.distro.familyId === 'opensuse') {
      await exec('dmsetup remove_all')
    }

    // Set flags
    this.unattended = unattended
    this.nointeractive = nointeractive
    this.chroot = chroot
    this.halt = halt
    this.verbose = verbose
    this.echo = Utils.setEcho(this.verbose)

    if (this.verbose) {
      this.toNull = ''
      this.spinner = false
    }

    await this.settings.load()
  }
}

// Helper functions (unchanged)
async function redraw(elem: React.JSX.Element) {
  const opt: RenderOptions = {}
  opt.patchConsole = false
  opt.debug = true
  console.clear()
  render(elem, opt)
}

function sleep(ms = 0) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}