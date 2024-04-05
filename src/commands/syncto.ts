/**
 * penguins-eggs
 * command: syncto.ts
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

// https://gist.github.com/ansemjo/6f1cf9d9b8f7ce8f70813f52c63b74a6

import { Command, Flags } from '@oclif/core'
import path from 'path'
import fs from 'fs'
import { exec } from '../lib/utils'
import Compressors from '../classes/compressors'
import Settings from '../classes/settings'
import Utils from '../classes/utils'
import { util } from 'chai'

/**
 *
 */
export default class Syncto extends Command {
  static flags = {
    file: Flags.string({ char: 'f', description: 'file luks-volume encrypted' }),
    exclusion: Flags.boolean({ char: 'e', description: 'use: exclude.list.d/clone.list' }),
    help: Flags.help({ char: 'h' }),
    verbose: Flags.boolean({ char: 'v', description: 'verbose' }),
  }

  static description = 'Save users and users\' data ENCRYPTED'
  static examples = [
    'sudo eggs syncto',
    'sudo eggs syncto --file /path/to/luks-volume',
    'sudo eggs syncto --exclusion'
  ]

  verbose = false

  echo = {}

  luksName = 'luks-volume'

  luksFile = `/tmp/${this.luksName}`

  luksDevice = `/dev/mapper/${this.luksName}`

  luksMountpoint = `/tmp/mnt/${this.luksName}`

  luksSize = ""

  privateSquashfs = `private.squashfs`

  excludeFile = '/etc/penguins-eggs.d/exclude.list.d/clone.list'

  excludeFiles = false

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

    if (flags.exclusion) {
      this.excludeFiles = true
    }

    /* leggo lo spazio libero su /tmp */
    let tmp = (await exec(`df /tmp -B 1 | tail -1 | awk '{print $4}'`, { echo: false, capture: true })).data
    let tmpSize = parseInt(tmp)
    let gb=1024*1024*1024
    let size = Math.floor((tmpSize)/gb)
    if (size > 14) {
      size = 14
    }
    this.luksSize = `${size}G`

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

    Utils.warning(`Preparing file ${this.luksFile} for ${this.luksDevice}, size ${this.luksSize}`)
    await exec(`truncate --size ${this.luksSize} ${this.luksFile}`, this.echo)

    Utils.warning(`Creating LUKS Volume on ${this.luksFile}`)
    await exec(`cryptsetup --batch-mode luksFormat ${this.luksFile}`, Utils.setEcho(true))
    console.log('')

    // open LUKS volume
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
    if (!fs.existsSync(this.luksMountpoint)) {
      await exec(`mkdir -p ${this.luksMountpoint}`, this.echo)
    }
    if (!Utils.isMountpoint(this.luksMountpoint)) {
      Utils.warning(`mounting volume: ${this.luksDevice} on ${this.luksMountpoint}`)
      let code = (await exec(`mount ${this.luksDevice} ${this.luksMountpoint}`, Utils.setEcho(true))).code
      if (code != 0) {
        Utils.error(`mount ${this.luksDevice} ${this.luksMountpoint} failed`)
        process.exit(code)
      }
    } else {
      Utils.warning(`mounting volume: ${this.luksDevice} already mounted on ${this.luksMountpoint}, cleaning`)
      await exec(`rm -f ${this.privateSquashfs}`, Utils.setEcho(true))
    }


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
    let exclude_file = ''
    if (this.excludeFiles) {
      exclude_file = `-ef ${this.excludeFile}`
    }

    // creato tmpfs per /etc/
    await exec(`mkdir -p /tmp/tmpfs/etc`, this.echo)
    await exec(`cp -a /etc/passwd /tmp/tmpfs/etc`, this.echo)
    await exec(`cp -a /etc/group /tmp/tmpfs/etc`, this.echo)
    await exec(`cp -a /etc/shadow /tmp/tmpfs/etc`, this.echo)
    await exec(`mkdir -p /tmp/tmpfs/etc/lightdm`, this.echo)                          // lightdm
    await exec(`cp -a /etc/lightdm/lightdm.conf /tmp/tmpfs/etc/lightdm/`, this.echo)  // lightdm  

    let mkPrivateSquashfs = `mksquashfs \
                              /tmp/tmpfs/etc \
                              /home \
                              ${this.luksMountpoint}/${this.privateSquashfs} \
                              ${comp} \
                              ${exclude_nest} \
                              ${exclude_file} \
                              -keep-as-directory \ 
                              -noappend`

    mkPrivateSquashfs = mkPrivateSquashfs.replace(/\s\s+/g, ` `)
    await exec(mkPrivateSquashfs, Utils.setEcho(true))

    await exec(`rm -rf /tmp/tmpfs`, this.echo)

    // Shrink file
    this.echo = Utils.setEcho(true)
    
    // calculate size of the file
    let sizeString = (await exec(`ls ${this.luksFile} -s|awk '{print $1}'`, { echo: false, capture: true })).data
    
    let size = parseInt(sizeString)+2048
    Utils.warning(`size: ${size}`)
    
    let truncateSize=size*1024
    Utils.warning(`truncateSize: ${truncateSize}`)

    await exec(`fstrim ${this.luksMountpoint}`, this.echo)
    await exec(`umount ${this.luksMountpoint}`, this.echo)
    await exec(`cryptsetup resize ${this.luksDevice} ${size}`, this.echo) 
    await exec(`resize2fs ${this.luksDevice} -s ${size}`, this.echo)
    await exec(`fsck ${this.luksDevice}`, this.echo)
    await exec(`cryptsetup luksClose ${this.luksName}`, this.echo)  

    Utils.pressKeyToExit(`Done`)
  }
}

/**
 * Convert bytes to gigabytes
 */
function bytesToGB(bytes: number): string {
  const gigabytes = bytes / 1073741824;
  return gigabytes.toFixed(2) + ' GB';
}
