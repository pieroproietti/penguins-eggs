/**
 * penguins-eggs: krill
 *
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 *
 * OEM Installation (https://github.com/calamares/calamares/issues/871)
 *
 * Thanks to Adriaan De Groot (calamares author)
 *
 * There are two phases involved here, both of which could confusingly be called "OEM mode".
 * To be clear, the goal of the two phases is to end up with Linux (some distro) installed
 * on a piece of hardware which is passed to a customer's hands. On first boot, the
 * hardware is (re)configured with user input.
 *
 * Phase 1, OEM preparation
 * is about creating the image that will be used on first boot; so that is a normal partition,
 * create a standard user (e.g. "live") with autologin, populate a default desktop with a big
 * icon "first run this" or set up autostart of the configurator.
 * It is roughly a standard installation, with a little more configuration of the desktop
 * of the live user.
 *
 *   - welcome    - no need
 *   - locale     - en_US.UTF-8
 *   - keyboard   - us
 *   - partition  - ext4
 *   - users      - live/evolution root/evolution
 *   - network    - dhcp
 *   - summary    - no need
 *
 * Phase 2, "OEM user"
 * Set User Information on first Boot, from the "live" user, a new user for actual login --
 * along with whatever other configurations are wanted for the distro for the actual user.
 *
 *   - welcome
 *   - locale
 *   - keyboard
 *   - partition  - no need
 *   - users
 *   - network
 *   - summary
 *
 * Phase one should allow an empty password for the live user, and it would be useful to read
 * configuration from a file instead of having to go through the UI. It should install a
 * phase-2-configured Calamares into the target system
 * (either through a package, or as part of the image).
 *
 * Phase two is possible with the "dont-chroot" flag and (again) careful configuration.
 * Typically you drop the partition module (that was done in phase 1) and keep the users
 * module, add in a delete-calamares script (note to downstreams: that kind of module
 * should be upstreamed), add some user configuration (e.g. Plasma LNF if you're a
 * KDE-shipping-distro). To get all that you just need Calamares installed and the
 * relevant /etc/calamares/ files.
 */
import os from 'os'
import { IKrillConfig } from '../interfaces/i-krill-config'

import React from 'react';
import { Box, Text } from 'ink'
import { render, RenderOptions } from 'ink'
import Utils from '../classes/utils'
import axios from 'axios'
import shx from 'shelljs'
import fs from 'fs'
import Systemctl from '../classes/systemctl'
import Locales from '../classes/locales'
import Keyboards from '../classes/keyboards'

// libraries
const exec = require('../lib/utils').exec

import Welcome from '../components/welcome'
import Location from '../components/location'
import Partitions from '../components/partitions'
import Keyboard from '../components/keyboard'
import Users from '../components/users'
import Network from '../components/network'
import Summary from '../components/summary'

import selectLanguages from '../lib/select_languages'
import selectRegions from '../lib/select_regions'
import selectZones from '../lib/select_zones'

import selectInstallationDevice from '../lib/select_installation_device'
import selectInstallationMode from '../lib/select_installation_mode'
import selectUserSwapChoice from '../lib/select_user_swap_choice'
import selectFileSystemType from '../lib/select_filesystem_type'

import getUsername from '../lib/get_username'
import getUserfullname from '../lib/get_userfullname'
import getHostname from '../lib/get_hostname'
import getPassword from '../lib/get_password'

import selectKeyboardModel from '../lib/select_keyboard_model'
import selectKeyboardLayout from '../lib/select_keyboard_layout'
import selectKeyboardVariant from '../lib/select_keyboard_variant'
import selectKeyboardOption from '../lib/select_keyboard_option'

import selectInterface from '../lib/select_interface'
import selectAddressType from '../lib/select_address_type'
import getAddress from '../lib/get_address'
import getNetmask from '../lib/get_netmask'
import getGateway from '../lib/get_gateway'
import getDomain from '../lib/get_domain'
import getDns from '../lib/get_dns'

import Sequence from './krill-sequence'

import { INet } from '../interfaces/index'
import { IWelcome, ILocation, IKeyboard, IPartitions, IUsers } from '../interfaces/i-krill'

import si from 'systeminformation'


const config_file = '/etc/penguins-eggs.d/krill.yaml' as string

/**
 *
 */
export default class Krill {

  krillConfig = {} as IKrillConfig

  locales = new Locales()

  keyboards = new Keyboards()

  unattended = false

  nointeractive = false
  
  halt = false

