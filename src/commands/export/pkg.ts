/**
 * ./src/commands/export/appimage.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import { Command, Flags } from '@oclif/core'
import os from 'node:os'

import Distro from '../../classes/distro.js'
import Diversions from '../../classes/diversions.js'
import Tools from '../../classes/tools.js'
import Utils from '../../classes/utils.js'
import { IEggsConfigTools } from '../../interfaces/i-config-tools.js'
import { exec, execSync } from '../../lib/utils.js'

export default class ExportPkg extends Command {
  static description = 'export penguins-eggs package to the destination host'
  static examples = ['eggs export pkg', 'eggs export pkg --clean', 'eggs export pkg --all']
  static flags = {
    all: Flags.boolean({ char: 'a', description: 'export all archs' }),
    clean: Flags.boolean({ char: 'c', description: 'remove old .deb before to copy' }),
    help: Flags.help({ char: 'h' }),
    verbose: Flags.boolean({ char: 'v', description: 'verbose' })
  }
  all = false
  clean = false
  echo = {}
  Tu = new Tools()
  user = ''
  verbose = false

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
      this.user = (execSync('echo $DOAS_USER') || '').trim()
      if (this.user === '') {
        this.user = (execSync('echo $DOAS_USER') || '').trim()
      }
    }

    this.all = flags.all
    this.clean = flags.clean
    this.verbose = flags.verbose
    this.echo = Utils.setEcho(this.verbose)
    await this.Tu.loadSettings()

    const distro = new Distro()
    const { familyId } = distro
    const { distroId } = distro
    const remoteMountpoint = `/tmp/eggs-${(Math.random() + 1).toString(36).slice(7)}`

    let localPath = ''
    let remotePath = ''
    let filter = ''

    switch (familyId) {
      case 'alpine': {
        let arch = 'x86_64'
        if (process.arch === 'ia32') {
          arch = 'i386'
        }

        Utils.warning(`exporting Alpine APK packages`)
        localPath = `/home/${this.user}/packages/aports/${arch}`
        remotePath = `${this.Tu.config.remotePathPackages}/alpine/${arch}`
        filter = `penguins-eggs-+([0-9.])-*.apk`
        // filter = `penguins-eggs-*[0-9][0-9].@([0-9]|[0-1][0-9]).@([0-9]|[0-3][0-9])-*.apk`

        /**
         * Arch/Manjaro
         */

        break
      }

      case 'archlinux': {
        /**
         * Manjaro
         */
        if (Diversions.isManjaroBased(distroId)) {
          Utils.warning(`exporting Manjaro .pkg.tar.zst packages`)
          localPath = `/home/${this.user}/penguins-packs/manjaro/penguins-eggs`
          remotePath = this.Tu.config.remotePathPackages + '/manjaro'
          filter = `penguins-eggs-+([0-9.])-*-any.pkg.tar.*`
          // filter = `penguins-eggs-[0-9][0-9].@([0-9]|[0-1][0-9]).@([0-9]|[0-3][0-9])-*-any.pkg.tar.*`

          /**
           * Arch
           */
        } else {
          Utils.warning(`exporting Arch .pkg.tar.zst packages`)
          localPath = `/home/${this.user}/penguins-packs/aur/penguins-eggs`
          remotePath = this.Tu.config.remotePathPackages + '/aur'
          filter = `penguins-eggs-+([0-9.])-*-any.pkg.tar.zst`
          // filter = `penguins-eggs-[0-9][0-9].@([0-9]|[0-1][0-9]).@([0-9]|[0-3][0-9])-*-any.pkg.tar.zst`
        }

        /**
         * Debian
         */

        break
      }

      case 'debian': {
        Utils.warning(`exporting Devuan/Debian/Ubuntu DEB packages`)
        localPath = `/home/${this.user}/penguins-eggs/releases`
        remotePath = this.Tu.config.remotePathPackages + '/debs'
        let arch = Utils.uefiArch()
        if (this.all) {
          arch = '*'
        }

        // filter = `penguins-eggs_[0-9][0-9].@([0-9]|[0-1][0-9]).@([0-9]|[0-3][0-9])-*_${arch}.deb`
        filter = `penguins-eggs_+([0-9.])-*${arch}.deb`

        /**
         * fedora
         */

        break
      }

      case 'fedora': {
        let repo = 'fedora'
        let ftype = 'fc??'
        let warning = `exporting Fedora RPM packages`
        if (distro.distroId !== 'Fedora') {
          repo = 'el9'
          ftype = `el?`
          warning = `exporting Almalinux/RHEL/Rocky RPM packages`
        }

        Utils.warning(warning)
        localPath = `/home/${this.user}/rpmbuild/RPMS/x86_64`
        remotePath = this.Tu.config.remotePathPackages + `/` + repo
        filter = `penguins-eggs-+([0-9.])-*.${ftype}.x86_64.rpm`
        // filter = `penguins-eggs-[0-9][0-9].[0-9]*.[0-9]*-*.${ftype}.x86_64.rpm`

        /**
         * openmamba
         */

        break
      }

      case 'openmamba': {
        Utils.warning(`exporting Openmamba RPM packages`)
        localPath = `/home/${this.user}/rpmbuild/RPMS/x86_64`
        remotePath = this.Tu.config.remotePathPackages + '/openmamba'
        filter = `penguins-eggs-+([0-9.])-*.mamba.*.rpm`
        // filter = `penguins-eggs-[0-9][0-9].@([0-9]|[0-1][0-9]).@([0-9]|[0-3][0-9])-*mamba.*.rpm`

        /**
         * opensuse
         */

        break
      }

      case 'opensuse': {
        Utils.warning(`exporting OpenSuSE RPM packages`)
        localPath = `/home/${this.user}/rpmbuild/RPMS/x86_64`
        remotePath = this.Tu.config.remotePathPackages + '/opensuse'
        filter = `penguins-eggs-+([0-9.])-*.rpm`
        // filter = `penguins-eggs-[0-9][0-9].[0-9]*.[0-9]*-*.opensuse.x86_64.rpm`

        break
      }
      // No default
    }

    let cmd = `#!/bin/bash\n`
    cmd += `set -e\n`
    cmd += 'shopt -s extglob\n'
    cmd += `mkdir ${remoteMountpoint}\n`
    cmd += `sshfs ${this.Tu.config.remoteUser}@${this.Tu.config.remoteHost}:${remotePath} ${remoteMountpoint}\n`
    const archDest = 'x86_64'
    if (this.clean) {
      const archDest = ''
      if (distro.familyId === 'alpine') {
        let archDest = 'x86_64/'
        if (process.arch === 'ia32') {
          archDest = 'i386/'
        }
      }

      cmd += `# Delete old packages\n`
      cmd += `rm -f ${remoteMountpoint}/${archDest}${filter}\n`
    }

    cmd += `# Export packages\n`
    cmd += `shopt -s extglob\n`
    cmd += `cp ${localPath}/${filter} ${remoteMountpoint}\n`
    cmd += 'sync\n'
    cmd += `\n`
    cmd += `# wait before to umount\n`
    cmd += 'sleep 2s\n'
    cmd += `fusermount3 -u ${remoteMountpoint}\n`
    cmd += `# remove mountpoint\n`
    cmd += `rm -rf ${remoteMountpoint}\n`
    if (!this.verbose) {
      if (this.clean) {
        console.log(`remove: ${this.Tu.config.remoteUser}@${this.Tu.config.remoteHost}:${filter}`)
      }

      console.log(`copy: ${localPath}/${filter} to ${this.Tu.config.remoteUser}@${this.Tu.config.remoteHost}:${remotePath}`)
    }

    await exec(cmd, this.echo)
  }
}
