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
import path from 'path'
import fs from 'fs'
import { exec } from '../lib/utils'
import Compressors from '../classes/compressors'
import Settings from '../classes/settings'
import Utils from '../classes/utils'

/**
 *
 */
export default class Syncto extends Command {
  static flags = {
    file: Flags.string({ char: 'f', description: 'file LUKS encrypted' }),
    exclusion: Flags.boolean({ char: 'e', description: 'exclude files using exclude.list.cryptedclone template' }),
    help: Flags.help({ char: 'h' }),
    verbose: Flags.boolean({ char: 'v', description: 'verbose' }),
  }

  static description = 'Save users and users\' data ENCRYPTED'
  static examples = [
    'sudo eggs syncto',
    'sudo eggs syncto --file /path/to/fileLUKS',
    'sudo eggs syncto --exclusion'
  ]

  verbose = false

  echo = {}

  privateName="eggs-private"

  privateExt=".tar.gz.gpg"

  privateFile=`${this.privateName}${this.privateExt}`

  excludeFile = '/etc/penguins-eggs.d/exclude.list.d/exclude.list.cryptedclone'

  applyExclude = false

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
      this.privateName = flags.file
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

    let ef = ''  // exclude file
    if (this.applyExclude) {
      ef = `-X ${this.excludeFile}`
    }
    // uso: tar [OPZIONE...] [FILE]...
    let cmd = `tar czvpf -e /home/eggs ${ef} /home /etc/group /etc/passwd /etc/shadow | gpg --symmetric --cipher-algo aes256 -o /tmp/${this.privateFile}`
    Utils.warning(cmd)
    await exec(cmd, Utils.setEcho(this.verbose))
  }
}

