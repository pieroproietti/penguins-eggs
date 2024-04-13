/**
 * penguins-eggs
 * command: syncto.ts
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

// https://gist.github.com/ansemjo/6f1cf9d9b8f7ce8f70813f52c63b74a6

import { Command, Flags } from '@oclif/core'
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
    file: Flags.string({ char: 'f', description: 'file luks-volume encrypted' }),
    excludes: Flags.boolean({ char: 'e', description: 'use: exclude.list.d/home.list' }),
    help: Flags.help({ char: 'h' }),
    verbose: Flags.boolean({ char: 'v', description: 'verbose' }),
  }

  static description = 'Save users and users\' data ENCRYPTED'
  static examples = [
    'sudo eggs syncto',
    'sudo eggs syncto --file /path/to/luks-volume',
    'sudo eggs syncto --excludes'
  ]

  verbose = false

  echo = {}

  luksName = 'luks-volume'

  luksFile = `/tmp/${this.luksName}`

  luksDevice = `/dev/mapper/${this.luksName}`

  luksMountpoint = `/tmp/mnt/${this.luksName}`

  privateSquashfs = `private.squashfs`

  excludeHome = '/etc/penguins-eggs.d/exclude.list.d/home.list'

  exclude = false

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

    let fileLuks = ''
    if (flags.file) {
      fileLuks = flags.file
    }

    if (flags.excludes) {
      this.exclude = true
    }

    if (Utils.isRoot()) {
      await this.luksCreate()
    } else {
      Utils.useRoot(this.id)
    }
  }

  /**
   *
   */
  async luksCreate() {
    await exec(`rm -rf ${this.luksFile}`)
    //==========================================================================
    // Create squashfs
    //==========================================================================
    Utils.warning(`Creating private.squashfs`)
    const compressors = new Compressors()
    await compressors.populate()

    // comp
    let comp = ''
    this.settings = new Settings()
    if (await this.settings.load()) {
      let compression = compressors.fast()
      if (this.settings.config.compression == `max`) {
        compression = compressors.max()
      } else if (this.settings.config.compression == `standard`) {
        compression = compressors.standard()
      }
      comp = `-comp ${compression}`
    }

    // exclude /home/eggs
    let exclude_nest = ''
    if (fs.existsSync(this.settings.work_dir.workdir)) {
      exclude_nest = `-e ${this.settings.config.snapshot_dir}`
    }

    // exclude file
    let exclude_home = ''
    if (this.exclude) {
      exclude_home = `-ef ${this.excludeHome}`
    }

    // creato dummyfs per /etc/
    await exec(`mkdir -p /tmp/dummyfs/etc`, this.echo)
    await exec(`cp -a /etc/passwd /tmp/dummyfs/etc`, this.echo)
    await exec(`cp -a /etc/group /tmp/dummyfs/etc`, this.echo)
    await exec(`cp -a /etc/shadow /tmp/dummyfs/etc`, this.echo)
    await exec(`mkdir -p /tmp/dummyfs/etc/lightdm`, this.echo)                          // lightdm
    await exec(`cp -a /etc/lightdm/lightdm.conf /tmp/dummyfs/etc/lightdm/`, this.echo)  // lightdm  

    let mkPrivateSquashfs = `mksquashfs \
                              /tmp/dummyfs/etc \
                              /home \
                              /tmp/${this.privateSquashfs} \
                              ${comp} \
                              ${exclude_nest} \
                              ${exclude_home} \
                              -keep-as-directory \ 
                              -noappend`

    mkPrivateSquashfs = mkPrivateSquashfs.replace(/\s\s+/g, ` `)
    await exec(mkPrivateSquashfs, Utils.setEcho(true))

    // remove dummyfs
    await exec (`rm /tmp/dummyfs/ -rf`, this.echo)

    //==========================================================================
    // Create LUKS volume
    //==========================================================================
    Utils.titles("Creating LUKS Volume")

    // calcolo size
    let sizeString=(await exec(`unsquashfs -s /tmp/${this.privateSquashfs} | grep "Filesystem size" | sed -e 's/.*size //' -e 's/ .*//'`, { echo: false, capture: true })).data
    let size = parseInt(sizeString) + 2048
    console.log("size private.squashfs:", bytesToGB(size), size)

    let luksBlockSize = 512
    let luksBlocks = Math.ceil(size / luksBlockSize)
    size=luksBlockSize*luksBlocks

    // Aggiungo un 20% in più per ottenere luksSize
    let luksSize = Math.ceil((size)*1.20)
    console.log("luksSize:", bytesToGB(luksSize), luksSize)

    // truncate * 2048 è cruciale
    let truncateAt=luksSize*2048
    
    Utils.warning(`Preparing file ${this.luksFile} for ${this.luksDevice}, size ${truncateAt}`)
    await exec(`truncate --size ${luksSize} ${this.luksFile}`, this.echo)

    Utils.warning(`Creating LUKS Volume on ${this.luksFile}`)
    await exec(`cryptsetup --batch-mode luksFormat ${this.luksFile}`, Utils.setEcho(true))
    console.log('')

    // open LUKS volume temp
    Utils.warning(`Opening LUKS Volume on ${this.luksFile}`)
    let code = (await exec(`cryptsetup luksOpen ${this.luksFile} ${this.luksName}`, Utils.setEcho(true))).code
    if (code != 0) {
      Utils.error(`cryptsetup luksOpen ${this.luksFile} ${this.luksName} failed`)
      process.exit(code)
    }
    await exec('udevadm settle', this.echo)

    // formatta ext4 il volume
    await exec(`mkfs.ext4 ${this.luksDevice}`, this.echo)
    console.log('')

    // mount LUKS volume
    if (!fs.existsSync(`this.luksMountpoint)`)) {
      Utils.warning(`creating mountpoint ${this.luksMountpoint}`)
      await exec(`mkdir -p ${this.luksMountpoint}`, this.echo)
    }
    if (!Utils.isMountpoint(`${this.luksMountpoint}`)) {
      Utils.warning(`mounting volume: ${this.luksDevice} on ${this.luksMountpoint}`)
      let code = (await exec(`mount ${this.luksDevice} ${this.luksMountpoint}`, Utils.setEcho(true))).code
      if (code != 0) {
        Utils.error(`mount ${this.luksDevice} ${this.luksMountpoint} failed`)
        process.exit(code)
      }
    }

    // copy private.squashfs
    Utils.warning(`moving /tmp/${this.privateSquashfs} to ${this.luksMountpoint}`)
    await exec(`mv /tmp/${this.privateSquashfs} ${this.luksMountpoint}`, this.echo)

    Utils.warning(`Umounting ${this.luksMountpoint}`)
    await exec(`umount ${this.luksMountpoint}`, this.echo)
    Utils.warning(`Vlosing ${this.luksMountpoint}`)
    await exec(`cryptsetup luksClose ${this.luksName}`, this.echo)
  }
}

/**
 * Convert bytes to gigabytes
 */
function bytesToGB(bytes: number): string {
  const gigabytes = bytes / 1073741824;
  return gigabytes.toFixed(2) + ' GB';
}
