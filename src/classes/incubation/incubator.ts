/**
 * ./src/classes/incubation/incubator.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

// pjson
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
// partition
import yaml from 'js-yaml'
import fs from 'node:fs'
import path from 'node:path'

const pjson = require('../../../package.json')
import { IInstaller } from '../../interfaces/i-installer.js'
import { IDistro, IRemix } from '../../interfaces/index.js'
import { shx } from '../../lib/utils.js'
import Diversions from '../diversions.js'
import Pacman from '../pacman.js'
import Utils from '../utils.js'
import { branding } from './branding.js'
import { customizePartitions } from './customize/customize-partitions.js'
// incubator.d
import { Alpine } from './incubator.d/alpine.js'
import { Archlinux } from './incubator.d/archlinux.js'
import { Buster } from './incubator.d/buster.js'
import { Fedora } from './incubator.d/fedora.js'
import { Manjaro } from './incubator.d/manjaro.js'
import { Noble } from './incubator.d/noble.js'
import { Openmamba } from './incubator.d/openmamba.js'
import { Opensuse } from './incubator.d/opensuse.js'
import { Trixie } from './incubator.d/trixie.js'
import { installer } from './installer.js'

// _dirname
const __dirname = path.dirname(new URL(import.meta.url).pathname)

/**
 *
 */
export default class Incubator {
  distro: IDistro
installer = {} as IInstaller
isClone: boolean
remix: IRemix
theme: string
user_opt: string
verbose = false

  /**
   *
   * @param remix
   * @param distro
   * @param verbose
   */
  constructor(remix: IRemix, distro: IDistro, user_opt = 'live', theme = 'eggs', isClone = false, verbose = false) {
    this.installer = installer()
    this.remix = remix
    this.distro = distro
    this.user_opt = user_opt
    this.theme = theme
    this.verbose = verbose
    this.remix.branding = theme
    this.isClone = isClone

    // branding è solo il basename
    this.remix.branding = path.basename(theme)
  }

  /**
   * config
   */
  async config(release = false) {
    const verbose = true
    const echo = Utils.setEcho(verbose)

    Utils.warning(`creating ${installer().name} configuration files on ${installer().configRoot}`)
    this.createInstallerDirs()
    this.createBranding()

    const {distroUniqueId} = this.distro

    try {

      /**
       * Alpine
       */
      switch (distroUniqueId) {
      case 'alpine': {
        const alpine = new Alpine(this.installer, this.remix, this.distro, this.user_opt, release, this.theme, this.isClone, this.verbose)
        await alpine.create()


        /**
         * Archlinux
         */
      
      break;
      }

      case 'archlinux': {
        const archlinux = new Archlinux(this.installer, this.remix, this.distro, this.user_opt, release, this.theme, this.isClone, this.verbose)
        await archlinux.create()

        /**
         * Manjaro ex rolling
         */
      
      break;
      }

      case 'beowulf': {
        const beowulf = new Buster(this.installer, this.remix, this.distro, this.user_opt, release, this.theme, this.isClone, this.verbose)
        await beowulf.create()
      
      break;
      }

      case 'bookworm': {
        const bookworm = new Buster(this.installer, this.remix, this.distro, this.user_opt, release, this.theme, this.isClone, this.verbose)
        await bookworm.create()
      
      break;
      }

      case 'bullseye': {
        const bullseye = new Buster(this.installer, this.remix, this.distro, this.user_opt, release, this.theme, this.isClone, this.verbose)
        await bullseye.create()
      
      break;
      }

      case 'buster': {
        const buster = new Buster(this.installer, this.remix, this.distro, this.user_opt, release, this.theme, this.isClone, this.verbose)
        await buster.create()
      
      break;
      }

      case 'chimaera': {
        const chimaera = new Buster(this.installer, this.remix, this.distro, this.user_opt, release, this.theme, this.isClone, this.verbose)
        await chimaera.create()
      
      break;
      }

      case 'daedalus': {
        const daedalus = new Buster(this.installer, this.remix, this.distro, this.user_opt, release, this.theme, this.isClone, this.verbose)
        await daedalus.create()
      
      break;
      }

      case 'devel': {
        const devel = new Noble(this.installer, this.remix, this.distro, this.user_opt, release, this.theme, this.isClone, this.verbose)
        await devel.create()

      
      break;
      }

      case 'excalibur': {
        const excalibur = new Trixie(this.installer, this.remix, this.distro, this.user_opt, release, this.theme, this.isClone, this.verbose)
        await excalibur.create()

        /**
         * fedora
         */
      
      break;
      }

      case 'fedora': {
        const fedora = new Fedora(this.installer, this.remix, this.distro, this.user_opt, release, this.theme, this.isClone, this.verbose)
        await fedora.create()

        /**
         * openmamba
         */
      
      break;
      }

      case 'focal': {
        const focal = new Noble(this.installer, this.remix, this.distro, this.user_opt, release, this.theme, this.isClone, this.verbose)
        await focal.create()
      
      break;
      }

      case 'forky': {
        const forky = new Trixie(this.installer, this.remix, this.distro, this.user_opt, release, this.theme, this.isClone, this.verbose)
        await forky.create()

        /**
         * Devuan
         */
      
      break;
      }

      case 'jammy': {
        const jammy = new Noble(this.installer, this.remix, this.distro, this.user_opt, release, this.theme, this.isClone, this.verbose)
        await jammy.create()
      
      break;
      }

      case 'manjaro': {
        const manjaro = new Manjaro(this.installer, this.remix, this.distro, this.user_opt, release, this.theme, this.isClone, this.verbose)
        await manjaro.create()

        /**
         * Debian
         */
      
      break;
      }

      case 'noble': {
        const noble = new Noble(this.installer, this.remix, this.distro, this.user_opt, release, this.theme, this.isClone, this.verbose)
        await noble.create()
      
      break;
      }

      case 'openmamba': {
        const mamba = new Openmamba(this.installer, this.remix, this.distro, this.user_opt, release, this.theme, this.isClone, this.verbose)
        await mamba.create()

        /**
         * opensuse
         */
      
      break;
      }

      case 'opensuse': {
        const suse = new Opensuse(this.installer, this.remix, this.distro, this.user_opt, release, this.theme, this.isClone, this.verbose)
        await suse.create()

        /**
         * Ubuntu
         */
      
      break;
      }

      case 'trixie': {
        const trixie = new Trixie(this.installer, this.remix, this.distro, this.user_opt, release, this.theme, this.isClone, this.verbose)
        await trixie.create()
      
      break;
      }
      // No default
      }
    } catch (error) {
      console.error('--- ERRORE FATALE CATTURATO ---');
      console.error('L\'esecuzione si è interrotta durante la creazione della configurazione specifica per la distro.');
      console.error(error)
      process.exit(1)
    }


    if (Pacman.calamaresExists()) {
      await customizePartitions()
    }

    Utils.warning(`cleanup ${installer().name} configuration files`)
    await this.cleanupConfiguration()
  }


