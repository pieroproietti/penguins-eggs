/**
 * Krill Installer - Simplified Refactoring
 * ./src/krill/prepare.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import axios from 'axios'
import fs from 'fs'
import os from 'os'

import Keyboards from '../../classes/keyboards.js'
import Locales from '../../classes/locales.js'
import Systemctl from '../../classes/systemctl.js'
import Utils from '../../classes/utils.js'
import { IDevices, INet } from '../../interfaces/index.js'
import {exec, shx } from '../../lib/utils.js'
import { IKeyboard, ILocation, IPartitions, IUsers, IWelcome } from '../interfaces/i_krill.js'
import { IKrillConfig } from '../interfaces/i_krill_config.js'
import { FsType, InstallationMode, SwapChoice } from './krill_enums.js'
import { keyboard } from './prepare.d/keyboard.js'
import { location } from './prepare.d/location.js'
import { network } from './prepare.d/network.js'
import { partitions } from './prepare.d/partitions.js'
import { summary } from './prepare.d/summary.js'
import { users } from './prepare.d/users.js'
// UI Components
import { welcome } from './prepare.d/welcome.js'
import Sequence from './sequence.js'

const config_file = '/etc/penguins-eggs.d/krill.yaml' as string

/**
 * Main Krill installer class - Simplified refactoring
 */
export default class Krill {
  chroot = false
  halt = false
  keyboard = keyboard
  keyboards = new Keyboards()
  // Configuration
  krillConfig = {} as IKrillConfig
  locales = new Locales()
  location = location
network = network
  nointeractive = false
  partitions = partitions
summary = summary
  // Installation flags
  unattended = false
  users = users
  // UI Components
  welcome = welcome

  /**
   * Constructor
   */
  constructor(unattended = false, nointeractive = false, halt = false, chroot = false) {
    this.unattended = unattended
    this.nointeractive = nointeractive
    this.chroot = chroot
    this.halt = halt
  }

  /**
   * Main prepare method - Simplified and cleaner
   */
  async prepare(
    krillConfig = {} as IKrillConfig,
    ip = false,
    random = false,
    domain = '',
    suspend = false,
    small = false,
    none = false,
    crypted = false,
    pve = false,
    btrfs = false,
    replace = '',
    testing = false,
    verbose = false
  ) {
    try {
      // System validation
      await this.checkSystemRequirements()
      
      // Configuration setup
      this.krillConfig = krillConfig
      await this.setupConfiguration()
      
      // Stop services
      await this.stopSystemServices(verbose, testing)
      
      // Build configurations
      const configs = await this.buildConfigurations(ip, random, suspend, small, none)
      
      // Interactive or unattended mode
      const finalConfigs = this.unattended 
        ? this.applyUnattendedOptions(configs, crypted, pve, btrfs, replace)
        : await this.runInteractiveMode(crypted, pve, btrfs, replace)
      
      // Install
      await this.performInstallation(finalConfigs, domain, testing, verbose)
      
    } catch (error) {
      await Utils.pressKeyToExit(`${(error as Error).message}\nkrill installer refuses to continue`)
      process.exit()
    }
  }

  /**
   * Apply options for unattended installation
   */
  private applyUnattendedOptions(configs: any, crypted: boolean, pve: boolean, btrfs: boolean, replace = '') {
    const { oPartitions, oUsers } = configs

    // Set defaults for unattended
    oPartitions.installationMode = InstallationMode.EraseDisk
    if (replace!='') {
      oPartitions.installationMode = InstallationMode.Replace
      oPartitions.replacedPartition = replace
      oPartitions.filesystemType = 'ext4'
    }
    

    // Apply options
    if (btrfs) oPartitions.filesystemType = FsType.btrfs
    if (crypted || pve) oPartitions.installationMode = InstallationMode.Luks

    // Set default installation device if empty
    if (oPartitions.installationDevice === '') {
      const cmd = `lsblk -d -n -p -o NAME,RM,RO,TYPE | awk '$2 == 0 && $3 == 0 && $4 == "disk" {print $1}'`
      const result = shx.exec(cmd, { silent: true }).stdout.trim()
      const drives = result ? result.split('\n') : []
      if (drives.length > 0) {
        oPartitions.installationDevice = drives[0]
      } else {
        console.error("[Krll] No suitable disc found for installation. Debug info:")
        shx.exec('lsblk -o NAME,RM,RO,TYPE,SIZE,MODEL', { silent: false }) 

        throw new Error("Unable to find installation drive")
      }
    }

    return configs
  }

