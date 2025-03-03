/**
 * ./src/krill/prepare.tsx
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

import os from 'os'
import { IKrillConfig } from '../interfaces/i-krill-config.js'

import axios from 'axios'
import shx, { echo } from 'shelljs'
import fs from 'fs'

import Keyboards from '../../classes/keyboards.js'
import Locales from '../../classes/locales.js'
import Systemctl from '../../classes/systemctl.js'
import Utils from '../../classes/utils.js'

// libraries
import { exec } from '../../lib/utils.js'

import { welcome } from './prepare.d/welcome.js'
import { location } from './prepare.d/location.js'
import { keyboard } from './prepare.d/keyboard.js'
import { partitions } from './prepare.d/partitions.js'
import { users } from './prepare.d/users.js'
import { network } from './prepare.d/network.js'
import { summary } from './prepare.d/summary.js'

import Sequence from './sequence.js'
import { INet } from '../../interfaces/index.js'
import { IWelcome, ILocation, IKeyboard, IPartitions, IUsers } from '../interfaces/i-krill.js'
import { SwapChoice, InstallationMode } from './krill-enums.js'

const config_file = '/etc/penguins-eggs.d/krill.yaml' as string

/**
 *
 */
export default class Krill {
  welcome = welcome
  location = location
  keyboard = keyboard
  partitions = partitions
  users = users
  network = network
  summary = summary

  krillConfig = {} as IKrillConfig

  locales = new Locales()

  keyboards = new Keyboards()

  unattended = false

  nointeractive = false

  chroot = false

  halt = false

  /**
   * constructor
   * @param unattended 
   * @param nointeractive 
   * @param halt 
   */
  constructor(unattended = false, nointeractive = false, halt = false, chroot = false) {
    this.unattended = unattended
    this.nointeractive = nointeractive
    this.chroot = chroot
    this.halt = halt
  }

