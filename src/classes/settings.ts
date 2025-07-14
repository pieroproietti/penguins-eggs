/**
 * ./src/classes/settings.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import chalk from 'chalk'
import yaml from 'js-yaml'
// packages
import fs from 'node:fs'
import os from 'node:os'
import shx from 'shelljs'
// pjson
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const pjson = require('../../package.json')

// interfaces
import { IApp, IDistro, IRemix, IWorkDir } from '../interfaces/index.js'
import { IEggsConfig } from '../interfaces/index.js'
import Distro from './distro.js'
import Incubator from './incubation/incubator.js'
import Pacman from './pacman.js'
// classes
import Utils from './utils.js'

const config_file = '/etc/penguins-eggs.d/eggs.yaml' as string

/**
 * Setting
 */
export default class Settings {
  app = {} as IApp

  config = {} as IEggsConfig

  distro = {} as IDistro

  // efi_work = ''

  i686 = false

  incubator = {} as Incubator

  initrd_image = ''

  initrdImg = ''

  isLive = false

  iso_work = ''

  isoFilename = ''

  kernel_image = ''

  remix = {} as IRemix

  session_excludes = ''

  vmlinuz = ''

  work_dir = {} as IWorkDir // resulting name of the iso

  constructor(compression = '') {
    this.config.compression = compression

    this.app.author = 'Piero Proietti'
    this.app.homepage = 'https://github.com/pieroproietti/penguins-eggs'
    this.app.mail = 'piero.proietti@gmail.com'
    this.app.name = pjson.name
    this.app.version = pjson.version
    this.isLive = Utils.isLive()
    this.i686 = Utils.isi686()
    this.distro = new Distro()
  }

  /**
   * Calculate and show free space on the disk
   * @returns {void}
   */
  async listFreeSpace(): Promise<void> {
    if (!fs.existsSync(this.config.snapshot_dir)) {
      fs.mkdirSync(this.config.snapshot_dir)
      if (!fs.existsSync(this.config.snapshot_mnt)) {
        fs.mkdirSync(this.config.snapshot_mnt)
      }
    }

    /** Lo spazio usato da SquashFS non è stimabile da live
     * errore buffer troppo piccolo
     */
    const gb = 1_048_576
    let spaceAvailable = 0
    if (!Utils.isLive()) {
      console.log(`Disk space used: ${Math.round((Utils.getUsedSpace() / gb) * 10) / 10} GB`)
    }

    spaceAvailable = Number(
      shx
        .exec(`df "${this.config.snapshot_mnt}" | /usr/bin/awk 'NR==2 {print $4}'`, {
          silent: true
        })
        .stdout.trim()
    )
    console.log(`Space available: ${Math.round((spaceAvailable / gb) * 10) / 10} GB`)
    console.log(`There are ${Utils.getSnapshotCount(this.config.snapshot_mnt)} snapshots taking ${Math.round((Utils.getSnapshotSize(this.config.snapshot_mnt) / gb) * 10) / 10} GB of disk space.`)
    console.log()

    if (spaceAvailable > gb * 3) {
      console.log(chalk.cyanBright('The free space should be sufficient to hold the'))
      console.log(chalk.cyanBright('compressed data from the system'))
    } else {
      console.log(chalk.redBright('The free space should be insufficient') + '.')
      console.log()
      if (Utils.isMountpoint(this.config.snapshot_mnt)) {
        console.log('If necessary, you can create more available space')
        console.log('by removing previous  snapshots and saved copies.')
      } else {
        console.log(`You can mount a free partition under ${this.config.snapshot_mnt}`)
      }

      console.log()
    }
  }