  /**
   * Auto-configure timezone from internet
   */
  private async autoConfigureTimezone(): Promise<void> {
    try {
      const response = await axios.get('https://geoip.kde.org/v1/calamares')
      if (response.statusText === 'OK') {
        const timeZone = response.data.time_zone
        this.krillConfig.region = timeZone.slice(0, Math.max(0, timeZone.indexOf('/')))
        this.krillConfig.zone = timeZone.slice(Math.max(0, timeZone.indexOf('/') + 1))
      }
    } catch (error) {
      console.error('Error auto-configuring timezone:', error)
    }
  }

  /**
   * Build default configurations
   */
  private async buildConfigurations(ip: boolean, random: boolean, suspend: boolean, small: boolean, none: boolean) {
    // Generate hostname
    const hostname = this.generateHostname(ip, random)

    // Build configuration objects
    const oWelcome: IWelcome = { language: this.krillConfig.language }
    
    const oLocation: ILocation = {
      language: this.krillConfig.language,
      region: this.krillConfig.region,
      zone: this.krillConfig.zone
    }

    const oKeyboard: IKeyboard = {
      keyboardLayout: this.krillConfig.keyboardLayout,
      keyboardModel: this.krillConfig.keyboardModel,
      keyboardOption: this.krillConfig.keyboardOption,
      keyboardVariant: this.krillConfig.keyboardVariant
    }

    let {userSwapChoice} = this.krillConfig
    if (suspend) userSwapChoice = SwapChoice.Suspend
    else if (small) userSwapChoice = SwapChoice.Small
    else if (none) userSwapChoice = SwapChoice.None

    const oPartitions: IPartitions = {
      filesystemType: this.krillConfig.filesystemType,
      installationDevice: this.krillConfig.installationDevice,
      installationMode: this.krillConfig.installationMode,
      replacedPartition: this.krillConfig.replacedPartition,
      userSwapChoice
    }

    const oUsers: IUsers = {
      autologin: this.krillConfig.autologin,
      fullname: this.krillConfig.fullname,
      hostname,
      password: this.krillConfig.password,
      rootPassword: this.krillConfig.rootPassword,
      username: this.krillConfig.name
    }

    const oNetwork: INet = {
      address: Utils.address(),
      addressType: this.krillConfig.addressType,
      dns: Utils.getDns(),
      domain: Utils.getDomain(),
      gateway: Utils.gateway(),
      iface: await Utils.iface(),
      netmask: Utils.netmask()
    }

    return { oKeyboard, oLocation, oNetwork, oPartitions, oUsers, oWelcome }
  }

  /**
   * Check system requirements (disks, LVM)
   */
  private async checkSystemRequirements(): Promise<void> {
    // Check disk presence
    const drives = shx.exec('lsblk |grep disk|cut -f 1 "-d "', { silent: true }).stdout.trim().split('\n')
    if (drives[0] === '') {
      throw new Error('No disk to install the system in this machine.')
    }

    // Check LVM presence
    if (await this.pvExist()) {
      await this.createLvmRemovalScript()
      throw new Error('There is a lvm2 volume in the system, remove it manually before installation.')
    }
  }

  /**
   * Create script to remove LVM partitions
   */
  private async createLvmRemovalScript(): Promise<void> {
    const scriptName = "removeLvmPartitions"
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
    cmds += `# remove PV (Physical Volumes) \n`
    cmds += `pv=$(pvs --noheading -o pv_name | awk '{$1=$1};1')\n`
    cmds += `pvremove --force --force $pv\n`
    cmds += `# wipe PV (Physical Volumes) \n`
    cmds += `wipefs -a $pv\n`
    cmds += `# clean device\n`
    cmds += `sgdisk --zap-all $pv\n`
    cmds += `dd if=/dev/zero of=$pv bs=1M count=10\n`
    
    fs.writeFileSync(scriptName, cmds)
    await exec(`chmod +x ${scriptName}`)
  }