  /**
   * Rewrite modules 
   */
  private async cleanupConfiguration() {
    // modules
    const elements = fs.readdirSync(this.installer.modules)
    elements.sort()
    for (const elem of elements) {
      const file = this.installer.modules + elem
      const fileContent = fs.readFileSync(file, 'utf8')
      const yamlContent = yaml.load(fileContent)
      let destContent = `# ${elem} on ${this.distro.distroId}, penguins-eggs ${pjson.version}\n`
      destContent += '---\n'
      destContent += yaml.dump(yamlContent)
      fs.writeFileSync(file, destContent, 'utf8')
    }

    // settings
    const file = this.installer.configRoot + '/settings.conf'
    const fileContent = fs.readFileSync(file, 'utf8')
    const yamlContent = yaml.load(fileContent)
    let destContent = `# settings.conf on ${this.distro.distroId} penguins-eggs ${pjson.version}\n`
    destContent += '---\n'
    destContent += yaml.dump(yamlContent)
    fs.writeFileSync(file, destContent, 'utf8')
  }


  /**
   *
   */
  private createBranding() {
    const dir = this.installer.configRoot + 'branding/' + this.remix.branding + '/'
    if (!fs.existsSync(dir)) {
      shx.exec(`mkdir ${dir} -p`)
    }

    const file = dir + 'branding.desc'
    let destContent = `# branding.desc on ${this.distro.distroId} penguins-eggs ${pjson.version}\n`
    destContent += '---\n'
    destContent += branding(this.remix, this.distro, this.theme, this.verbose)
    write(file, destContent, this.verbose)
  }