  /**
   * Load configuration from config_file
   * @returns {boolean} Success
   */
  async load(): Promise<boolean> {
    const foundSettings = true

    if (!fs.existsSync(config_file)) {
      console.log(`cannot find configuration file ${config_file},`)
      console.log('please generate it with: sudo eggs config')
      process.exit(1)
    }

    this.config = yaml.load(fs.readFileSync(config_file, 'utf8')) as IEggsConfig

    this.session_excludes = ''
    if (!this.config.snapshot_dir.endsWith('/')) {
      this.config.snapshot_dir += '/'
    }

    this.work_dir.ovarium = this.config.snapshot_dir + 'ovarium/'

    // hidden .mnt under nest
    this.config.snapshot_mnt = this.config.snapshot_dir + '.mnt/'
    if (!this.config.snapshot_mnt.endsWith('/')) {
      this.config.snapshot_mnt += '/'
    }

    // hidden .overlay under nest was under ovarium
    this.work_dir.lowerdir = this.config.snapshot_dir + '.overlay/lowerdir'
    this.work_dir.upperdir = this.config.snapshot_dir + '.overlay/upperdir'
    this.work_dir.workdir = this.config.snapshot_dir + '.overlay/workdir'

    this.work_dir.merged = this.config.snapshot_mnt + 'filesystem.squashfs'
    // this.efi_work = this.config.snapshot_mnt + 'efi-work/'
    this.iso_work = this.config.snapshot_mnt + 'iso/'

    // remember: before was hostname, not empty
    if (this.config.snapshot_basename === '') {
      this.config.snapshot_basename = os.hostname()
    }

    if (this.config.make_efi && !Pacman.isUefi() && Utils.uefiArch() === 'amd64') {
      Utils.error('You choose to create an UEFI image, but miss to install grub-efi-amd64-bin package.')
      Utils.error('Please install it before to create an UEFI image:')
      Utils.warning('sudo apt install grub-efi-amd64-bin')
      Utils.error('or edit /etc/penguins-eggs.d/eggs.yaml and set the valuer of make_efi = false')
      this.config.make_efi = false
    }

    this.kernel_image = this.config.vmlinuz
    this.initrd_image = this.config.initrd_img
    this.vmlinuz = this.kernel_image.slice(this.kernel_image.lastIndexOf('/'))
    this.initrdImg = this.initrd_image.slice(this.initrd_image.lastIndexOf('/'))

    /**
     * Use the login name set in the config file. If not set, use the primary
     * user's name. If the name is not "user" then add boot option. ALso use
     * the same username for cleaning geany history.
     */
    if (
      (this.config.user_opt === undefined || this.config.user_opt === '') && // this.user_opt = shx.exec('awk -F":" \'/1000:1000/ { print $1 }\' /etc/passwd', { silent: true }).stdout.trim()
      this.config.user_opt === ''
    ) {
      this.config.user_opt = 'live'
    }

    if (this.config.user_opt_passwd === '') {
      this.config.user_opt_passwd = 'evolution'
    }

    if (this.config.root_passwd === '') {
      this.config.root_passwd = 'evolution'
    }

    if (this.config.timezone === undefined || this.config.timezone === '') {
      this.config.timezone = shx.exec('cat /etc/timezone', { silent: true }).stdout.trim()
    }

    return foundSettings
  }

  /**
   *
   * @param basename
   * @param theme
   */
  async loadRemix(theme = '') {
    this.remix.versionNumber = Utils.getPackageVersion()
    this.remix.kernel = Utils.kernelVersion()

    this.remix.branding = theme === '' ? 'eggs' : (this.remix.branding = theme.slice(Math.max(0, theme.lastIndexOf('/') + 1)))
    this.remix.name = this.config.snapshot_basename
    let name = this.config.snapshot_prefix + this.config.snapshot_basename
    name = name.replaceAll('-', ' ').replaceAll('_', ' ').replace('egg of ', '')
    this.remix.fullname = name
    this.remix.versionName = name.toUpperCase()
  }

  /**
   *
   * @param config
   */
  async save(config: IEggsConfig) {
    const ordered = Utils.sortObjectKeys(config)
    fs.writeFileSync(config_file, yaml.dump(ordered), 'utf-8')
  }
}
