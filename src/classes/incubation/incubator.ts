/**
 * penguins-eggs: incubator.ts
 *
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 */
import fs = require('fs')
import path = require('path')
import shx = require('shelljs')
import Utils from '../utils'
import { IRemix, IDistro } from '../../interfaces'

import { Jessie } from './distros/jessie'
import { Buster } from './distros/buster'
import { Bullseye } from './distros/bullseye'
import { Beowulf } from './distros/beowulf'
import { Focal } from './distros/focal'
import { Bionic } from './distros/bionic'
import Pacman from '../pacman'

const exec = require('../../lib/utils').exec

/**
 *
 */
export default class Incubator {
   verbose = false

   isCalamares = false

   remix: IRemix

   distro: IDistro

   user_opt: string

   sourcesMedia = false

   sourcesTrusted = true

   /**
    *
    * @param remix
    * @param distro
    * @param verbose
    */
   constructor(remix: IRemix, distro: IDistro, user_opt = 'live', verbose = false) {
      if (Pacman.packageIsInstalled('calamares')) {
         this.isCalamares = true
      }

      this.remix = remix
      this.distro = distro
      this.user_opt = user_opt
      this.verbose = verbose
      if (remix.branding === undefined) {
         remix.branding = 'eggs'
      }
   }

   /**
    * config
    */
   async config(release = false) {
      const verbose = true
      const echo = Utils.setEcho(verbose)

      this.createInstallerDirs()
      if (this.distro.versionLike === 'jessie') {
         const jessie = new Jessie(this.remix, this.distro, release, this.user_opt, this.verbose)
         await jessie.create()
      } else if (this.distro.versionLike === 'stretch') {
         const stretch = new Jessie(this.remix, this.distro, release, this.user_opt, this.verbose)
         await stretch.create()
      } else if (this.distro.versionLike === 'buster') {
         const buster = new Buster(this.remix, this.distro, release, this.user_opt, this.verbose)
         await buster.create()
      } else if (this.distro.versionLike === 'bullseye') {
         const bullseye = new Bullseye(this.remix, this.distro, release, this.user_opt, this.verbose)
         await bullseye.create()
      } else if (this.distro.versionLike === 'beowulf') {
         const beowulf = new Beowulf(this.remix, this.distro, release, this.user_opt, this.verbose)
         await beowulf.create()
      } else if (this.distro.versionLike === 'focal') {
         const focal = new Focal(this.remix, this.distro, release, this.user_opt, this.verbose)
         await focal.create()
      } else if (this.distro.versionLike === 'groovy') {
         const groovy = new Focal(this.remix, this.distro, release, this.user_opt, this.verbose)
         await groovy.create()
      } else if (this.distro.versionLike === 'hirsute') {
         const hirsute = new Focal(this.remix, this.distro, release, this.user_opt, this.verbose)
         await hirsute.create()
      } else if (this.distro.versionLike === 'bionic') {
         const bionic = new Bionic(this.remix, this.distro, release, this.user_opt, this.verbose)
         await bionic.create()
      }
      this.createBranding()

   }

   /**
    *
    */
   private createInstallerDirs() {
      let installer = 'krill'
      if (this.isCalamares) {
         installer = 'calamares'

         // Remove krill configuration if present
         shx.exec('rm /etc/krill -rf')
         if (process.arch==='ia32') {
            shx.exec('rm /usr/lib/i386-linux-gnu/krill -rf')
         } else {
            shx.exec('rm /usr/lib/x86_64-linux-gnu/krill -rf')
         }

         // create link to calamares configuration
         // shx.exec('ln -s /etc/calamares /etc/krill')
         // if (process.arch==='ia32') {
         //    shx.exec('ln -s /usr/lib/i386-linux-gnu/calamares /usr/lib/i386-linux-gnu/krill')
         // } else {
         //   shx.exec('ln -s /usr/lib/x86_64-linux-gnu/calamares /usr/lib/x86_64-linux-gnu/krill')
         // }

      }

      if (!fs.existsSync('/etc/' + installer)) {
         fs.mkdirSync('/etc/' + installer)
      }
      if (!fs.existsSync('/etc/' + installer + '/branding')) {
         fs.mkdirSync('/etc/' + installer + '/branding')
      }
      if (!fs.existsSync('/etc/' + installer + '/branding/eggs')) {
         fs.mkdirSync('/etc/' + installer + '/branding/eggs')
      }
      if (!fs.existsSync('/etc/' + installer + '/modules')) {
         fs.mkdirSync('/etc/' + installer + '/modules')
      }


      /**
       * ADDONS
       */
      const calamaresBranding = path.resolve(__dirname, `../../../addons/${this.remix.branding}/theme/calamares/branding`)
      if (fs.existsSync(calamaresBranding)) {
         if (!fs.existsSync('/etc/' + installer + `/branding/${this.remix.branding}`)) {
            fs.mkdirSync('/etc/' + installer + `/branding/${this.remix.branding}`)
         }
         shx.cp(`${calamaresBranding}/*`, '/etc/' + installer + `/branding/${this.remix.branding}/`)
      } else {
         console.log(`${calamaresBranding} not found!`)
         process.exit()
      }

      const calamaresIcon = path.resolve(__dirname, `../../../addons/${this.remix.branding}/theme/artwork/install-debian.png`)
      if (fs.existsSync(calamaresIcon)) {
         shx.cp(calamaresIcon, '/usr/share/icons/')
      } else {
         console.log(`${calamaresIcon} not found!`)
         process.exit()
      }

      const calamaresLauncher = path.resolve(__dirname, `../../../addons/${this.remix.branding}/theme/applications/install-debian.desktop`)
      if (fs.existsSync(calamaresLauncher)) {
         shx.cp(calamaresLauncher, '/usr/share/applications/')
      } else {
         console.log(`${calamaresLauncher} not found!`)
         process.exit()
      }
      // script di avvio
      shx.cp(path.resolve(__dirname, '../../../assets/calamares/install-debian'), '/sbin/install-debian')
   }

   /**
    *
    */
   private createBranding() {
      let installer = 'krill'
      if (this.isCalamares) {
         installer = 'calamares'
      }

      const branding = require('./branding').branding
      const dir = '/etc/' + installer + '/branding/' + this.remix.branding + '/'
      if (!fs.existsSync(dir)) {
         shx.exec(dir + ' -p')
      }
      const file = dir + 'branding.desc'
      const content = branding(this.remix, this.distro, this.verbose)
      write(file, content, this.verbose)
   }

   /**
    * non dovrebbe servire
    */
   private async createInstallDebian() {
      const scriptInstallDebian = require('./calamares-modules/scripts/install-debian').installDebian
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
