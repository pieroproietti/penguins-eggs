/* eslint-disable valid-jsdoc */
/* eslint-disable no-console */

/**
 * penguins-eggs: ovary.ts VERSIONE DEBIAN-LIVE
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 *
 */

// packages
import fs = require('fs')
import os = require('os')
import yaml = require('js-yaml')
import shx = require('shelljs')
import pjson = require('pjson')
import chalk = require('chalk')

// interfaces
import { IRemix, IDistro, IApp, IWorkDir } from '../interfaces'

// libraries

// classes
import Utils from './utils'
import Incubator from './incubation/incubator'
import Distro from './distro'
import Pacman from './pacman'


const config_file = '/etc/penguins-eggs.d/eggs.yaml' as string

/**
 * Setting
 */
export default class Settings {
   app = {} as IApp

   remix = {} as IRemix

   work_dir = {} as IWorkDir

   distro = {} as IDistro

   incubator = {} as Incubator

   i686 = false

   isLive = false

   force_installer = false

   snapshot_dir = ''

   efi_work = ''

   snapshot_excludes = '/usr/local/share/excludes/penguins-eggs-exclude.list' as string

   kernel_image = '' as string

   initrd_image = '' as string

   vmlinuz = ''

   initrdImg = ''

   user_opt = '' as string // user_live

   user_opt_passwd = '' as string // passwd_live

   root_passwd = '' as string // passwd_root

   pmount_fixed = false

   ssh_pass = false

   netconfig_opt = ''

   ifnames_opt = ''

   timezone_opt = ''

   make_efi = false

   make_isohybrid = false

   make_md5sum = false

   compression = ''

   session_excludes = ''

   snapshot_basename = ''

   snapshot_prefix = 'eggs_'

   isoFilename = '' // resulting name of the iso

   version = ''

   locales: string [] = [] 

   locales_default = ''
   
   constructor(compression = '') {
      this.compression = compression

      this.app.author = 'Piero Proietti'
      this.app.homepage = 'https://github.com/pieroproietti/penguins-eggs'
      this.app.mail = 'piero.proietti@gmail.com'
      this.app.name = pjson.name as string
      this.app.version = pjson.version
      this.isLive = Utils.isLive()
      this.i686 = Utils.isi686()
      this.distro = new Distro(this.remix)
   }

   
   /**
    * 
    * @param config 
    */
   async save(config: IConfig){
      fs.writeFileSync(config_file, yaml.safeDump(config), 'utf-8')
   }

   /**
    * Load configuration from config_file
    * @returns {boolean} Success
    */
   async load(): Promise<boolean> {
      let foundSettings: boolean

      if (!fs.existsSync(config_file)) {
         console.log(`cannot find configuration file ${config_file},`)
         console.log(`please generate it with: sudo eggs prerequisites`)
         process.exit(1)
      }
      const settings = yaml.load(fs.readFileSync(config_file, 'utf-8'))
      
      this.version = settings.version

      if (settings.snapshot_dir === '') {
         foundSettings = false
      } else {
         foundSettings = true
      }

      this.session_excludes = ''
      this.snapshot_dir = settings.snapshot_dir.trim()
      if (!this.snapshot_dir.endsWith('/')) {
         this.snapshot_dir += '/'
      }
      this.work_dir.path = this.snapshot_dir + 'ovarium/'
      this.work_dir.lowerdir = this.work_dir.path + '.overlay/lowerdir'
      this.work_dir.upperdir = this.work_dir.path + '.overlay/upperdir'
      this.work_dir.workdir = this.work_dir.path + '.overlay/workdir'
      this.work_dir.merged = this.work_dir.path + 'filesystem.squashfs'

      this.efi_work = this.work_dir.path + 'efi/'
      this.work_dir.pathIso = this.work_dir.path + 'iso'

      this.snapshot_excludes = settings.snapshot_excludes
      this.snapshot_basename = settings.snapshot_basename
      if (this.snapshot_basename === 'hostname') {
         this.snapshot_basename = os.hostname()
      }
      this.snapshot_prefix = settings.snapshot_prefix
      this.make_efi = settings.make_efi
      if (this.make_efi) {
         if (! Utils.isUefi()) {
            Utils.error('You choose to create an UEFI image, but miss to install grub-efi-amd64 package.')
            Utils.error('Please install it before to create an UEFI image:')
            Utils.warning('sudo apt install grub-efi-amd64')
            Utils.error('or')
            Utils.warning('sudo apt install grub-efi-ia32')
            Utils.error('or edit /etc/penguins-eggs.d/eggs.yaml and set the valuer of make_efi=no')
            this.make_efi = false
         }
         this.locales = settings.locales
         this.locales_default = settings.locales_default
      }

      this.make_isohybrid = settings.make_isohybrid 
      this.make_md5sum = settings.make_md5sum === 'yes'
      if (this.compression === '') {
         this.compression = settings.compression
      }
      this.force_installer = settings.force_installer

      this.kernel_image = Utils.initrdImg()
      this.initrd_image = Utils.vmlinuz()
      this.vmlinuz = this.kernel_image.substr(this.kernel_image.lastIndexOf('/'))
      this.initrdImg = this.initrd_image.substr(this.initrd_image.lastIndexOf('/'))

      this.netconfig_opt = settings.netconfig_opt
      if (this.netconfig_opt === undefined) {
         this.netconfig_opt = ''
      }
      this.ifnames_opt = settings.ifnames_opt
      if (this.ifnames_opt === undefined) {
         this.ifnames_opt = ''
      }
      this.pmount_fixed = settings.pmount_fixed
      this.ssh_pass = settings.ssh_pass

      /**
       * Use the login name set in the config file. If not set, use the primary
       * user's name. If the name is not "user" then add boot option. ALso use
       * the same username for cleaning geany history.
       */
      this.user_opt = settings.user_opt

      if (this.user_opt === undefined || this.user_opt === '') {
         this.user_opt = shx.exec('awk -F":" \'/1000:1000/ { print $1 }\' /etc/passwd', { silent: true }).stdout.trim()
         if (this.user_opt === '') {
            this.user_opt = 'live'
         }
      }
      this.user_opt_passwd = settings.user_opt_passwd
      if (this.user_opt_passwd === '') {
         this.user_opt_passwd = 'evolution'
      }

      this.root_passwd = settings.root_passwd
      if (this.root_passwd === '') {
         this.root_passwd = 'evolution'
      }

      const timezone = shx.exec('cat /etc/timezone', { silent: true }).stdout.trim()
      this.timezone_opt = timezone

      this.locales_default = settings.locales_default
      this.locales = settings.locales
      return foundSettings
   }

