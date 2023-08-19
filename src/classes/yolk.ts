/**
 * penguins-eggs-v7 based on Debian live
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import fs from 'fs'
import Utils from './utils'
import Pacman from './pacman'
import Bleach from './bleach'
import {exec} from '../lib/utils'
import shx from 'shelljs'

/**
 *
 */
export default class Yolk {
  yolkDir = '/var/local/yolk'

  verbose = false

  echo = {}

  /**
   *
   */
  async create(verbose = false) {
    this.verbose = verbose
    this.echo = Utils.setEcho(verbose)
    Utils.warning("Creating a local repo on /var/local/yolk")

    if (Utils.machineArch() !== 'amd64') {
      Utils.error(`Is not possible to create yolk on ${Utils.machineArch()}`)
      process.exit
    }

    Utils.warning('Updating system')
    if (!Pacman.commandIsInstalled('dpkg-scanpackages')) {
      process.exit(0)
    }

    let cmd = ''
    try {
      cmd = 'apt-get update --yes'
      await exec(cmd, this.echo)
    } catch (error) {
      console.log(error)
      await Utils.pressKeyToExit(cmd)
    }

    if (!this.yolkExists()) {
      await exec(`mkdir ${this.yolkDir} -p`, this.echo)
      await exec(`chown _apt:root ${this.yolkDir} -R`, this.echo)
    } else {
      await this.yolkClean()
    }

    // packages we need
    const pkgs = [
      'cryptsetup', 
//      'grub-efi-amd64-bin',
      'grub-efi-amd64',
      'grub-pc',
      'keyutils', 
      'shim-signed',
    ] 

    process.chdir(this.yolkDir)
    Utils.warning(`Downloading packages and its dependencies`)

    for (const pkg of pkgs) {
      Utils.warning(`- ${pkg}`)
      cmd = `apt-cache depends --recurse --no-recommends --no-suggests --no-conflicts --no-breaks --no-replaces --no-enhances ${pkg} | grep "^\\w" | sort -u`
      let depends = pkg + '\n'
      depends += (await exec(cmd, {echo: false, capture: true})).data
      await this.installDeps(depends.split('\n'))
    }

    // create Package.gz
    cmd = 'dpkg-scanpackages -h  md5,sha1,sha256 . | gzip -c > Packages.gz'
    Utils.warning(cmd)
    await exec(cmd, {echo: false, capture: true})

    // Create Release date: Sat, 14 Aug 2021 07:42:00 UTC
    const now = shx.exec('date -R -u').stdout.trim()
    const content = `Archive: stable\nComponent: yolk\nOrigin: penguins-eggs\nArchitecture: ${Utils.machineArch()} \nDate: ${now}\n`
    Utils.warning('Writing Release')
    fs.writeFileSync('Release', content)

    // Cleaning
    Utils.warning('Cleaning apt cache')
    const bleach = new Bleach()
    await bleach.clean(verbose)
  }

  /**
   * if depends are not Installed
   * download depends
   * @param depends
   */
  async installDeps(depends: string[]) {
    // select for downloads only packages NOT already installed
    const toDownloads: string[] = []
    for (const depend of depends) {
      // if (depend !== '' && !Pacman.packageIsInstalled(depend)) {
        toDownloads.push(depend)
      // }
    }

    // now we go to downloads them
    for (const toDownload of toDownloads) {
      process.chdir(this.yolkDir)
      const cmd = `apt-get download ${toDownload}`
      // Utils.warning(`- ${cmd}`)
      await exec(cmd, this.echo)
    }
  }

  /**
  * Check if yoil exists and it's a repo
  */
  yolkExists(): boolean {
    const check = `${this.yolkDir}/Packages.gz`
    return fs.existsSync(check)
  }

  /**
   * Svuota la repo yolk
   */
  async yolkClean() {
    await exec(`rm ${this.yolkDir}/*`, this.echo)
  }
}
