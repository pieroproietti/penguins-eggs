/**
 * penguins-eggs: buster/calamares-config.ts
 *
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 */
import fs = require('fs')
import path = require('path')
import shx = require('shelljs')
import Utils from '../utils'
import Pacman from '../pacman'
import { IRemix, IDistro } from '../../interfaces'
import { Buster } from './buster'
import { Focal } from './focal'
const exec = require('../../lib/utils').exec

/**
 *
 */
export default class CalamaresConfig {
   verbose = false

   remix: IRemix

   distro: IDistro

   displaymanager = false

   sourcesMedia = false

   sourcesTrusted = true

   /**
    *
    * @param remix
    * @param distro
    * @param verbose
    */
   constructor(remix: IRemix, distro: IDistro, verbose = false) {
      this.remix = remix
      this.distro = distro
      this.verbose = verbose
      this.displaymanager =
         Pacman.packageIsInstalled('lightdm') ||
         Pacman.packageIsInstalled('sddm') ||
         Pacman.packageIsInstalled('sddm')
   }

   /**
    * config
    */
   config() {
      this.createCalamaresDirs()
      this.createBranding()
      this.createInstallDebian()
      if (this.distro.versionLike === 'buster' || this.distro.versionLike === 'strect' || this.distro.versionLike === 'bulleye') {
         const buster = new Buster(this.remix, this.distro, this.displaymanager, this.verbose)
         buster.settings()
         buster.modules()
      } else if(this.distro.versionLike === 'focal'){
         const focal = new Focal(this.remix, this.distro, this.displaymanager, this.verbose)
         focal.settings()
         focal.modules()
      }
   }

   /**
 *
 */
   createCalamaresDirs() {
      if (!fs.existsSync('/etc/calamares')) {
         fs.mkdirSync('/etc/calamares')
      }
      if (!fs.existsSync('/etc/calamares/branding')) {
         fs.mkdirSync('/etc/calamares/branding')
      }
      if (!fs.existsSync('/etc/calamares/branding/eggs')) {
         fs.mkdirSync('/etc/calamares/branding/eggs')
      }
      if (!fs.existsSync('/etc/calamares/modules')) {
         fs.mkdirSync('/etc/calamares/modules')
      }
      if (!fs.existsSync('/usr/lib/calamares')) {
         fs.mkdirSync('/usr/lib/calamares/')
      }
      if (!fs.existsSync('/usr/lib/calamares/modules')) {
         fs.mkdirSync('/usr/lib/calamares/modules')
      }

      shx.cp(
         path.resolve(
            __dirname,
            '../../../assets/calamares/install-debian.desktop'
         ),
         '/usr/share/applications/install-debian.desktop'
      )
      shx.cp(
         '-r',
         path.resolve(__dirname, '../../../assets/calamares/branding/*'),
         '/etc/calamares/branding/'
      )
      shx.cp(
         path.resolve(__dirname, '../../../assets/calamares/install-debian'),
         '/sbin/install-debian'
      )
      shx.cp(
         path.resolve(
            __dirname,
            '../../../assets/calamares/artwork/install-debian.png'
         ),
         '/usr/share/icons/install-debian.png'
      )
   }

   /**
  *
  */
   createBranding() {
      const branding = require('./branding').branding
      const dir = `/etc/calamares/branding/${this.remix.branding}/`
      if (!fs.existsSync(dir)) {
         fs.mkdirSync(dir)
      }
      const file = dir + 'branding.desc'
      const content = branding(this.remix, this.distro, this.verbose)
      write(file, content, this.verbose)
   }

   /**
    *
    */
   async createInstallDebian() {
      const scriptInstallDebian = require('./calamares-modules/scripts/install-debian')
         .installDebian
      const scriptDir = `/usr/bin/`
      const scriptFile = scriptDir + 'install-debian'
      const scriptContent = scriptInstallDebian()
      write(scriptFile, scriptContent, this.verbose)
      await exec(`chmod +x ${scriptFile}`)
   }
}

/**
 *
 * @param file
 * @param content
 * @param verbose
 */
function write(file: string, content: string, verbose = false) {
   if (verbose) {
      console.log(`calamares: create ${file}`)
   }
   fs.writeFileSync(file, content, 'utf8')
}