   /**
    * showSettings
    */
   async show() {
      console.log(`application_name:  ${this.app.name} ${this.app.version}`)
      console.log(`config_file:       ${config_file}`)
      console.log(`snapshot_dir:      ${this.snapshot_dir}`)
      console.log(`snapshot_basename: ${this.snapshot_basename}`)
      console.log(`snapshot_excludes: ${this.snapshot_excludes}`)
      console.log(`kernel_image:      ${this.kernel_image}`)
      console.log(`initrd_image:      ${this.initrd_image}`)
      console.log(`work_dir:          ${this.work_dir.path}`)
      console.log(`efi_work:          ${this.efi_work}`)
      console.log(`make_efi:          ${this.make_efi}`)
      console.log(`make_md5sum:       ${this.make_md5sum}`)
      console.log(`make_isohybrid:    ${this.make_isohybrid}`)
      console.log(`compression:       ${this.compression}`)
      console.log(`force_installer:   ${this.force_installer}`)
      console.log(`user_opt:          ${this.user_opt}`)
      console.log(`netconfig_opt:     ${this.netconfig_opt}`)
      console.log(`ifnames_opt:       ${this.ifnames_opt}`)
      console.log(`locales:           ${this.locales}`)
      console.log(`locale default:    ${this.locales_default}`)
      console.log(`ssh_pass:          ${this.ssh_pass}`)
      if (this.make_efi) {
         if (!Utils.isUefi()) {
            Utils.error('You choose to create an UEFI image, but miss to install grub-efi-amd64 package.')
            Utils.error('Please install it before to create an UEFI image:')
            Utils.warning('sudo apt install grub-efi-amd64')
            this.make_efi = false
         } else if (!Pacman.packageIsInstalled('dosfstools')) {
            Utils.error('You choose to create an UEFI image, but miss to install dosfstools package.')
            Utils.error('Please install it before to create an UEFI image:')
            Utils.warning('sudo apt install dosfstools')
            this.make_efi = false
         }
      }



   }

   /**
    * Calculate and show free space on the disk
    * @returns {void}
    */
   async listFreeSpace(): Promise<void> {
      const path: string = this.snapshot_dir // convert to absolute path
      if (!fs.existsSync(this.snapshot_dir)) {
         fs.mkdirSync(this.snapshot_dir)
      }
      /** Lo spazio usato da SquashFS non è stimabile da live
       * errore buffer troppo piccolo
       */
      const gb = 1048576
      let spaceAvailable = 0
      if (!Utils.isLive()) {
         console.log(`Disk used space: ${Math.round((Utils.getUsedSpace() / gb) * 10) / 10} GB`)
      }

      spaceAvailable = Number(
         shx
            .exec(`df "${path}" | /usr/bin/awk 'NR==2 {print $4}'`, {
               silent: true
            })
            .stdout.trim()
      )
      console.log(`Space available: ${Math.round((spaceAvailable / gb) * 10) / 10} GB`)
      console.log(`There are ${Utils.getSnapshotCount(this.snapshot_dir)} snapshots taking ${Math.round((Utils.getSnapshotSize() / gb) * 10) / 10} GB of disk space.`)
      console.log()

      if (spaceAvailable > gb * 3) {
         console.log(chalk.cyanBright('The free space should  be sufficient to hold the'))
         console.log(chalk.cyanBright('compressed data from the system'))
      } else {
         console.log(chalk.redBright('The free space should be insufficient') + '.')
         console.log()
         console.log('If necessary, you can create more available space')
         console.log('by removing previous  snapshots and saved copies:')
      }

   }

   /**
    *
    * @param basename
    * @param theme
    */
   async loadRemix(basename = '', theme = '') {
      this.remix.versionNumber = Utils.getPackageVersion()
      this.remix.kernel = Utils.kernerlVersion()

      if (theme === '') {
         this.remix.branding = 'eggs'
      } else {
         this.remix.branding = theme
      }

      if (basename !== '') {
         this.remix.name = basename
         this.remix.versionName = basename
      } else {
         this.remix.name = this.snapshot_basename
         this.remix.versionName = this.snapshot_basename
      }
   }
}
