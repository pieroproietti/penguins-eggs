/**
 * ./src/classes/ovary.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */ 

import chalk from 'chalk'
import fs, { Dirent } from 'node:fs'
import { constants } from 'node:fs'
import path from 'node:path'

// interfaces
import { IAddons, IExcludes, IWorkDir } from '../interfaces/index.js'

// libraries
import CliAutologin from './cli-autologin.js'
import Incubator from './incubation/incubator.js'
import Settings from './settings.js'

// methods
import { fertilization } from './ovary.d/fertilization.js'
import { produce } from './ovary.d/produce.js'
import { bindLiveFs, uBindLiveFs } from './ovary.d/bind-live-fs.js'
import { bindVfs, ubindVfs } from './ovary.d/bind-vfs.js'
import { editLiveFs } from './ovary.d/edit-live-fs.js'
import { makeSquashfs, addExclusion } from './ovary.d/make-squashfs.js'
import { makeEfi } from './ovary.d/make-efi.js'
import { xorrisoCommand } from './ovary.d/xorriso-command.js'
import { createXdgAutostart } from './ovary.d/create-xdg-autostart.js'
import { copied, merged, mergedAndOverlay } from './ovary.d/merged.js'
import { makeIso } from './ovary.d/make-iso.js'
import { initrdAlpine, initrdArch, initrdDebian, initrdDracut } from './ovary.d/initrd.js'
import { userCreateLive } from './ovary.d/user-create-live.js'
import { syslinux } from './ovary.d/syslinux.js'
import { usersRemove } from './ovary.d/users-remove.js'
import { makeDotDisk } from './ovary.d/make-dot-disk.js'
import { kernelCopy } from './ovary.d/kernel-copy.js'
import { liveCreateStructure } from './ovary.d/live-create-structure.js'
import { finished } from './ovary.d/finished.js'

// crypt
import { luksExecuteCommand, buildLuksFormatArgs } from './ovary.d/luks-helpers.js'
import { luksGetPassword } from './ovary.d/luks-get-password.js'
import { interactiveCryptoConfig, CryptoConfig } from './ovary.d/luks-interactive-crypto-config.js'

// homecrypt
import { luksHome } from './ovary.d/luks-home.js'
import { installHomecryptSupport } from './ovary.d/luks-home-support.js'

// fullcrypt
import { luksRootInitrd } from './ovary.d/luks-root-initrd.js'
import { luksRoot } from './ovary.d/luks-root.js'

// get directory name
const __dirname = path.dirname(new URL(import.meta.url).pathname)

/**
 * Ovary class — responsible for managing the full ISO creation lifecycle.
 */
export default class Ovary {
  cliAutologin = new CliAutologin()

  compression = ''
  clone = false
  homecrypt = false
  fullcrypt = false
  hidden = false
  echo: Record<string, unknown> = {} // new change [1]
  familyId = ''
  distroId = ''
  distroLike = ''
  distroLiveMediumPath = '' // new change [2] — fixed typo from distroLliveMediumPath
  genisoimage = false
  incubator: Incubator | null = null // new change [3]
  settings: Settings | null = null // new change [4]
  snapshot_basename = ''
  snapshot_prefix = ''
  theme = ''
  toNull = ''
  verbose = false
  volid = ''
  uuid = ''
  kernel = ''
  initrd = ''
  vmlinuz = ''
  nest = ''
  dotMnt = ''
  dotOverlay: IWorkDir | null = null
  dotLivefs = ''
  luksMappedName = ''
  luksMountpoint = ''
  luksFile = ''
  luksDevice = ''
  luksPassword = ''
  luksConfig: CryptoConfig | null = null // new change [5]

  // Primary build lifecycle methods
  public fertilization = fertilization
  public produce = produce

  // Utility and sub-stages
  addExclusion = addExclusion
  bindLiveFs = bindLiveFs
  bindVfs = bindVfs
  copied = copied
  createXdgAutostart = createXdgAutostart
  editLiveFs = editLiveFs
  luksExecuteCommand = luksExecuteCommand
  buildLuksFormatArgs = buildLuksFormatArgs
  luksGetPassword = luksGetPassword
  interactiveCryptoConfig = interactiveCryptoConfig
  luksHome = luksHome
  installHomecryptSupport = installHomecryptSupport
  luksRoot = luksRoot
  finished = finished
  initrdAlpine = initrdAlpine
  initrdArch = initrdArch
  initrdDebian = initrdDebian
  luksRootInitrd = luksRootInitrd
  initrdDracut = initrdDracut
  kernelCopy = kernelCopy
  liveCreateStructure = liveCreateStructure
  makeDotDisk = makeDotDisk
  makeEfi = makeEfi
  makeIso = makeIso
  makeSquashfs = makeSquashfs
  merged = merged
  mergedAndOverlay = mergedAndOverlay
  syslinux = syslinux
  uBindLiveFs = uBindLiveFs
  ubindVfs = ubindVfs
  userCreateLive = userCreateLive
  usersRemove = usersRemove
  xorrisoCommand = xorrisoCommand

  /**
   * Initialize internal components safely.
   * Prevents uninitialized class references from causing runtime errors.
   */
  constructor() { // new change [6]
    try {
      this.incubator = new Incubator()
      this.settings = new Settings()
      chalk.blue('🐣 Ovary initialized successfully.')
    } catch (err) {
      console.error(chalk.red('❌ Failed to initialize Ovary components:'), err)
    }
  }

  /**
   * Validate the environment before ISO creation.
   * This ensures all prerequisites (e.g., kernel, initrd, directories) exist.
   */
  validateEnvironment(): boolean { // new change [7]
    const required = [this.kernel, this.initrd, this.vmlinuz]
    const missing = required.filter(f => !f || !fs.existsSync(f))
    if (missing.length > 0) {
      console.error(chalk.red('⚠️ Missing critical boot files:'), missing)
      return false
    }
    return true
  }

  /**
   * Display current build configuration in readable form.
   */
  printConfig(): void { // new change [8]
    console.log(chalk.cyan('\n🧬 Ovary Build Configuration'))
    console.log('--------------------------------------')
    console.log(`Distro:       ${this.distroId || 'unknown'}`)
    console.log(`Family:       ${this.familyId || 'unknown'}`)
    console.log(`Compression:  ${this.compression || 'default'}`)
    console.log(`Crypt Mode:   ${this.fullcrypt ? 'Full' : this.homecrypt ? 'Home' : 'None'}`)
    console.log(`Theme:        ${this.theme || 'default'}`)
    console.log(`Snapshot:     ${this.snapshot_basename}`)
    console.log(`Verbose:      ${this.verbose}`)
  }

  /**
   * Execute the full ISO creation lifecycle safely.
   * (Wrapper for produce/fertilization)
   */
  async runFullBuild(): Promise<void> { // new change [9]
    this.printConfig()
    if (!this.validateEnvironment()) return
    console.log(chalk.yellow('\n🚀 Starting full ISO build...'))
    await this.fertilization()
    await this.produce()
    await this.finished()
    console.log(chalk.green('\n✅ ISO build completed successfully!'))
  }
}
