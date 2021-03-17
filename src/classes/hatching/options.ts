/**
 * penguins-eggs: hatch.js
 *
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 *
 */

import fs = require('fs')
import os = require('os')
import chalk = require('chalk')
import inquirer = require('inquirer')
import drivelist = require('drivelist')
import Utils from '../utils'
import { IDevices, IDevice } from '../../interfaces'
const exec = require('../../lib/utils').exec

/**
 * Queste definizioni sono SOLO per hatching
 */
interface INet {
   interface: string
   addressType: string
   address: string
   netMask: string
   gateway: string
   dns: string
}

interface IUsers {
   name: string
   fullname: string
   password: string
   autologin: string
   rootpassword: string
}

interface IHost {
   name: string
   domain: string
}

interface IDisk {
   installationDevice: string
   partionType: string
   fsType: string
}

/**
 * hatch, installazione
 */
export default class Hatching {

   target = '/tmp/TARGET'

   efi = false

   devices = {} as IDevices

   users = {} as IUsers

   host = {} as IHost

   net = {} as INet

   disk = {} as IDisk

   /**
    * constructor
    */
   constructor() {
      this.devices.efi = {} as IDevice
      this.devices.boot = {} as IDevice
      this.devices.root = {} as IDevice
      this.devices.data = {} as IDevice
      this.devices.swap = {} as IDevice
   }

   /**
    * question
    */
   async confirm(verbose = false, umount = false): Promise<boolean> {
      let result = false
      if (verbose) {
         Utils.warning('hatching: questions')
      }

      const msg1 = '\nThe process of installation will format your disk and destroy all datas on it.\n Did You are sure?\n'
      const msg2 = '\nWe need to be absolutely sure, did You saved your data before to proced?\n'
      const msg3 = '\nConfirm, again you want to continue?\n'

      if (await Utils.customConfirm(msg1)) {
         if (await Utils.customConfirm(msg2)) {
            if (await Utils.customConfirm(msg3)) {
               result = true
            }
         }
      }
      return result
   }

   /**
    * getOptions
    */
   async getOptions(verbose = false, umount = false) {
      if (verbose) {
         Utils.warning('install')
      }
      while (true) {
         /**
          * users configuration
          */
         while (true) {
            Utils.warning('user configuration')
            const optionsUsers: any = await this.getUsers(verbose)
            this.users = JSON.parse(optionsUsers)
            const result = JSON.parse(await Utils.customConfirmAbort())
            this.showUsers()
            if (await this.configAbort()) {
               break
            }
         }

         /**
          * host configuration
          */
         while (true) {
            Utils.titles(`install`)
            Utils.warning('get options host')
            const optionsHost: any = await this.getHost(verbose)
            this.host = JSON.parse(optionsHost)
            this.showHost()
            if (await this.configAbort()) {
               break
            }
         }

         /**
          * net configuration
          */
         while (true) {
            const optionsNet: any = await this.getNet(verbose)
            this.net = JSON.parse(optionsNet)
            this.showNet()
            if (await this.configAbort()) {
               break
            }
         }

         /**
          * disk and partition
          */
         const drives: any = await drivelist.list()
         const aDrives: string[] = []
         drives.forEach((element: { device: string }) => {
            aDrives.push(element.device)
         })
         const partitionTypes = ['simple', 'lvm2']
         while (true) {
            Utils.titles(`install`)
            Utils.warning('get disk configuration')

            const optionsDisk: any = await this.getOptionsDisk(aDrives, partitionTypes, verbose)
            this.disk = JSON.parse(optionsDisk)
            this.showDisk()
            if (await this.configAbort()) {
               break
            }
         }

         /**
          * Conferma finale
          */
         Utils.titles(`install`)
         this.showAll()
         if (await this.configAbort()) {
            break
         }
      }
   }


