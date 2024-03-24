/**
 * penguins-eggs
 * command: syncto.ts
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

/**
 *
 * syncfrom (restore)
 * --include-from file.list // if only include is provided everything from the list if used to update the system.
 * --exclude-from file-list // it just updates the system
 *
* If both options are provided then it works as a combination as provided in the link above.
* https://stackoverflow.com/questions/19296190/rsync-include-from-vs-exclude-from-what-is-the-actual-difference
*
 * The same logic is applied for the syncto also.
 *
 * On top of all of this the --delete option
 * if needed to be passed so that everything else is removed, but this
 * this should not be available by default
 */
import { Command, Flags } from '@oclif/core'
import fs from 'fs'
import { exec } from '../lib/utils'
import Compressors from '../classes/compressors'
import Settings from '../classes/settings'
import Utils from '../classes/utils'
import yaml from 'js-yaml'
import { IEggsConfig } from '../interfaces/index'
const config_file = '/etc/penguins-eggs.d/eggs.yaml' as string

/**
 *
 */
export default class Syncto extends Command {
  static flags = {
    file: Flags.string({ char: 'f', description: 'private-file encrypted' }),
    exclusion: Flags.boolean({ char: 'e', description: 'exclude files using exclude.list.cryptedclone template' }),
    help: Flags.help({ char: 'h' }),
    verbose: Flags.boolean({ char: 'v', description: 'verbose' }),
  }

  static description = 'Save users and users\' data ENCRYPTED'
  static examples = [
    'sudo eggs syncto',
    'sudo eggs syncto --file /path/to/private-file',
    'sudo eggs syncto --exclusion'
  ]

  verbose = false

  echo = {}

  privateFile="eggs-private"

  excludeFile = '/etc/penguins-eggs.d/exclude.list.d/exclude.list.cryptedclone'

  applyExclude = false

  _config = {} as IEggsConfig

  settings = {} as Settings

  /**
   *
   */
  async run(): Promise<void> {
    Utils.titles(this.id + ' ' + this.argv)

    const { flags } = await this.parse(Syncto)

    if (flags.verbose) {
      this.verbose = true
    }

    this.echo = Utils.setEcho(this.verbose)

    if (flags.file) {
      this.privateFile = flags.file
    }

    this.applyExclude = true
    if (flags.exclusion) {
      this.applyExclude = true
    }

    if (Utils.isRoot()) {
      await this.privateCreate()
    } else {
      Utils.useRoot(this.id)
    }
  }


  /**
   *
   */
  async privateCreate() {
    if (fs.existsSync(`/tmp/${this.privateFile}`)) {
      Utils.warning(`Erasing previous private data on /tmp/${this.privateFile}`)
      let clean = `rm -rf /tmp/${this.privateFile}`
      await exec(clean)
    }

    //==========================================================================
    // Open privateFile 
    //==========================================================================
    Utils.titles(this.id + ' ' + this.argv)

    const compressors = new Compressors()
    await compressors.populate()
    this.settings = new Settings()
    let e = '' // exclude nest
    let compression = compressors.fast()
    if (await this.settings.load()) {
      if (this.settings.config.compression==`max`) {
        compression = compressors.max()
      } else if (this.settings.config.compression==`standard`) {
        compression = compressors.standard()
      }
    }
    this._config = yaml.load(fs.readFileSync(config_file, 'utf-8')) as IEggsConfig

    let ef = ''  // exclude file
    if (this.applyExclude) {
      ef = `-X ${this.excludeFile}`
    }

    let tar=`tar -cf /tmp/${this.privateFile}.tar --exclude=${this._config.snapshot_dir} ${ef}  /home /etc/group /etc/passwd /etc/shadow`
    tar += ' | pv -p -b -t -e -r'
    //console.log(tar)
    await exec(tar, Utils.setEcho(true))

    let zstd=`zstd -c /tmp/${this.privateFile}.tar | pv -p -b -t -e -r > /tmp/${this.privateFile}.tar.zsd`
    //console.log(zstd)
    await exec(zstd, Utils.setEcho(true))

    let gpg=`openssl enc -aes256 -salt -in /tmp/${this.privateFile}.tar.zsd > /tmp/${this.privateFile}.tar.zsd.enc`
    //console.log(gpg)
    await exec(gpg, Utils.setEcho(true))

    let rm=`rm /tmp/${this.privateFile}.tar /tmp/${this.privateFile}.tar.zsd`
    //console.log(rm)
    await exec(rm, Utils.setEcho(true))

    if (! fs.existsSync(`${this._config.snapshot_mnt}iso/live/`)) {
      let mkdir=`mkdir -p ${this._config.snapshot_mnt}iso/live`
      //console.log(mkdir)
      await exec(mkdir, Utils.setEcho(true))
    }

    let mv=`mv /tmp/${this.privateFile}.tar.zsd.enc ${this._config.snapshot_mnt}iso/live`
    //console.log(mv)
    await exec(mv, Utils.setEcho(true))
  }
}