  /**
   *
   */
  private createInstallerDirs() {
    if (this.installer.name !== 'calamares') {
      // Remove krill configuration and multiarc if present
      try {
        shx.exec('rm ' + this.installer.configRoot + ' -rf')
      } catch (error) {
        console.log('error: ' + error + ' removing ' + this.installer.configRoot + ' -rf')
      }

      try {
        shx.exec('rm ' + this.installer.multiarch + ' -rf')
      } catch (error) {
        console.log('error: ' + error + ' removing ' + this.installer.multiarch + ' -rf')
      }
    }

    // rootConfiguration krill/calamares
    if (!fs.existsSync(this.installer.configRoot)) {
      try {
        fs.mkdirSync(this.installer.configRoot)
      } catch (error) {
        console.log('error: ' + error + ' creating ' + this.installer.configRoot)
      }
    }

    if (!fs.existsSync(this.installer.configRoot + 'branding')) {
      try {
        fs.mkdirSync(this.installer.configRoot + 'branding')
      } catch (error) {
        console.log('error: ' + error + ' creating ' + this.installer.configRoot + 'branding')
      }
    }

    if (!fs.existsSync(this.installer.configRoot + 'branding/eggs')) {
      try {
        fs.mkdirSync(this.installer.configRoot + 'branding/eggs')
      } catch (error) {
        console.log('error: ' + error + ' creating ' + this.installer.configRoot + 'branding/eggs')
      }
    }

    if (!fs.existsSync(this.installer.configRoot + 'modules')) {
      try {
        fs.mkdirSync(this.installer.configRoot + 'modules')
      } catch (error) {
        console.log('error: ' + error + ' creating ' + this.installer.configRoot + 'modules')
      }
    }

    if (!fs.existsSync(this.installer.multiarch)) {
      try {
        fs.mkdirSync(this.installer.multiarch)
      } catch (error) {
        console.log('error: ' + error + ' creating ' + this.installer.multiarch)
      }
    }

    if (!fs.existsSync(this.installer.multiarchModules)) {
      try {
        fs.mkdirSync(this.installer.multiarchModules)
      } catch (error) {
        console.log('error: ' + error + ' creating ' + this.installer.multiarchModules)
      }
    }

    /**
     * themes krill/calamares
     */
    let calamaresBranding = path.resolve(__dirname, `../../../addons/eggs/theme/calamares/branding`)
    if (this.theme.includes('/')) {
      calamaresBranding = `${this.theme}/theme/calamares/branding`
    }

    // console.log(`calamaresBranding: ${calamaresBranding}`)
    if (fs.existsSync(calamaresBranding)) {
      if (!fs.existsSync(this.installer.configRoot + `branding/${this.remix.branding}`)) {
        try {
          fs.mkdirSync(this.installer.configRoot + `branding/${this.remix.branding}`)
        } catch (error) {
          console.log('error: ' + error + ' creating ' + this.installer.configRoot + `branding/${this.remix.branding}`)
        }
      }

      // patch quirinux
      shx.cp('-r', calamaresBranding + '/*', this.installer.configRoot + `branding/${this.remix.branding}/`)
    } else {
      console.log(calamaresBranding)
      console.log(`${calamaresBranding} branding not found!`)
      process.exit()
    }

    /**
     * install-system.png
     */
    let calamaresIcon = path.resolve(__dirname, `../../../addons/${this.remix.branding}/theme/artwork/install-system.png`)
    if (this.theme.includes('/')) {
      calamaresIcon = `${this.theme}/theme/artwork/install-system.png`
    }

    if (Pacman.calamaresExists()) {
      if (fs.existsSync(calamaresIcon)) {
        shx.cp(calamaresIcon, '/usr/share/icons/')
      } else {
        console.log(`${calamaresIcon} icon not found!`)
        process.exit()
      }
    }

    /**
     * install-system.desktop
     */
    let calamaresLauncher = path.resolve(__dirname, `../../../addons/${this.remix.branding}/theme/applications/install-system.desktop`)
    if (this.theme.includes('/')) {
      calamaresLauncher = `${this.theme}/theme/applications/install-system.desktop`
    }

    if (fs.existsSync(calamaresLauncher)) {
      shx.cp(calamaresLauncher, '/usr/share/applications/')
    } else {
      console.log(`${calamaresLauncher} launcher not found!`)
      process.exit()
    }

    /**
     * install-system.sh
     */
    {
      const sourceScript = path.resolve(__dirname, '../../../assets/calamares/install-system.sh');
      const targetScript = '/usr/bin/install-system.sh';
      fs.copyFileSync(sourceScript, targetScript);
      fs.chmodSync(targetScript, 0o755);
      fs.chownSync(targetScript, 0, 0);
    }

    this.sudoers()
  }

  /**
   * soluzione tampone from Glenn
   */
  private sudoers() {
    const live = this.user_opt;
    if (!live) return;

    const sudoersPath = '/etc/sudoers.d/99-eggs-calamares';
    const sudoersDir = '/etc/sudoers.d'; // O usa path.dirname(sudoersPath)

    // FIX: Crea la directory se non esiste
    if (!fs.existsSync(sudoersDir)) {
      try {
        fs.mkdirSync(sudoersDir, { mode: 0o755, recursive: true });
      } catch (error) {
        console.error(`Error creating ${sudoersDir}:`, error);
      }
    }

    // Nota il SETENV: prima di NOPASSWD
    const content = `${live} ALL=(ALL) SETENV: NOPASSWD: /usr/bin/calamares\n`;

    try {
      fs.writeFileSync(sudoersPath, content, { encoding: 'utf8', mode: 0o440 });
      fs.chownSync(sudoersPath, 0, 0);
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * soluzione tampone from Glenn
   * 
   */
  private sudoersToRemove() {
    const live = this.user_opt;
    if (!live) return;

    const sudoersPath = '/etc/sudoers.d/99-eggs-calamares';
    // Nota il SETENV: prima di NOPASSWD
    const content = `${live} ALL=(ALL) SETENV: NOPASSWD: /usr/bin/calamares\n`;

    try {
      fs.writeFileSync(sudoersPath, content, { encoding: 'utf8', mode: 0o440 });
      fs.chownSync(sudoersPath, 0, 0);
    } catch (error) {
      console.error(error);
    }
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

