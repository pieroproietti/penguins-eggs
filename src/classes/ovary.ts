/**
 * ./src/classes/ovary.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import chalk from 'chalk'
// packages
import fs, { Dirent } from 'node:fs'
import { constants } from 'node:fs'
// backup
import path from 'node:path'

// interfaces
import { IAddons, IExcludes, IWorkDir } from '../interfaces/index.js'
// libraries
import CliAutologin from './cli-autologin.js'
import Incubator from './incubation/incubator.js'
import { bindLiveFs, uBindLiveFs } from './ovary.d/bind-live-fs.js'
import { bindVfs, ubindVfs } from './ovary.d/bind-vfs.js'
import { createXdgAutostart } from './ovary.d/create-xdg-autostart.js'
import { editLiveFs } from './ovary.d/edit-live-fs.js'
// Methods
import { fertilization } from './ovary.d/fertilization.js'
import { finished } from './ovary.d/finished.js'
import { initrdAlpine, initrdArch, initrdDebian, initrdDracut } from './ovary.d/initrd.js'
import { kernelCopy } from './ovary.d/kernel-copy.js'
import { liveCreateStructure } from './ovary.d/live-create-structure.js'
import { luksGetPassword } from './ovary.d/luks-get-password.js'
// crypt
import { buildLuksFormatArgs, luksExecuteCommand } from './ovary.d/luks-helpers.js'
import { installHomecryptSupport } from './ovary.d/luks-home-support.js'
// homecrypt
import { luksHome } from './ovary.d/luks-home.js'
import { ArgonCryptoConfig, CryptoConfig, interactiveCryptoConfig, Pbkdf2CryptoConfig } from './ovary.d/luks-interactive-crypto-config.js'
// fullcrypt
import { luksRootInitrd } from './ovary.d/luks-root-initrd.js'
import { luksRoot } from './ovary.d/luks-root.js'
import { luksShrink } from './ovary.d/luks-shrink.js'
import { makeDotDisk } from './ovary.d/make-dot-disk.js'
import { makeEfi } from './ovary.d/make-efi.js'
import { makeIso } from './ovary.d/make-iso.js'
import { addExclusion, makeSquashfs } from './ovary.d/make-squashfs.js'
import { copied, merged, mergedAndOverlay } from './ovary.d/merged.js'
import { produce } from './ovary.d/produce.js'
import { syslinux } from './ovary.d/syslinux.js'
import userCreateLive from './ovary.d/user-create-live.js'
import usersRemove from './ovary.d/users-remove.js'
import { xorrisoCommand } from './ovary.d/xorriso-command.js'
import Settings from './settings.js'

// _dirname
const __dirname = path.dirname(new URL(import.meta.url).pathname)

/**
 * Ovary:
 */
export default class Ovary {
  // called only inside Ovary
  addExclusion = addExclusion
bindLiveFs = bindLiveFs
bindVfs = bindVfs
buildLuksFormatArgs = buildLuksFormatArgs
cliAutologin = new CliAutologin()
clone = false
compression = ''
copied = copied
createXdgAutostart = createXdgAutostart
distroId = ''
distroLike = ''
distroLiveMediumPath = ''
dotLivefs = ''
dotMnt = ''
dotOverlay = {} as IWorkDir
echo = {}
editLiveFs = editLiveFs
familyId = ''
// I put all methods on ovary.d
  public fertilization = fertilization
finished = finished
fullcrypt = false
genisoimage = false
hidden = false
homecrypt = false
incubator = {} as Incubator
initrd = ''
initrdAlpine = initrdAlpine
initrdArch = initrdArch
initrdDebian = initrdDebian
initrdDracut = initrdDracut
installHomecryptSupport = installHomecryptSupport
interactiveCryptoConfig = interactiveCryptoConfig
kernel = ''
kernelCopy = kernelCopy
liveCreateStructure = liveCreateStructure
  luksConfig = {} as CryptoConfig
luksDevice = ''
  // luks
  luksExecuteCommand = luksExecuteCommand
  luksFile = ''
  luksGetPassword = luksGetPassword
  // luksHome
  luksHome = luksHome
  luksMappedName = ''
  luksMountpoint = ''
  luksPassword = ''
  // luksRoot
  luksRoot = luksRoot
  luksRootInitrd = luksRootInitrd
  luksShrink = luksShrink
makeDotDisk = makeDotDisk
  makeEfi = makeEfi
makeIso = makeIso
makeSquashfs = makeSquashfs
  merged = merged
  mergedAndOverlay = mergedAndOverlay
  nest = ''
  public produce = produce
  settings = {} as Settings
  snapshot_basename = ''
  snapshot_prefix = ''
  syslinux = syslinux
  theme = ''
  toNull = ''
  uBindLiveFs = uBindLiveFs
  ubindVfs = ubindVfs
  userCreateLive = userCreateLive
  usersRemove = usersRemove
  uuid = ''
  verbose = false
  vmlinuz = ''
  volid = ''
  xorrisoCommand = xorrisoCommand
}

