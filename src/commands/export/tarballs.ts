/**
 * ./src/commands/export/deb.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import { Command, Flags } from '@oclif/core'
import fs from 'fs'
import { globSync } from 'glob'
// pjson
import { createRequire } from 'module';
import os, { version } from 'node:os'
import path from 'path'

import Tools from '../../classes/tools.js'
import Utils from '../../classes/utils.js'
import { exec , execSync } from '../../lib/utils.js'
const require = createRequire(import.meta.url);
import { exists, existsSync } from 'node:fs'

const pjson = require('../../../package.json');

export default class ExportTarballs extends Command {
  static description = 'export pkg/iso/tarballs to the destination host'
static examples = ['eggs export tarballs', 'eggs export tarballs --clean']
static flags = {
    clean: Flags.boolean({ char: 'c', description: 'remove old .deb before to copy' }),
    help: Flags.help({ char: 'h' }),
    verbose: Flags.boolean({ char: 'v', description: 'verbose' })
  }
clean = false
echo = {}
Tu = new Tools()
user = ''
verbose = false

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
      this.user = (execSync('echo $DOAS_USER') || '').trim()
      if (this.user === '') {
        this.user = (execSync('echo $DOAS_USER') || '').trim()
      }
    }

    this.clean = flags.clean
    this.verbose = flags.verbose
    this.echo = Utils.setEcho(this.verbose)
    await this.Tu.loadSettings()

    const remoteMountpoint = `/tmp/eggs-${(Math.random() + 1).toString(36).slice(7)}`
    const localPath = `/home/${this.user}/penguins-eggs/dist/`
    const remotePath = `${this.Tu.config.remotePathPackages}/tarballs/`
    const tarNamePattern = `penguins-eggs_[0-9][0-9].[0-9]*.[0-9]*-*-linux-x64.tar.gz`
    
    const searchPattern = path.join(localPath, tarNamePattern);
    const matchingFiles = globSync(searchPattern);
    if (matchingFiles.length === 0) {
      console.log(`No ${searchPattern} exists!`)
      console.log(`Create it using: pnpm tarballs`)
      // process.exit(1)
    }

    let cmd = `mkdir ${remoteMountpoint}\n`
    cmd += `sshfs ${this.Tu.config.remoteUser}@${this.Tu.config.remoteHost}:${remotePath} ${remoteMountpoint}\n`
    if (this.clean) {
      cmd += `rm -f ${remoteMountpoint}/penguins-eggs_*-linux-x64.tar.gz\n`
    }

    cmd += `cp ${localPath}${tarNamePattern} ${remoteMountpoint}/\n`
    cmd += 'sync\n'
    cmd += `umount ${remoteMountpoint}\n`
    cmd += `rm -rf ${remoteMountpoint}\n`
    if (!this.verbose && this.clean) {
        console.log(`remove: ${this.Tu.config.remoteUser}@${this.Tu.config.remoteHost}:${remotePath}/${tarNamePattern}`)
      }

    await exec(cmd, this.echo)
  }
}
