/**
 * Sequence - Simple Refactoring
 * ./src/krill/sequence.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import { IRemix, IDistro, INet } from '../../interfaces/index.js'
import Settings from '../../classes/settings.js'
import React from 'react'
import { render, RenderOptions, Box, Text } from 'ink'
import Install from '../components/install.js'
import Finished from '../components/finished.js'
import fs from 'fs'
import yaml from 'js-yaml'
import { installer } from '../../classes/incubation/installer.js'
import CliAutologin from '../../classes/cli-autologin.js'
import Distro from '../../classes/distro.js'
import Pacman from '../../classes/pacman.js'
import Utils from '../../classes/utils.js'
import Xdg from '../../classes/xdg.js'
import { IInstaller, IDevices, IDevice } from '../../interfaces/index.js'
import { ICalamaresModule, ILocation, IKeyboard, IPartitions, IUsers } from '../interfaces/i_krill.js'
import { exec, spawnSync } from '../../lib/utils.js'

// Import all modules (unchanged)
import partition from './sequence.d/partition.js'
import biosStandard from './sequence.d/partition.d/bios_standard.js'
import biosLuks from './sequence.d/partition.d/bios_luks.js'
import uefiStandard from './sequence.d/partition.d/uefi_standard.js'
import uefiLuks from './sequence.d/partition.d/uefi_luks.js'
import { mountFs, umountFs } from './sequence.d/mount_fs.js'
import { mountVfs, umountVfs } from './sequence.d/mount_vfs.js'
import unpackfs from './sequence.d/unpackfs.js'
import machineId from './sequence.d/machine_id.js'
import fstab from './sequence.d/fstab.js'
import locale from './sequence.d/locale.js'
import mKeyboard from './sequence.d/m_keyboard.js'
import localeCfg from './sequence.d/locale_cfg.js'
import addUser from './sequence.d/add_user.js'
import changePassword from './sequence.d/change_password.js'
import networkCfg from './sequence.d/network_cfg.js'
import bootloaderConfig from './sequence.d/bootloader_config.js'
import grubcfg from './sequence.d/grubcfg.js'
import bootloader from './sequence.d/bootloader.js'
import packages from './sequence.d/packages.js'
import removeInstallerLink from './sequence.d/remove_installer_link.js'
import initramfsCfg from './sequence.d/initramfs_cfg.js'
import initramfs from './sequence.d/initramfs.js'
import delLiveUser from './sequence.d/del_live_user.js'
import umount from './sequence.d/umount.js'
import mkfs from './sequence.d/mkfs.js'
import hostname from './sequence.d/hostname.js'
import CFS from './cfs.js'
import Title from '../components/title.js'
import cliCursor from 'cli-cursor'

/**
 * Main Sequence class - Simple Refactoring
 */
export default class Sequence {
  // All module references (unchanged)
  partition = partition
  partitionBiosStandard = biosStandard
  partitionUefiStandard = uefiStandard
  partitionBiosLuks = biosLuks
  partitionUefiLuks = uefiLuks
  mountFs = mountFs
  mountVfs = mountVfs
  unpackfs = unpackfs
  machineId = machineId
  fstab = fstab
  locale = locale
  keyboard = mKeyboard
  localeCfg = localeCfg
  addUser = addUser
  changePassword = changePassword
  networkCfg = networkCfg
  bootloaderConfig = bootloaderConfig
  grubcfg = grubcfg
  bootloader = bootloader
  packages = packages
  removeInstallerLink = removeInstallerLink
  initramfsCfg = initramfsCfg
  initramfs = initramfs
  delLiveUser = delLiveUser
  umountFs = umountFs
  umountVfs = umountVfs
  umount = umount
  mkfs = mkfs
  hostname = hostname

  // All properties (unchanged)
  installer = {} as IInstaller
  installTarget = '/tmp/calamares-krill-root'
  verbose = false
  echo = {}
  efi = false
  devices = {} as IDevices
  users = {} as IUsers
  network = {} as INet
  partitions = {} as IPartitions
  swapSize: number = 0
  language = ''
  region = ''
  zone = ''
  keyboardModel = ''
  keyboardLayout = ''
  keyboardVariant = ''
  toNull = ' > /dev/null 2>&1'
  spinner = true
  settings = {} as Settings
  remix = {} as IRemix
  distro = {} as IDistro
  luksMappedName = 'luks-volume'                    // encrypted ISOs
  luksFile = ``                               // encrypted ISOs
  luksDevice = `/dev/mapper/${this.luksMappedName}` // encrypted ISOs
  luksMountpoint = `/mnt`                     // encrypted ISOs
  luksRootName = ''                           // installation encrypted
  is_clone = fs.existsSync('/etc/penguins-eggs.d/is_clone')
  is_crypted_clone = fs.existsSync('/etc/penguins-eggs.d/is_crypted_clone')
  unattended = false
  nointeractive = false
  chroot = false
  halt = false
  cliAutologin = new CliAutologin()

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
    this.luksFile = `${this.distro.liveMediumPath}live/${this.luksMappedName}`
    this.luksRootName = `${this.distro.distroLike}_root`   
    this.luksRootName = this.luksRootName.toLowerCase() // installation encrypted
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

