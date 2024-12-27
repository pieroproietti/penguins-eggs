/**
 * ./src/commands/export/deb.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import { Command, Flags } from '@oclif/core'

import Tools from '../../classes/tools.js'
import Utils from '../../classes/utils.js'
import { exec } from '../../lib/utils.js'
import os, { version } from 'node:os'
import fs from 'fs'
import path from 'path'

// pjson
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pjson = require('../../../package.json');
import { execSync } from 'node:child_process'
import { exists, existsSync } from 'node:fs'

export default class ExportTarballs extends Command {
  static description = 'export pkg/iso/tarballs to the destination host'

  static examples = ['eggs export tarballs', 'eggs export tarballs --clean']

  static flags = {
    clean: Flags.boolean({ char: 'c', description: 'remove old .deb before to copy' }),
    help: Flags.help({ char: 'h' }),
    verbose: Flags.boolean({ char: 'v', description: 'verbose' })
  }

  user = ''

  clean = false

  verbose = false

  echo = {}

  Tu = new Tools()

  /**
   * 
   */
  async run(): Promise<void> {
    const { args, flags } = await this.parse(ExportTarballs)
    Utils.titles(this.id + ' ' + this.argv)
    Utils.warning(ExportTarballs.description)

    // Ora servono in più parti
    this.user = os.userInfo().username
    if (this.user === 'root') {
      this.user = execSync('echo $SUDO_USER', { encoding: 'utf-8' }).trim()
      if (this.user === '') {
        this.user = execSync('echo $DOAS_USER', { encoding: 'utf-8' }).trim()
      }
    }
    this.clean = flags.clean
    this.verbose = flags.verbose
    this.echo = Utils.setEcho(this.verbose)
    await this.Tu.loadSettings()

    const remoteMountpoint = `/tmp/eggs-${(Math.random() + 1).toString(36).slice(7)}`
    const localPath = `/home/${this.user}/penguins-eggs/dist/`
    const remotePath = `${this.Tu.config.remotePathPackages}/tarballs/`
    const filter = `eggs-v10.?.*-*-linux-x64.tar.gz`
    const tarName = `penguins-eggs-tarball-${pjson.version}-1-linux-x64.tar.gz`

    // remove old tarball
    let cmd =`rm -f ${localPath}${tarName}`
    await exec(cmd, this.echo)

    // rename new tarball
    cmd = `mv ${localPath}${filter} ${localPath}${tarName}`
    await exec(cmd, this.echo)

    // check if new tarball exists
    if (!fs.existsSync(`${localPath}${tarName}`)) {
      console.log(`No ${tarName} exists!`)
      console.log(`Create it using: pnpm tarballs`)
      process.exit(1)
    }

    cmd = `mkdir ${remoteMountpoint}\n`
    cmd += `sshfs ${this.Tu.config.remoteUser}@${this.Tu.config.remoteHost}:${remotePath} ${remoteMountpoint}\n`
    if (this.clean) {
      cmd += `rm -f ${remoteMountpoint}/penguins-eggs-tarball*\n`
    }

    cmd += `cp ${localPath}${tarName} ${remoteMountpoint}/${tarName}\n`
    cmd += 'sync\n'
    cmd += `umount ${remoteMountpoint}\n`
    cmd += `rm -rf ${remoteMountpoint}\n`
    if (!this.verbose) {
      if (this.clean) {
        console.log(`remove: ${this.Tu.config.remoteUser}@${this.Tu.config.remoteHost}:${remotePath}/penguins-eggs-tarball*`)
      }
    }
    await exec(cmd, this.echo)
  }
}
