/**
 * ./src/classes/yolk.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import yaml from 'js-yaml'
import fs from 'node:fs'
import { shx, exec } from '../lib/utils.js'
import Bleach from './bleach.js'
import Pacman from './pacman.js'
import Utils from './utils.js'

/**
 *
 */
export default class Yolk {
  echo = {}

  verbose = false

  yolkDir = '/var/local/yolk'

  /**
   *
   */
  async create(verbose = false) {
    this.verbose = verbose
    this.echo = Utils.setEcho(verbose)

    if (Utils.uefiArch() !== 'amd64') {
      Utils.warning(`yolk is not used on ${Utils.uefiArch()} architecture`)
      return
    }

    Utils.warning(`Creating yolk on ${this.yolkDir}`)

    Utils.warning('Updating system')
    if (!Utils.commandExists('dpkg-scanpackages')) {
      Utils.warning(`I cannot find the command dpkg-scanpackages`)
      process.exit(0)
    }

    let cmd = ''
    try {
      cmd = 'apt-get update --yes'
      await exec(cmd, this.echo)
    } catch (error) {
      console.log(error)
      await Utils.pressKeyToExit(cmd)
      process.exit(0)
    }

    if (this.exists()) {
      await this.erase()
    } else {
      await exec(`mkdir ${this.yolkDir} -p`, this.echo)
      await exec(`chown _apt:root ${this.yolkDir} -R`, this.echo)
    }

    // packages we need
    // const pkgs = ['cryptsetup', 'grub-efi-amd64', 'grub-pc', 'keyutils', 'shim-signed']
    interface IYolk {
      packages: string[]
    }
    const yolk_yaml = '/etc/penguins-eggs.d/yolk.yaml'
    const yolk = yaml.load(fs.readFileSync(yolk_yaml, 'utf8')) as IYolk

    process.chdir(this.yolkDir)
    Utils.warning(`Downloading packages and its dependencies`)

    for (const pkg of yolk.packages) {
      Utils.warning(`- ${pkg}`)
      cmd = `apt-cache depends --recurse --no-recommends --no-suggests --no-conflicts --no-breaks --no-replaces --no-enhances ${pkg} | grep "^\\w" | sort -u`
      let depends = pkg + '\n'
      depends += (await exec(cmd, { capture: true, echo: false })).data
      await this.installDeps(depends.split('\n'))
    }

    // create Package.gz
    cmd = 'dpkg-scanpackages -h  md5,sha1,sha256 . | gzip -c > Packages.gz'
    Utils.warning(cmd)
    await exec(cmd, { capture: true, echo: false })

    // Create Release date: Sat, 14 Aug 2021 07:42:00 UTC
    const now = shx.exec('date -R -u', {silent: true}).stdout.trim()
    const content = `Archive: stable\nComponent: yolk\nOrigin: penguins-eggs\nArchitecture: ${Utils.uefiArch()} \nDate: ${now}\n`
    Utils.warning('Writing Release')
    fs.writeFileSync('Release', content)

    // Cleaning
    Utils.warning('Cleaning apt cache')
    const bleach = new Bleach()
    await bleach.clean(verbose)
  }

  /**
   * Svuota la repo yolk
   */
  async erase() {
    await exec(`rm ${this.yolkDir}/*`, this.echo)
  }

  /**
   * Check if yoil exists and it's a repo
   */
  exists(): boolean {
    const check = `${this.yolkDir}/Packages.gz`
    return fs.existsSync(check)
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
}
