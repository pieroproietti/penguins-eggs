import { Command, flags } from '@oclif/command'
import React from 'react';
import { render, RenderOptions } from 'ink'
import Utils from './utils'
import shx from 'shelljs'
import fs from 'fs'
import dns from 'dns'

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
import selectUserSwapChoice from '../lib/select_user_swap_choice'
import selectFileSystemType from '../lib/select_filesystem_type'

import getUsername from '../lib/get_username'
import getUserfullname from '../lib/get_userfullname'
import getHostname from '../lib/get_hostname'
import getPassword from '../lib/get_password'

import selectKeyboardLayout from '../lib/select_keyboard_layout'

import selectInterface from '../lib/select_interface'
import selectAddressType from '../lib/select_address_type'
import getAddress from '../lib/get_address'
import getNetmask from '../lib/get_netmask'
import getGateway from '../lib/get_gateway'
import getDomain from '../lib/get_domain'
import getDns from '../lib/get_dns'

import Hatching from './krill_install'

import { INet } from '../interfaces'
import {IWelcome, ILocation, IKeyboard, IPartitions, IUsers} from '../interfaces/i-krill'


export default class Krill {

  async prepare() {

    const oWelcome = await this.welcome()
    const oLocation = await this.location(oWelcome.language)
    const oKeyboard = await this.keyboard()
    const oPartitions = await this.partitions()
    const oUsers = await this.users()
    const oNetwork = await this.network()
    await this.summary(oLocation, oKeyboard, oPartitions)
    await this.install(oLocation, oKeyboard, oPartitions, oUsers, oNetwork)
  }



  /**
   * WELCOME
   */
  async welcome(): Promise<IWelcome> {
    let language = shx.exec('cat /etc/default/locale |grep LANG=| cut -f2 -d=|cut -f1 -d.', { silent: true }).stdout.trim()
    let welcomeElem: JSX.Element
    while (true) {
      welcomeElem = <Welcome language={language} />
      if (await confirm(welcomeElem, "Confirm Welcome datas?")) {
        break
      } else {
        language = ''
      }
      welcomeElem = <Welcome language={language} />
      redraw(welcomeElem)

      language = await selectLanguages()
    }
    return { language: language }
  }

  /**
   * LOCATION
   */
  async location(language: string): Promise<ILocation> {
    let region = shx.exec('cat /etc/timezone |cut -f1 -d/', { silent: true }).stdout.trim()
    let zone = shx.exec('cat /etc/timezone |cut -f2 -d/', { silent: true }).stdout.trim()
    let locationElem: JSX.Element
    while (true) {
      locationElem = <Location language={language} region={region} zone={zone} />
      if (await confirm(locationElem, "Confirm location datas?")) {
        break
      } else {
        region = ''
        zone = ''
      }
      locationElem = <Location language={language} region={region} zone={zone} />
      redraw(locationElem)

      region = await selectRegions()
      locationElem = <Location language={language} region={region} zone={zone} />
      redraw(locationElem)

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
    let keyboardModel = shx.exec('cat /etc/default/keyboard |grep XKBMODEL|cut -f2 -d=|cut -f2 "-d\\""', { silent: true }).stdout.trim()
    if (keyboardModel === '') {
      keyboardModel = "pc105"
    }
    let keyboardLayout = shx.exec('cat /etc/default/keyboard |grep XKBLAYOUT|cut -f2 -d=|cut -f2 "-d\\""', { silent: true }).stdout.trim()
    let keyboardVariant = shx.exec('/etc/default/keyboard |grep XKBVARIANT|cut -f2 -d=|cut -f2 "-d\\""', { silent: true }).stdout.trim()
    let keyboardOptions = shx.exec('cat /etc/default/keyboard |grep XKBOPTIONS|cut -f2 -d=|cut -f2 "-d\\""', { silent: true }).stdout.trim()
    let keyboardElem: JSX.Element
    while (true) {
      keyboardElem = <Keyboard keyboardModel={keyboardModel} keyboardLayout={keyboardLayout} keyboardVariant={keyboardVariant} />
      if (await confirm(keyboardElem, "Confirm Keyboard datas?")) {
        break
      } else {
        keyboardModel = 'pc105'
        keyboardLayout = ''
        keyboardVariant = ''
      }
      keyboardLayout = await selectKeyboardLayout()
    }
    return {
      keyboardModel: keyboardModel,
      keyboardLayout: keyboardLayout,
      keyboardVariant: keyboardVariant
    }
  }

  /**
  * PARTITIONS
  */
  async partitions(): Promise<IPartitions> {
    let installationDevice = '/dev/sda'
    let installationMode = 'standard'
    let filesystemType = 'ext4'
    let userSwapChoice = 'small'
    let partitionsElem: JSX.Element
    while (true) {
      partitionsElem = <Partitions installationDevice={installationDevice} filesystemType={filesystemType} userSwapChoice={userSwapChoice} />
      if (await confirm(partitionsElem, "Confirm Partitions datas?")) {
        break
      } else {
        installationDevice = ''
        filesystemType = ''
        userSwapChoice = ''
      }

      partitionsElem = <Partitions installationDevice={installationDevice} filesystemType={filesystemType} userSwapChoice={userSwapChoice} />
      redraw(partitionsElem)
      installationDevice = await selectInstallationDevice()

      partitionsElem = <Partitions installationDevice={installationDevice} filesystemType={filesystemType} userSwapChoice={userSwapChoice} />
      redraw(partitionsElem)
      filesystemType = await selectFileSystemType()

      partitionsElem = <Partitions installationDevice={installationDevice} filesystemType={filesystemType} userSwapChoice={userSwapChoice} />
      redraw(partitionsElem)
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

      usersElem = <Users name={name} fullname={fullname} hostname={hostname} password={password} rootPassword={rootPassword} autologin={autologin} sameUserPassword={sameUserPassword} />
      redraw(usersElem)
      name = await getUsername(name)

      usersElem = <Users name={name} fullname={fullname} hostname={hostname} password={password} rootPassword={rootPassword} autologin={autologin} sameUserPassword={sameUserPassword} />
      redraw(usersElem)
      fullname = await getUserfullname(fullname)

      usersElem = <Users name={name} fullname={fullname} hostname={hostname} password={password} rootPassword={rootPassword} autologin={autologin} sameUserPassword={sameUserPassword} />
      redraw(usersElem)
      password = await getPassword(password)

      usersElem = <Users name={name} fullname={fullname} hostname={hostname} password={password} rootPassword={rootPassword} autologin={autologin} sameUserPassword={sameUserPassword} />
      redraw(usersElem)
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
  async install(location: ILocation, keyboard: IKeyboard, partitions: IPartitions, users: IUsers, network: INet) {
    const hatching = new Hatching(location, keyboard, partitions, users, network)
    hatching.install(true)
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

  opt.patchConsole = false
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