  /**
   * 
   * @param krillConfig 
   * @param ip 
   * @param random 
   * @param domain 
   * @param suspend 
   * @param small 
   * @param none 
   * @param cryped 
   * @param pve 
   * @param btrfs 
   * @param testing 
   * @param verbose 
   */
  async prepare(krillConfig = {} as IKrillConfig, ip = false, random = false, domain = '', suspend = false, small = false, none = false, cryped = false, pve = false, btrfs = false, testing = false, verbose = false) {
    // Check disk presence
    const drives = shx.exec('lsblk |grep disk|cut -f 1 "-d "', { silent: true }).stdout.trim().split('\n')
    if (drives[0] === '') {
      await Utils.pressKeyToExit(`No disk to install the system in this machine.\nkrill installer refuses to continue`)
      process.exit()
    }

    // Check Lvm2 presence
    if (await this.pvExist()) {
      // Create removeLvmPartitions
      let scriptName = "removeLvmPartitions"

      let cmds = "#!/bin/bash\n"
      cmds += `# remove LV (Logical Volumes)\n`
      cmds += `vg=$(vgs --noheadings -o vg_name| awk '{$1=$1};1')\n`
      cmds += `lvs -o lv_name --noheadings | awk '{$1=$1};1' | while read -r lv; do\n`
      cmds += ` lvremove -y /dev/mapper/$vg-$lv\n`
      cmds += `done\n`
      cmds += `\n`
      cmds += `# remove VG (Volume groups)\n`
      cmds += `vgremove --force $(vgs --noheadings -o vg_name $vg)\n`
      cmds += `\n`
      cmds += `# remove PV (Phisical Volumes) \n`
      cmds += `pv=$(pvs --noheading -o pv_name | awk '{$1=$1};1')\n`
      cmds += `pvremove --force --force $pv\n`
      cmds += `# wipe PV (Phisical Volumes) \n`
      cmds += `wipefs -a $pv\n`
      cmds += `# clean device\n`
      cmds += `sgdisk --zap-all $pv\n`
      cmds += `dd if=/dev/zero of=$pv bs=1M count=10\n`

      fs.writeFileSync(scriptName, cmds)
      await exec(`chmod +x ${scriptName}`)

      await Utils.pressKeyToExit(`There is a lvm2 volume in the system, remove it manually before installation.\nkrill installer refuses to continue`)
      process.exit()
    }

    /**
    * stop udisks2.service
    */
    const systemdCtl = new Systemctl(verbose)
    if (await systemdCtl.isActive('udisks2.service') && !testing) {
      await systemdCtl.stop('udisks2.service')
    }

    let oWelcome = {} as IWelcome
    let oLocation = {} as ILocation
    let oKeyboard = {} as IKeyboard
    let oPartitions = {} as IPartitions
    let oUsers = {} as IUsers
    let oNetwork = {} as INet

    /**
     * load default values
     */
    if (!fs.existsSync(config_file)) {
      console.log(`cannot find configuration file ${config_file},`)
      process.exit(1)
    }

    this.krillConfig = krillConfig

    /**
     * test calamares/krill configuration presence
     */
    let configRoot = '/etc/penguins-eggs.d/krill/'
    if (fs.existsSync('/etc/calamares/settings.conf')) {
      configRoot = '/etc/calamares/'
    }
    if (!fs.existsSync(configRoot + 'settings.conf')) {
      console.log(`Cannot find calamares/krill configuration file, please create it running:`)
      console.log(`sudo eggs calamares`)
      process.exit(1)
    }


    oWelcome = { language: this.krillConfig.language }
    // Try to auto-configure timezone by internet
    const url = `https://geoip.kde.org/v1/calamares`
    try {
      const response = await axios.get(url)
      if (response.statusText === 'OK') {
        const data = JSON.stringify(response.data)
        const obj = JSON.parse(data)
        this.krillConfig.region = obj.time_zone.substring(0, obj.time_zone.indexOf('/'))
        this.krillConfig.zone = obj.time_zone.substring(obj.time_zone.indexOf('/') + 1)
      }
    } catch (error) {
      console.error('error: ' + error)
    }

    oLocation = {
      language: this.krillConfig.language,
      region: this.krillConfig.region,
      zone: this.krillConfig.zone
    }

    oKeyboard = {
      keyboardModel: this.krillConfig.keyboardModel,
      keyboardLayout: this.krillConfig.keyboardLayout,
      keyboardVariant: this.krillConfig.keyboardVariant,
      keyboardOption: this.krillConfig.keyboardOption
    }

    
    oPartitions = {
      installationDevice: this.krillConfig.installationDevice,
      installationMode: this.krillConfig.installationMode,
      filesystemType: this.krillConfig.filesystemType,
      userSwapChoice: this.krillConfig.userSwapChoice,
      replacedPartition: this.krillConfig.replacedPartition
    }

    if (btrfs) {
      oPartitions.filesystemType = 'btrfs'
    }

    if (suspend) {
      oPartitions.userSwapChoice = SwapChoice.Suspend
    } else if (small) {
      oPartitions.userSwapChoice = SwapChoice.Small
    } else if (none) {
      oPartitions.userSwapChoice = SwapChoice.None
    }

    let hostname = this.krillConfig.hostname
    if (hostname === '') {
      hostname = shx.exec('cat /etc/hostname', { silent: true }).trim()
    }

    if (ip) {
      hostname = 'ip-' + Utils.address().replaceAll('.', '-')
    }

    if (random) {
      const fl = shx.exec(`tr -dc a-z </dev/urandom | head -c 2 ; echo ''`, { silent: true }).trim()
      const n = shx.exec(`tr -dc 0-9 </dev/urandom | head -c 3 ; echo ''`, { silent: true }).trim()
      const sl = shx.exec(`tr -dc a-z </dev/urandom | head -c 2 ; echo ''`, { silent: true }).trim()
      hostname = `${os.hostname()}-${fl}${n}${sl}`
    }

    oUsers = {
      username: this.krillConfig.name,
      fullname: this.krillConfig.fullname,
      password: this.krillConfig.password,
      rootPassword: this.krillConfig.rootPassword,
      autologin: this.krillConfig.autologin,
      hostname: hostname
    }

    oNetwork =
    {
      iface: await Utils.iface(),
      addressType: this.krillConfig.addressType,
      address: Utils.address(),
      netmask: Utils.netmask(),
      gateway: Utils.gateway(),
      dns: Utils.getDns(),
      domain: Utils.getDomain()
    }

    /**
     * interactive
     */
    if (!this.unattended) {
      oWelcome = await this.welcome()
      oLocation = await this.location(oWelcome.language)
      oKeyboard = await this.keyboard()
      oPartitions = await this.partitions(this.krillConfig.installationDevice, cryped, pve, btrfs)
      oUsers = await this.users()
      oNetwork = await this.network()
    } else {
      /**
       * this variables ALWAYS need to be initializated
       */

      // oPartitions.installationDevice
      if (oPartitions.installationDevice === '') {
        // No RAID considerated
        const drives = shx.exec('lsblk |grep disk|cut -f 1 "-d "', { silent: true }).stdout.trim().split('\n')
        if (drives.length > 0) {
          oPartitions.installationDevice = `/dev/` + drives[0]
        } else {
          console.log("Unable to find installation drive")
          process.exit(1)
        }
      }

      /**
       * Defaults
       */

      // oPartitions.installationMode 
      if (cryped) {
        oPartitions.installationMode = InstallationMode.Luks
      }

    }
    await this.summary(oLocation, oKeyboard, oPartitions, oUsers)


    /**
     * INSTALL
     */
    const sequence = new Sequence(oLocation, oKeyboard, oPartitions, oUsers, oNetwork)


    if (testing) {
      console.log()
      Utils.titles("install --testing")
      console.log("Just testing krill, the process will end!")
      console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^")
      console.log(oPartitions)
      process.exit()
    } else {
      await sequence.start(domain, this.unattended, this.nointeractive, this.chroot, this.halt, verbose)
    }
  }







  /**
   * return true if pv exist
   */
  private async pvExist(): Promise<boolean> {
    let exist = false
    const check = `#!/bin/sh\npvdisplay |grep "PV Name" >/dev/null && echo 1|| echo 0`
    if (shx.exec(check, { silent: true }).stdout.trim() === '1') {
      exist = true
    }
    return exist
  }
}


/**
 *
 * @param mask
 */
function netmask2CIDR(mask: string) {
  const countCharOccurences = (string: string, char: string) => string.split(char).length - 1;

  const decimalToBinary = (dec: number) => (dec >>> 0).toString(2);
  const getNetMaskParts = (nmask: string) => nmask.split('.').map(Number);
  const netmask2CIDR = (netmask: string) =>
    countCharOccurences(
      getNetMaskParts(netmask)
        .map(part => decimalToBinary(part))
        .join(''),
      '1'
    );
}
