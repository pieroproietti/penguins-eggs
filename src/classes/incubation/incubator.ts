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

import { Buster } from './distros/buster'
import { Bullseye } from './distros/bullseye'
import { Beowulf } from './distros/beowulf'
import { Focal } from './distros/focal'
import { Groovy } from './distros/groovy'
import { Bionic } from './distros/bionic'

const exec = require('../../lib/utils').exec

/**
 *
 */
export default class Incubator {
   verbose = false

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

      this.createCalamaresDirs()
      if (this.distro.versionLike === 'buster') {
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
         const groovy = new Groovy(this.remix, this.distro, release, this.user_opt, this.verbose)
         await groovy.create()
      } else if (this.distro.versionLike === 'bionic') {
         const bionic = new Bionic(this.remix, this.distro, release, this.user_opt, this.verbose)
         await bionic.create()
      }
      this.createBranding()

   }

   /**
    *
    */
   private createCalamaresDirs() {
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

      /**
       * ADDONS
       */
       // let calamaresBranding = path.resolve(__dirname, `../../../addons/${this.remix.branding}/theme/branding`)
       let calamaresBranding = path.resolve(__dirname, `../../../addons/${this.remix.branding}/theme/calamares/branding`)
       if (fs.existsSync(calamaresBranding)) {
         if (!fs.existsSync(`/etc/calamares/branding/${this.remix.branding}`)) {
            fs.mkdirSync(`/etc/calamares/branding/${this.remix.branding}`)
         }
         shx.cp(`${calamaresBranding}/*`, `/etc/calamares/branding/${this.remix.branding}/`)
      } else {
         console.log(`${calamaresBranding} not found!`)
         process.exit()
      }

      let calamaresIcon = path.resolve(__dirname, `../../../addons/${this.remix.branding}/theme/artwork/install-debian.png`)
      if (fs.existsSync(calamaresIcon)) {
         shx.cp(calamaresIcon, '/usr/share/icons/')
      } else {
         console.log(`${calamaresIcon} not found!`)
         process.exit()
      }

      let calamaresLauncher = path.resolve(__dirname, `../../../addons/${this.remix.branding}/theme/applications/install-debian.desktop`)
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