   /**
    *
    * @param verbose
    */
   private async getUsers(verbose = false) {
      const echo = Utils.setEcho(verbose)
      if (verbose) {
         Utils.warning('hatching: getOptionsUsers()')
      }

      return new Promise(function (resolve) {
         const questions: Array<Record<string, any>> = [
            {
               type: 'input',
               name: 'name',
               message: 'user name: ',
               default: 'artisan'
            },
            {
               type: 'input',
               name: 'fullname',
               message: 'user fullname: ',
               default: 'artisan'
            },
            {
               type: 'password',
               name: 'password',
               message: 'Enter a password for the user: ',
               default: 'evolution'
            },
            {
               type: 'password',
               name: 'rootpassword',
               message: 'Enter a password for root: ',
               default: 'evolution'
            }
         ]

         inquirer.prompt(questions).then(function (options) {
            resolve(JSON.stringify(options))
         })
      })
   }

   /**
    * 
    */
   showUsers() {
      console.log(`- ` + chalk.bgGreen.black(`name: `) + chalk.bgGreen.whiteBright(this.users.name))
      console.log(`- ` + chalk.bgGreen.black(`fullname: `) + chalk.bgGreen.whiteBright(this.users.fullname))
      console.log(`- ` + chalk.bgGreen.black(`user password: `) + chalk.bgGreen.whiteBright(this.users.password))
      console.log(`- ` + chalk.bgGreen.black(`root password: `) + chalk.bgGreen.whiteBright(this.users.rootpassword))
      console.log()
   }



   /**
    *
    * @param verbose
    */
   private async getHost(verbose = false) {
      const echo = Utils.setEcho(verbose)
      if (verbose) {
         Utils.warning('hatching: getOptionsHost()')
      }

      return new Promise(function (resolve) {
         const questions: Array<Record<string, any>> = [
            {
               type: 'input',
               name: 'name',
               message: 'name: ',
               default: os.hostname
            },
            {
               type: 'imput',
               name: 'domain',
               message: 'domain name',
               default: 'lan'
            }
         ]
         inquirer.prompt(questions).then(function (options) {
            resolve(JSON.stringify(options))
         })
      })
   }

   showHost() {
      console.log(`- ` + chalk.bgGreen.black(`name: `) + chalk.bgGreen.whiteBright(this.host.name))
      console.log(`- ` + chalk.bgGreen.black(`domain: `) + chalk.bgGreen.whiteBright(this.host.domain))
   }

   /**
    *
    * @param verbose
    */
   private async getNet(verbose = false) {
      const echo = Utils.setEcho(verbose)
      if (verbose) {
         Utils.warning('hatching: getOptionsNet()')
      }

      return new Promise(function (resolve) {
         const questions: Array<Record<string, any>> = [
            {
               type: 'list',
               name: 'interface',
               message: 'Select the network interface: ',
               choices: ifaces
            },
            {
               type: 'list',
               name: 'addressType',
               message: 'Select the network type: ',
               choices: ['dhcp', 'static'],
               default: 'dhcp'
            },
            {
               type: 'input',
               name: 'address',
               message: 'Insert IP address: ',
               default: Utils.netAddress(),
               when: function (answers: any) {
                  return answers.addressType === 'static'
               }
            },
            {
               type: 'input',
               name: 'netMask',
               message: 'Insert netmask: ',
               default: Utils.netMasK(),
               when: function (answers: any) {
                  return answers.addressType === 'static'
               }
            },
            {
               type: 'input',
               name: 'gateway',
               message: 'Insert gateway: ',
               default: Utils.netGateway(),
               when: function (answers: any) {
                  return answers.addressType === 'static'
               }
            },
            {
               type: 'input',
               name: 'dns',
               message: 'Insert DNS: ',
               default: Utils.netDns(),
               when: function (answers: any) {
                  return answers.addressType === 'static'
               }
            }
         ]
         inquirer.prompt(questions).then(function (options) {
            resolve(JSON.stringify(options))
         })
      })
   }