  /**
   * constructor
   * @param unattended 
   * @param nointeractive 
   * @param halt 
   */
  constructor(unattended = false, nointeractive = false, halt = false) {
    this.unattended = unattended
    this.nointeractive = nointeractive
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
   * @param verbose 
   */
  async prepare(krillConfig = {} as IKrillConfig, ip = false, random = false, domain = 'local', suspend = false, small = false, none = false, cryped = false, pve = false, verbose = false) {
    /**
     * Check for disk presence
     */
    const drives = shx.exec('lsblk |grep disk|cut -f 1 "-d "', { silent: true }).stdout.trim().split('\n')
    if (drives[0] === '') {
      await Utils.pressKeyToExit(`No disk to install the system in this machine.\nkrill installer refuses to continue`)
    }

    /**
     * check for lvm2
     */
    if (await this.pvExist()) {
      await Utils.pressKeyToExit(`There is a lvm2 volume in the system, remove it manually before installation.\nkrill installer refuses to continue`)
    }

    /**
    * stop udisks2.service
    */
    const systemdCtl = new Systemctl(verbose)
    if (await systemdCtl.isActive('udisks2.service')) {
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

    this.krillConfig = krillConfig // yaml.load(fs.readFileSync(config_file, 'utf-8')) as IKrillConfig

    if (this.unattended) {
      oWelcome = { language: this.krillConfig.language }

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

      const drives = shx.exec('lsblk |grep disk|cut -f 1 "-d "', { silent: true }).stdout.trim().split('\n')
      const driveList: string[] = []
      drives.forEach((element: string) => {
        driveList.push('/dev/' + element)
      })

      let installationDevice = driveList[0]
      if (driveList.length > 0) {
        installationDevice = await selectInstallationDevice()        
      }

      oPartitions = {
        installationDevice: installationDevice,
        installationMode: this.krillConfig.installationMode,
        filesystemType: this.krillConfig.filesystemType,
        userSwapChoice: this.krillConfig.userSwapChoice
      }
      if (suspend) {
        oPartitions.userSwapChoice = 'suspend'
      } else if (small) {
        oPartitions.userSwapChoice = 'small'
      } else if (none) {
        oPartitions.userSwapChoice = 'none'
      }

      let hostname = this.krillConfig.hostname
      if (hostname === '') {
        hostname = shx.exec('cat /etc/hostname').trim()
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
        name: this.krillConfig.name,
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
      // end unattended!

    } else {
      oWelcome = await this.welcome()
      oLocation = await this.location(oWelcome.language)
      oKeyboard = await this.keyboard()
      oPartitions = await this.partitions(cryped, pve)
      oUsers = await this.users()
      oNetwork = await this.network()
    }

    /**
     * summary
     */
    await this.summary(oLocation, oKeyboard, oPartitions, oUsers)

    /**
     * INSTALL
     */
    const sequence = new Sequence(oLocation, oKeyboard, oPartitions, oUsers, oNetwork)
    await sequence.start(domain, this.unattended, this.nointeractive, this.halt, verbose)
  }

  /**
   * WELCOME
   */
  async welcome(): Promise<IWelcome> {

    let language = this.krillConfig.language
    if (language === '') {
      language = await this.locales.getDefault() // 'en_US.UTF-8'
    }

    let welcomeElem: JSX.Element
    while (true) {
      welcomeElem = <Welcome language={language} />
      if (await confirm(welcomeElem, "Confirm Welcome datas?")) {
        break
      }
      language = await selectLanguages(language)
    }
    return { language: language }
  }

  /**
   * LOCATION
   */
  async location(language: string): Promise<ILocation> {
    let region = this.krillConfig.region
    if (region === '') {
      let region = shx.exec('cut -f1 -d/ < /etc/timezone', { silent: true }).stdout.trim()
    }
    let zone = this.krillConfig.zone
    if (zone === '') {
      zone = shx.exec('cut -f2 -d/ < /etc/timezone', { silent: true }).stdout.trim()
    }

    // Try to auto-configure timezone by internet
    const url = `https://geoip.kde.org/v1/calamares`
    try {
      const response = await axios.get(url)
      if (response.statusText === 'OK') {
        const data = JSON.stringify(response.data)
        const obj = JSON.parse(data)
        region = obj.time_zone.substring(0, obj.time_zone.indexOf('/'))
        zone = obj.time_zone.substring(obj.time_zone.indexOf('/') + 1)
      }
    } catch (error) {
      console.error('error: ' + error)
    }

    let locationElem: JSX.Element
    while (true) {
      locationElem = <Location language={language} region={region} zone={zone} />
      if (await confirm(locationElem, "Confirm location datas?")) {
        break
      }
      region = await selectRegions(region)
      zone = await selectZones(region)
    }

    return {
      language: language,
      region: region,
      zone: zone
    }
  }

  /**
  * KEYBOARD
  */
  async keyboard(): Promise<IKeyboard> {
    let keyboardModel = this.krillConfig.keyboardModel
    if (keyboardModel === '') {
      keyboardModel = await this.keyboards.getModel()
    }

    let keyboardLayout = this.krillConfig.keyboardLayout
    if (keyboardLayout === '') {
      keyboardLayout = await this.keyboards.getLayout()
    }

    let keyboardVariant = this.krillConfig.keyboardVariant
    if (keyboardVariant === '') {
      keyboardVariant = await this.keyboards.getVariant()
    }

    let keyboardOption = this.krillConfig.keyboardOption
    if (keyboardOption === '') {
      keyboardOption = await this.keyboards.getOption()
    }


    let keyboardElem: JSX.Element
    while (true) {
      keyboardElem = <Keyboard keyboardModel={keyboardModel} keyboardLayout={keyboardLayout} keyboardVariant={keyboardVariant} keyboardOptions={keyboardOption} />
      if (await confirm(keyboardElem, "Confirm Keyboard datas?")) {
        break
      } else {
        keyboardModel = 'pc105'
        keyboardModel = await selectKeyboardModel(keyboardModel)

        keyboardLayout = 'us'
        keyboardLayout = await selectKeyboardLayout(keyboardLayout)

        keyboardVariant = ''
        keyboardVariant = await selectKeyboardVariant(keyboardLayout)

        keyboardOption = ''
        keyboardOption = await selectKeyboardOption(keyboardOption)
        if (keyboardModel === '') {
          keyboardModel = 'pc105'
        }
      }
    }
    return {
      keyboardModel: keyboardModel,
      keyboardLayout: keyboardLayout,
      keyboardVariant: keyboardVariant,
      keyboardOption: keyboardOption
    }
  }

  /**
  * PARTITIONS
  */
  async partitions(crypted = false, pve = false): Promise<IPartitions> {
    // Calamares won't use any devices with iso9660 filesystem on it.
    const drives = shx.exec('lsblk |grep disk|cut -f 1 "-d "', { silent: true }).stdout.trim().split('\n')
    const driveList: string[] = []
    drives.forEach((element: string) => {
      driveList.push('/dev/' + element)
    })
    let installationDevice = driveList[0] // it was just /dev/sda before

    let installationMode = this.krillConfig.installationMode
    if (installationMode === '') {
      installationMode = 'standard'
    }
    if (crypted) {
      installationMode = 'full-encrypted'
    } else if (pve) {
      installationMode = 'lvm2'
    }

    let filesystemType = 'ext4'
    let userSwapChoice = 'small'

    let partitionsElem: JSX.Element
    while (true) {
      partitionsElem = <Partitions installationDevice={installationDevice} installationMode={installationMode} filesystemType={filesystemType} userSwapChoice={userSwapChoice} />
      if (await confirm(partitionsElem, "Confirm Partitions datas?")) {
        break
      } else {
        installationDevice = ''
        installationMode = 'standard'
        if (crypted) {
          installationMode = 'full-encrypted'
        } else if (pve) {
          installationMode = 'lvm2'
        }
        filesystemType = ''
        userSwapChoice = ''
      }

      installationDevice = await selectInstallationDevice()
      installationMode = await selectInstallationMode()
      filesystemType = await selectFileSystemType()
      userSwapChoice = await selectUserSwapChoice()
    }
    return {
      installationDevice: installationDevice,
      installationMode: installationMode,
      filesystemType: filesystemType,
      userSwapChoice: userSwapChoice
    }
  }

  /**
   * USERS
   */
  async users(): Promise<IUsers> {

    let name = this.krillConfig.name
    if (name === '') {
      name = 'artisan'
    }

    let fullname = this.krillConfig.fullname
    if (fullname === '') {
      fullname = 'artisan'
    }

    let password = this.krillConfig.password
    if (password === '') {
      password = 'evolution'
    }

    let rootPassword = this.krillConfig.rootPassword
    if (rootPassword === '') {
      rootPassword = 'evolution'
    }

    let hostname = this.krillConfig.hostname
    if (hostname === '') {
      hostname = shx.exec('cat /etc/hostname').trim()
    }

    let autologin = true

    let sameUserPassword = true

    let usersElem: JSX.Element
    while (true) {
      usersElem = <Users name={name} fullname={fullname} hostname={hostname} password={password} rootPassword={rootPassword} autologin={autologin} sameUserPassword={sameUserPassword} />
      if (await confirm(usersElem, "Confirm Users datas?")) {
        break
      }
      name = await getUsername(name)
      fullname = await getUserfullname(fullname)
      password = await getPassword(password)
      hostname = await getHostname(hostname)
    }

    return {
      name: name,
      fullname: fullname,
      password: password,
      rootPassword: rootPassword,
      autologin: autologin,
      hostname: hostname
    }
  }

  /**
   * Network
   */
  async network(): Promise<INet> {
    const i = {} as INet

    const ifaces: string[] = fs.readdirSync('/sys/class/net/')
    i.iface = await Utils.iface()
    i.addressType = 'dhcp'
    i.address = Utils.address()
    i.netmask = Utils.netmask()
    i.gateway = Utils.gateway()
    i.dns = Utils.getDns()
    i.domain = Utils.getDomain()
    let dnsString = ''
    for (let c = 0; c < i.dns.length; c++) {
      dnsString += i.dns[c].trim()
      if (c < i.dns.length - 1) {
        dnsString += '; '
      }
    }

    let networkElem: JSX.Element
    while (true) {
      networkElem = <Network iface={i.iface} addressType={i.addressType} address={i.address} netmask={i.netmask} gateway={i.gateway} domain={i.domain} dns={dnsString} />
      if (await confirm(networkElem, "Confirm Network datas?")) {
        break
      }

      i.iface = await selectInterface(i.iface, ifaces)
      i.addressType = await selectAddressType()
      if (i.addressType === 'static') {
        i.address = await getAddress(i.address)
        i.netmask = await getNetmask(i.netmask)
        i.gateway = await getGateway(i.gateway)
        i.domain = await getDomain(i.domain)
        i.dns = (await getDns(dnsString)).split(';')
        dnsString = ''
        for (let c = 0; c < i.dns.length; c++) {
          dnsString += i.dns[c].trim()
          if (c < i.dns.length - 1) {
            dnsString += '; '
          }
        }
      }
    }
    return i
  }

  /**
   * SUMMARY
   */
  async summary(location: ILocation, keyboard: IKeyboard, partitions: IPartitions, users: IUsers) {
      let summaryElem: JSX.Element

    let message = "Double check the installation disk: " + partitions.installationDevice
    if (this.unattended && this.nointeractive) {
      message = "Unattended installation will start in 5 seconds, press CTRL-C to abort!"
    }


    while (true) {
      summaryElem = <Summary name={users.name} password={users.password} rootPassword={users.rootPassword} hostname={users.hostname} region={location.region} zone={location.zone} language={location.language} keyboardModel={keyboard.keyboardModel} keyboardLayout={keyboard.keyboardLayout} installationDevice={partitions.installationDevice} message={message} />
      if (this.unattended && this.nointeractive) {
        redraw(summaryElem)
        await sleep(5000)
        break
      } else if (this.unattended && !this.nointeractive) {
        if (await confirm(summaryElem, "Read the Summary, confirm or abort")) {
          break
        } else {
          process.exit(0)
        }
      } else if (await confirm(summaryElem, "Confirm Summary datas?")) {
        break
      }
    }
  }

  /**
   * return true if pv exist
   */
  private async pvExist(): Promise<boolean> {
    let exist = false
    const check = `#!/bin/sh\npvdisplay |grep "PV Name" >/dev/null && echo 1|| echo 0`
    if (shx.exec(check).stdout.trim() === '1') {
      exist = true
    }
    return exist
  }
}

/**
 * confirm
 * @returns
 */
async function confirm(elem: JSX.Element, msg = "Confirm") {
  redraw(elem)

  const result = JSON.parse(await Utils.customConfirmAbort(msg))
  let retval = false
  if (result.confirm === 'Yes') {
    retval = true
  } else if (result.confirm === 'Abort') {
    process.exit()
  }
  return retval
}

/**
 * Occorre farglierlo rigenerare a forza
 * anche quando NON cambiano i dati
 * forceUpdate
 */
function redraw(elem: JSX.Element) {
  let opt: RenderOptions = {}
  opt.patchConsole = true
  opt.debug = false
  console.clear()
  render(elem, opt)
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

/**
 *
 * @param ms
 * @returns
 */
function sleep(ms = 0) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