  /**
   * Generate hostname based on options
   */
  private generateHostname(ip: boolean, random: boolean): string {
    let {hostname} = this.krillConfig
    if (hostname === '') {
      hostname = shx.exec('cat /etc/hostname', { silent: true }).stdout.trim()
    }

    if (ip) {
      hostname = 'ip-' + Utils.address().replaceAll('.', '-')
    }

    if (random) {
      const fl = shx.exec(`tr -dc a-z </dev/urandom | head -c 2 ; echo ''`, { silent: true }).stdout.trim()
      const n = shx.exec(`tr -dc 0-9 </dev/urandom | head -c 3 ; echo ''`, { silent: true }).stdout.trim()
      const sl = shx.exec(`tr -dc a-z </dev/urandom | head -c 2 ; echo ''`, { silent: true }).stdout.trim()
      hostname = `${os.hostname()}-${fl}${n}${sl}`
    }

    return hostname
  }

  /**
   * Perform installation or testing
   */
  private async performInstallation(configs: any, domain: string, testing: boolean, verbose: boolean): Promise<void> {
    const { oKeyboard, oLocation, oNetwork, oPartitions, oUsers } = configs

    await this.summary(oLocation, oKeyboard, oPartitions, oUsers)

    if (testing) {
      console.log()
      Utils.titles("install --testing")
      console.log("Just testing krill, the process will end!")
      console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^")
      console.log(oPartitions)
      process.exit()
    } else {
      const sequence = new Sequence(oLocation, oKeyboard, oPartitions, oUsers, oNetwork)
      await sequence.start(domain, this.unattended, this.nointeractive, this.chroot, this.halt, verbose)
    }
  }

  /**
   * Check if Physical Volumes exist
   */
  private async pvExist(): Promise<boolean> {
    const check = `#!/bin/sh\npvdisplay |grep "PV Name" >/dev/null && echo 1|| echo 0`
    return shx.exec(check, { silent: true }).stdout.trim() === '1'
  }

  /**
   * Run interactive mode with UI
   */
  private async runInteractiveMode(crypted: boolean, pve: boolean, btrfs: boolean, replace: string) {
    const oWelcome = await this.welcome()
    const oLocation = await this.location(oWelcome.language)
    const oKeyboard = await this.keyboard()
    const oPartitions = await this.partitions(this.krillConfig.installationDevice, crypted, pve, btrfs, replace)
    const oUsers = await this.users()
    const oNetwork = await this.network()

    return { oKeyboard, oLocation, oNetwork, oPartitions, oUsers, oWelcome }
  }

  /**
   * Setup configuration files and auto-configure timezone
   */
  private async setupConfiguration(): Promise<void> {
    // Check config file
    if (!fs.existsSync(config_file)) {
      throw new Error(`Cannot find configuration file ${config_file}`)
    }

    // Check calamares/krill configuration
    let configRoot = '/etc/penguins-eggs.d/krill/'
    if (fs.existsSync('/etc/calamares/settings.conf')) {
      configRoot = '/etc/calamares/'
    }

    if (!fs.existsSync(configRoot + 'settings.conf')) {
      throw new Error('Cannot find calamares/krill configuration file, please create it running: sudo eggs calamares')
    }

    // Auto-configure timezone
    await this.autoConfigureTimezone()
  }

  /**
   * Stop system services
   */
  private async stopSystemServices(verbose: boolean, testing: boolean): Promise<void> {
    const systemdCtl = new Systemctl(verbose)
    if (await systemdCtl.isActive('udisks2.service') && !testing) {
      await systemdCtl.stop('udisks2.service')
    }
  }
}

/**
 * Utility function for netmask conversion
 */
function netmask2CIDR(mask: string) {
  const countCharOccurences = (string: string, char: string) => string.split(char).length - 1
  const decimalToBinary = (dec: number) => (dec >>> 0).toString(2)
  const getNetMaskParts = (nmask: string) => nmask.split('.').map(Number)
  
  return countCharOccurences(
    getNetMaskParts(mask)
      .map(part => decimalToBinary(part))
      .join(''),
    '1'
  )
}