   showNet() {
      Utils.titles(`install`)
      console.log(`- ` + chalk.bgGreen.black(`net Interface: `) + chalk.bgGreen.whiteBright(this.net.interface))
      console.log(`- ` + chalk.bgGreen.black(`net address type: `) + chalk.bgGreen.whiteBright(this.net.addressType))
      console.log(`- ` + chalk.bgGreen.black(`net address: `) + chalk.bgGreen.whiteBright(this.net.address))
      console.log(`- ` + chalk.bgGreen.black(`net mask: `) + chalk.bgGreen.whiteBright(this.net.netMask))
      console.log(`- ` + chalk.bgGreen.black(`net gateway: `) + chalk.bgGreen.whiteBright(this.net.gateway))
      console.log()
   }

   /**
    *
    * @param driveList
    * @param partitionTypes
    * @param verbose
    */
   private async getOptionsDisk(driveList: string[], partitionTypes: string[], verbose = false): Promise<any> {
      const echo = Utils.setEcho(verbose)
      if (verbose) {
         Utils.warning('hatching: getOptionsDisk()')
      }

      return new Promise(function (resolve) {
         const questions: Array<Record<string, any>> = [
            {
               type: 'list',
               name: 'installationDevice',
               message: 'Select the installation disk: ',
               choices: driveList
            },
            {
               type: 'list',
               name: 'partionType',
               message: 'Select partition type: ',
               choices: partitionTypes
            },
            {
               type: 'list',
               name: 'fsType',
               message: 'Select format type: ',
               choices: ['ext2', 'ext3', 'ext4'],
               default: 'ext4'
            }
         ]

         inquirer.prompt(questions).then(function (options) {
            resolve(JSON.stringify(options))
         })
      })
   }

   /**
    * 
    */
   showDisk() {
      console.log(`- ` + chalk.bgGreen.black(`installation device: `) + chalk.bgGreen.whiteBright(this.disk.installationDevice))
      console.log(`- ` + chalk.bgGreen.black(`partition type: `) + chalk.bgGreen.whiteBright(this.disk.partionType))
      console.log(`- ` + chalk.bgGreen.black(`fs type: `) + chalk.bgGreen.whiteBright(this.disk.fsType))
   }


   async configAbort(): Promise<boolean> {
      let retval = false
      const result = JSON.parse(await Utils.customConfirmAbort())
      if (result.confirm === 'Yes') {
         retval = true
      } else if (result.confirm === 'Abort') {
         Utils.warning(`You chose to abort the installation`)
         process.exit()
      }
      return retval
   }

   showAll() {
      console.log(`You choose to install the system with the following parameters:`)
      console.log()
      console.log(`- name: ` + chalk.cyanBright(this.users.name))
      console.log(`- fullname: ` + chalk.cyanBright(this.users.fullname))
      console.log(`- user password: ` + chalk.cyanBright(this.users.password))
      console.log(`- root password: ` + chalk.cyanBright(this.users.rootpassword))

      console.log(`- name: ` + chalk.cyanBright(this.host.name))
      console.log(`- domain: ` + chalk.cyanBright(this.host.domain))

      console.log(`- net Interface: ` + chalk.cyanBright(this.net.interface))
      console.log(`- net address type: ` + chalk.cyanBright(this.net.addressType))
      if (this.net.addressType !== 'dhcp') {
         console.log(`- net address: ` + chalk.cyanBright(this.net.address))
         console.log(`- net mask: ` + chalk.cyanBright(this.net.netMask))
         console.log(`- net gateway: ` + chalk.cyanBright(this.net.gateway))
         console.log('- dns: ' + chalk.cyanBright(this.net.dns))
      } else {
         console.log(`- net address: ` + chalk.cyanBright('dhcp (automatic)'))
      }
      console.log(`- installation device: ` + chalk.cyanBright(this.disk.installationDevice))
      console.log(`- partition type: ` + chalk.cyanBright(this.disk.partionType))
      console.log(`- fs type: ` + chalk.cyanBright(this.disk.fsType))
      console.log()
      console.log(chalk.bgRed.white(`This is the last opportunity to abort, the follow operation will destroy the data on the disk`))
      console.log()
   }
}

const ifaces: string[] = fs.readdirSync('/sys/class/net/')
