/**
 * ./src/commands/export/deb.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import { Command, Flags } from '@oclif/core'

import Distro from '../../classes/distro.js'
import Tools from '../../classes/tools.js'
import Utils from '../../classes/utils.js'
import { exec } from '../../lib/utils.js'
import os from 'node:os'

import { IEggsConfigTools } from '../../interfaces/i-config-tools.js'
import { execSync } from 'node:child_process'

export default class ExportPkg extends Command {
  static description = 'export pkg/iso to the destination host'

  static examples = ['eggs export pkg', 'eggs export pkg --clean', 'eggs export pkg --all']

  static flags = {
    all: Flags.boolean({ char: 'a', description: 'export all archs' }),
    clean: Flags.boolean({ char: 'c', description: 'remove old .deb before to copy' }),
    help: Flags.help({ char: 'h' }),
    verbose: Flags.boolean({ char: 'v', description: 'verbose' })
  }

  user = ''

  all = false

  clean = false

  verbose = false

  echo = {}

  Tu = new Tools()

  /**
   * 
   */
  async run(): Promise<void> {
    const { args, flags } = await this.parse(ExportPkg)
    Utils.titles(this.id + ' ' + this.argv)
    Utils.warning(ExportPkg.description)

    // Ora servono in più parti
    this.user = os.userInfo().username
    if (this.user === 'root') {
      this.user = execSync('echo $SUDO_USER', { encoding: 'utf-8' }).trim()
      if (this.user=== '') {
        this.user = execSync('echo $DOAS_USER', { encoding: 'utf-8' }).trim()
      }
    }
    this.all = flags.all
    this.clean = flags.clean
    this.verbose = flags.verbose
    this.echo = Utils.setEcho(this.verbose)
    await this.Tu.loadSettings()

    let distro = new Distro()
    if (distro.familyId === "debian") {
      Utils.warning("debian packages")
      await this.debs()
    } else if (distro.familyId === "archlinux") {
      if (distro.distroId === "ManjaroLinux" || distro.distroId === "BigLinux") {
        Utils.warning("manjaro packages")
        this.manjaro()
      } else {
        Utils.warning("arch packages")
        this.aur()
      }
    } else if (distro.familyId === "alpine") {
      Utils.warning("alpine packages")
      this.alpine()
    }
  }

  /**
   * alpine
   */
  private async alpine() {
    let arch='x86_64'
    if (process.arch === 'ia32') {
      arch='i386'
    }
    const localPath = `/home/${this.user}/packages/alpine/${arch}`
    const remotePath = `${this.Tu.config.remotePathPackages}/alpine/`
    const filter = `penguins-eggs*10.?.*-r*.apk`
    const remoteMountpoint = `/tmp/eggs-${(Math.random() + 1).toString(36).slice(7)}`
    let cmd = `mkdir ${remoteMountpoint}\n`
    cmd += `sshfs ${this.Tu.config.remoteUser}@${this.Tu.config.remoteHost}:${remotePath} ${remoteMountpoint}\n`
    if (this.clean) {
      cmd += `rm -f ${remoteMountpoint}/${filter}\n`
    }
    cmd += `cp ${localPath}/${filter} ${remoteMountpoint}\n`
    cmd += 'sync\n'
    cmd += `umount ${remoteMountpoint}\n`
    cmd += `rm -rf ${remoteMountpoint}\n`
    if (!this.verbose) {
      if (this.clean) {
        console.log(`remove: ${this.Tu.config.remoteUser}@${this.Tu.config.remoteHost}:${filter}`)
      }
      console.log(`copy: ${localPath}/${filter} to ${this.Tu.config.remoteUser}@${this.Tu.config.remoteHost}:${remotePath}`)
    }
    await exec(cmd, this.echo)
  }

  /**
   * manjaro
   */
  private async manjaro() {
    const localPathManjaro = `/home/${this.user}/penguins-eggs-pkgbuilds/manjaro/penguins-eggs`
    const remotePathManjaro = this.Tu.config.remotePathPackages + "/manjaro"
    const filterManjaro = `penguins-eggs-10.?.*-?-any.pkg.tar.*`
    const remoteMountpoint = `/tmp/eggs-${(Math.random() + 1).toString(36).slice(7)}`
    let cmd = `mkdir ${remoteMountpoint}\n`
    cmd += `sshfs ${this.Tu.config.remoteUser}@${this.Tu.config.remoteHost}:${remotePathManjaro} ${remoteMountpoint}\n`
    if (this.clean) {
      cmd += `rm -f ${remoteMountpoint}/${filterManjaro}\n`
    }

    cmd += `cp ${localPathManjaro}/${filterManjaro} ${remoteMountpoint}\n`
    cmd += 'sync\n'
    cmd += `umount ${remoteMountpoint}\n`
    cmd += `rm -rf ${remoteMountpoint}\n`
    if (!this.verbose) {
      if (this.clean) {
        console.log(`remove: ${this.Tu.config.remoteUser}@${this.Tu.config.remoteHost}:${filterManjaro}`)
      }
      console.log(`copy: ${localPathManjaro}/${filterManjaro} to ${this.Tu.config.remoteUser}@${this.Tu.config.remoteHost}:${remotePathManjaro}`)
    }
    await exec(cmd, this.echo)
  }

  /**
   * AUR
   */
  private async aur() {
    const localPathAur = `/home/${this.user}/penguins-eggs-pkgbuilds/aur/penguins-eggs`
    const remotePathAur = this.Tu.config.remotePathPackages + "/aur"
    const filterAur = `penguins-eggs-10.?.*-?-any.pkg.tar.zst`
    const remoteMountpoint = `/tmp/eggs-${(Math.random() + 1).toString(36).slice(7)}`
    let cmd = `mkdir ${remoteMountpoint}\n`
    cmd += `sshfs ${this.Tu.config.remoteUser}@${this.Tu.config.remoteHost}:${remotePathAur} ${remoteMountpoint}\n`
    if (this.clean) {
      cmd += `rm -f ${remoteMountpoint}/${filterAur}\n`
    }

    cmd += `cp ${localPathAur}/${filterAur} ${remoteMountpoint}\n`
    cmd += 'sync\n'
    cmd += `umount ${remoteMountpoint}\n`
    cmd += `rm -rf ${remoteMountpoint}\n`
    if (!this.verbose) {
      if (this.clean) {
        console.log(`remove: ${this.Tu.config.remoteUser}@${this.Tu.config.remoteHost}:${filterAur}`)
      }
      console.log(`copy: ${localPathAur}/${filterAur} to ${this.Tu.config.remoteUser}@${this.Tu.config.remoteHost}:${remotePathAur}`)
    }
    await exec(cmd, this.echo)
  }

  /**
   * DEBS
   */
  private async debs() {
    const localPathDeb = `/home/${this.user}/penguins-eggs/perrisbrewery/workdir`
    const remotePathDeb = this.Tu.config.remotePathPackages + "/debs"
    let arch = Utils.uefiArch()
    if (this.all) {
      arch = '*'
    }
    const filterDeb = `penguins-eggs_10.?.*-?_${arch}.deb`

    const remoteMountpoint = `/tmp/eggs-${(Math.random() + 1).toString(36).slice(7)}`
    let cmd = `mkdir ${remoteMountpoint}\n`
    cmd += `sshfs ${this.Tu.config.remoteUser}@${this.Tu.config.remoteHost}:${remotePathDeb} ${remoteMountpoint}\n`
    if (this.clean) {
      cmd += `rm -f ${remoteMountpoint}/${filterDeb}\n`
    }

    cmd += `cp ${localPathDeb}/${filterDeb} ${remoteMountpoint}\n`
    cmd += 'sync\n'
    cmd += `umount ${remoteMountpoint}\n`
    cmd += `rm -rf ${remoteMountpoint}\n`
    if (!this.verbose) {
      if (this.clean) {
        console.log(`remove: ${this.Tu.config.remoteUser}@${this.Tu.config.remoteHost}:${filterDeb}`)
      }
      console.log(`copy: ${localPathDeb}/${filterDeb} to ${this.Tu.config.remoteUser}@${this.Tu.config.remoteHost}:${remotePathDeb}`)
    }
    await exec(cmd, this.echo)
  }
}
