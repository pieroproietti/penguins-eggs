import React from 'react';
import { render, RenderOptions } from 'ink'
import Utils from './utils'
import shx from 'shelljs'
import fs from 'fs'
import Systemctl from './systemctl'
import Locales from './locales'
import Keyboards from './keyboards'

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

import Hatching from './krill_install'

import { INet } from '../interfaces'
import { IWelcome, ILocation, IKeyboard, IPartitions, IUsers } from '../interfaces/i-krill'


export default class Krill {

  locales = new Locales()
  keyboards = new Keyboards()

  /**
   * 
   * @param cryped 
   */
  async prepare(cryped = false, pve = false, verbose = false) {
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

    const oWelcome = await this.welcome()
    const oLocation = await this.location(oWelcome.language)
    const oKeyboard = await this.keyboard()
    const oPartitions = await this.partitions(cryped, pve)
    const oUsers = await this.users()
    const oNetwork = await this.network()
    await this.summary(oLocation, oKeyboard, oPartitions)
    await this.install(oLocation, oKeyboard, oPartitions, oUsers, oNetwork, verbose)
  }



  /**
   * WELCOME
   */
  async welcome(): Promise<IWelcome> {

    let language = 'en_US.UTF-8' //await this.locales.getDefault()
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
    let region = shx.exec('cut -f1 -d/ < /etc/timezone', { silent: true }).stdout.trim()
    let zone = shx.exec('cut -f2 -d/ < /etc/timezone', { silent: true }).stdout.trim()
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

    let keyboardModel = await this.keyboards.getModel()
    let keyboardLayout = await this.keyboards.getLayout()
    let keyboardVariant = await this.keyboards.getVariant()
    let keyboardOption = await this.keyboards.getOption()

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
    const drives = shx.exec('lsblk |grep disk|cut -f 1 "-d "', { silent: true }).stdout.trim().split('\n')
    const driveList: string[] = []
    drives.forEach((element: string) => {
      driveList.push('/dev/' + element)
    })
    let installationDevice = driveList[0] // it was just /dev/sda before
    let installationMode = 'standard'
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
    let name = 'artisan'
    let fullname = 'artisan'
    let password = 'evolution'
    let rootPassword = 'evolution'
    let hostname = shx.exec('cat /etc/hostname').trim()
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
    i.iface = Utils.iface()
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
  async summary(location: ILocation, keyboard: IKeyboard, partitions: IPartitions) {
    let summaryElem: JSX.Element
    while (true) {
      summaryElem = <Summary region={location.region} zone={location.zone} language={location.language} keyboardModel={keyboard.keyboardModel} keyboardLayout={keyboard.keyboardLayout} installationDevice={partitions.installationDevice} />
      if (await confirm(summaryElem, "Confirm Summary datas?")) {
        break
      }
    }
  }

  /**
   * INSTALL
   */
  async install(location: ILocation, keyboard: IKeyboard, partitions: IPartitions, users: IUsers, network: INet, verbose = false) {
    const hatching = new Hatching(location, keyboard, partitions, users, network)
    hatching.install(verbose)
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

  shx.exec('clear')
  render(elem, opt)
}

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
