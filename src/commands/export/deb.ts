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

import {IEggsConfigTools} from '../../interfaces/i-config-tools.js'

export default class ExportDeb extends Command {
  static description = 'export deb/docs/iso to the destination host'

  static examples = ['eggs export deb', 'eggs export deb --clean', 'eggs export deb --all']

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
    const { args, flags } = await this.parse(ExportDeb)
    Utils.titles(this.id + ' ' + this.argv)
    Utils.warning(ExportDeb.description)

    // Ora servono in più parti

    this.user = os.userInfo().username;
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
      if (distro.distroId === "manjarolinux" || distro.distroId === "BigLinux") {
        Utils.warning("manjaro packages")
      } else {
        Utils.warning("arch packages")
        this.aur()
      }
    } else if (distro.familyId === "alpine") {
      Utils.warning("alpine packages")
    }
  }

  /**
   * AUR
   */
  private async aur() {
    const localPathAur = `/home/${this.user}/penguins-eggs-pkgbuilds/aur/penguins-eggs`
    const remotePathAur=this.Tu.config.remotePathPackages + "/aur"
    const filterAur= `penguins-eggs-10.?.*-?-any.pkg.tar.zst`
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
    const localPathDeb = `/home/${this.user}/penguins-eggs/perrisbrewery/workdir/`
    const remotePathDeb=this.Tu.config.remotePathPackages + "/debs"
    let arch = Utils.uefiArch()
    if (this.all) {
      arch = '*'
    }
    arch += '.deb'
    const filterDeb= `penguins-eggs_10.?.*-?_${arch}`

    const remoteMountpoint = `/tmp/eggs-${(Math.random() + 1).toString(36).slice(7)}`
    let cmd = `mkdir ${remoteMountpoint}\n`
    cmd += `sshfs ${this.Tu.config.remoteUser}@${this.Tu.config.remoteHost}:${remotePathDeb} ${remoteMountpoint}\n`
    if (this.clean) {
      cmd += `rm -f ${remoteMountpoint}/${this.Tu.config.filterPackages}${arch}\n`
    }

    cmd += `cp ${this.Tu.config.localPathDeb}/${filterDeb}${arch}  ${remoteMountpoint}\n`
    cmd += 'sync\n'
    cmd += `umount ${remoteMountpoint}\n`
    cmd += `rm -rf ${remoteMountpoint}\n`
    if (!this.verbose) {
      if (this.clean) {
        console.log(`remove: ${this.Tu.config.remoteUser}@${this.Tu.config.remoteHost}:${filterDeb}`)
      }
      console.log(`copy: ${this.Tu.config.localPathDeb}/${filterDeb} to ${this.Tu.config.remoteUser}@${this.Tu.config.remoteHost}:${remotePathDeb}`)
    }

    await exec(cmd, this.echo)

  }
}