  /**
   * Main installation sequence - Linear and clear
   */
  private async runInstallationSequence(chroot=false): Promise<void> {
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

    // 6. Crypted clone restoration
    if (this.is_crypted_clone) {
      await this.executeStep("Restore private data from crypted clone", 55, async () => {
        if (fs.existsSync(this.luksFile)) {
          const cmd = `eggs syncfrom --rootdir /tmp/calamares-krill-root/ --file ${this.luksFile}`
          await exec(cmd, Utils.setEcho(true))
          this.is_clone = true
        } else {
          await Utils.pressKeyToExit(`Cannot find luks-volume file ${this.luksFile}`)
        }
      })
    }

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
            await Xdg.autologin(await Utils.getPrimaryUser(), this.users.username, this.installTarget)
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
    await this.executeStep("initramfs configure", 86, () => this.initramfsCfg(this.partitions.installationDevice))
    await this.executeStep("initramfs", 87, () => this.initramfs())

    // 11. Bootloader configuration
    await this.executeStep("bootloader-config", 81, () => this.bootloaderConfig())
    await this.executeStep("grubcfg", 82, () => this.grubcfg())
    await this.executeStep("bootloader", 83, () => this.bootloader())

    // 12. Final system setup
    if (this.distro.familyId === 'debian') {
      await this.executeStep("Remove sources-yolk", 84, () => this.execCalamaresModule('sources-yolk-undo'))
    }

    await this.executeStep("Add/remove packages", 85, () => this.packages())
    await this.executeStep("Remove GUI installer link", 88, () => this.removeInstallerLink())

    await this.executeStep("Cleanup", 89, async () => {
      await exec(`rm -f ${this.installTarget}/etc/penguins-eggs.d/is_clone`)
      await exec(`rm -f ${this.installTarget}/etc/penguins-eggs.d/is_crypted_clone`)
    })

    // 13. Custom final steps
    const cfs = new CFS()
    const steps = await cfs.steps()
    if (steps.length > 0) {
      for (const step of steps) {
        await this.executeStep(`running ${step}`, 90, () => this.execCalamaresModule(step))
      }
    }

    // 14- Handle chroot if requested
    if (chroot) {
      const message = `You are in chroot mode under ${this.installTarget}, type "exit" to exit.`
      await this.emergencyShell(message)
    }

    // 15. Unmounting
    await this.executeStep("umount Virtual File System", 96, () => this.umountVfs())
    await this.executeStep("umount File system", 99, () => this.umountFs())
    
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
      installationDevice={this.partitions.installationDevice}
      hostName={this.users.hostname}
      userName={this.users.username}
      message={message} />)

    if (this.unattended && this.nointeractive) {
      await sleep(5000)
    } else {
      spawnSync('read _ ', [], { shell: true, stdio: [0, 1, 2] })
    }

    await exec(cmd, { echo: false })
  }

  // Keep all existing methods unchanged
  async execCalamaresModule(name: string) {
    const moduleName = this.installer.multiarchModules + name + '/module.desc'
    if (fs.existsSync(moduleName)) {
      const calamaresModule = yaml.load(fs.readFileSync(moduleName, 'utf8')) as ICalamaresModule
      let command = calamaresModule.command
      if (command !== '' || command !== undefined) {
        command += this.toNull
        await exec(command, this.echo)
      }
    }
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
      await Utils.pressKeyToExit(JSON.stringify(error))
    }
  }

  async showProblem(message: string, currErr: any) {
    message = `We was on "${message}", get error: ${JSON.stringify(currErr)}, type "exit" to exit from krill emergency shell.`
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
      await Utils.pressKeyToExit(JSON.stringify(error))
    }
  }
}

// Helper functions (unchanged)
async function redraw(elem: JSX.Element) {
  let opt: RenderOptions = {}
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