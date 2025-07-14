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
import { access } from 'node:fs/promises'
import path from 'node:path'
import shx from 'shelljs'

// interfaces
import { IAddons, IExcludes } from '../interfaces/index.js'

// libraries
import { exec } from '../lib/utils.js'
import CliAutologin from './cli-autologin.js'
import Incubator from './incubation/incubator.js'
import Settings from './settings.js'
import Users from './users.js'
import Diversions from './diversions.js'

// classes
import Utils from './utils.js'
import Repo from './yolk.js'

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

// Functions
import rexec from './ovary.d/rexec.js'


// _dirname
const __dirname = path.dirname(new URL(import.meta.url).pathname)

/**
 * Ovary:
 */
export default class Ovary {
  cliAutologin = new CliAutologin()

  clone = false

  compression = ''

  cryptedclone = false

  echo = {}

  familyId = ''

  distroId = ''

  distroLike = ''

  genisoimage = false

  incubator = {} as Incubator

  nest = ''

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

  // I put all methods on ovary.d
  public fertilization = fertilization
  public produce = produce

  // called only inside Ovary
  bindLiveFs = bindLiveFs
  bindVfs = bindVfs
  editLiveFs = editLiveFs
  makeEfi = makeEfi
  makeSquashfs = makeSquashfs
  addExclusion = addExclusion
  xorrisoCommand = xorrisoCommand
  createXdgAutostart = createXdgAutostart
  copied = copied
  merged = merged
  mergedAndOverlay = mergedAndOverlay
  makeIso = makeIso
  initrdAlpine = initrdAlpine
  initrdArch = initrdArch
  initrdDebian = initrdDebian
  initrdDracut = initrdDracut
  userCreateLive = userCreateLive
  syslinux = syslinux
  uBindLiveFs = uBindLiveFs
  ubindVfs = ubindVfs
  usersRemove = usersRemove
  makeDotDisk = makeDotDisk
  kernelCopy = kernelCopy
  liveCreateStructure = liveCreateStructure
  finished = finished
}

