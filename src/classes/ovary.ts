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
import Settings from './settings.js'

// Methods
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

import { luksGetPassword } from './ovary.d/luks-get-password.js'
import { luksHome } from './ovary.d/luks-home.js'
import { installHomecryptSupport } from './ovary.d/luks-home-support.js'

import { luksRoot } from './ovary.d/luks-root.js'
import { installEncryptedRootSupport } from './ovary.d/luks-root-support.js'
import { 
    createDecryptInitramfs, 
    updateIsolinuxForMultipleInitramfs, 
    updateGrubForMultipleInitramfs 
  } from './ovary.d/luks-root-additional-initramfs.js'
// Functions
// import initramfs from '../krill/classes/sequence.d/initramfs.js'


// _dirname
const __dirname = path.dirname(new URL(import.meta.url).pathname)

/**
 * Ovary:
 */
export default class Ovary {
  cliAutologin = new CliAutologin()

  compression = ''

  clone = false

  homecrypt = false

  fullcrypt = false

  echo = {}

  familyId = ''

  distroId = ''

  distroLike = ''

  distroLliveMediumPath = ''

  genisoimage = false

  incubator = {} as Incubator

  settings = {} as Settings

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

  dotOverlay = {} as IWorkDir

  dotLivefs = ''

  luksUuid = ''

  luksName = ''

  luksMappedName = ''

  luksMountpoint = ''

  luksFile = ''

  luksDevice = ''

  luksPassword = ''



  // I put all methods on ovary.d
  public fertilization = fertilization
  public produce = produce

  // called only inside Ovary
  addExclusion = addExclusion
  bindLiveFs = bindLiveFs
  bindVfs = bindVfs
  copied = copied
  createXdgAutostart = createXdgAutostart
  editLiveFs = editLiveFs
  // luks
  luksGetPassword = luksGetPassword
  // luksHome
  luksHome = luksHome
  installHomecryptSupport = installHomecryptSupport
  // luksRoot
  luksRoot = luksRoot
  installEncryptedRootSupport = installEncryptedRootSupport
  createDecryptInitramfs = createDecryptInitramfs
  updateIsolinuxForMultipleInitramfs = updateIsolinuxForMultipleInitramfs
  updateGrubForMultipleInitramfs = updateGrubForMultipleInitramfs


  finished = finished
  initrdAlpine = initrdAlpine
  initrdArch = initrdArch
  initrdDebian = initrdDebian
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
}

