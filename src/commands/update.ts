/**
 * penguins-eggs-v7 based on Debian live
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import { Command, flags } from '@oclif/command'
import shx = require('shelljs')
import Utils from '../classes/utils'
import Tools from '../classes/tools'
import fs = require('fs')
import Pacman from '../classes/pacman'
import https = require('https')
import { RSA_NO_PADDING } from 'constants'
import { title } from 'process'

const exec = require('../lib/utils').exec

/**
 * 
 */
export default class Update extends Command {
   static description = "update/upgrade the penguin's eggs tool.\nThis way of update work only with npm installation, if you used the debian package version, please download the new one and install it."

   static examples = [`$ eggs update\nupdate/upgrade the penguin's eggs tool`]

   static flags = {
      help: flags.help({ char: 'h' }),
      lan: flags.boolean({ char: 'l', description: 'import deb package from LAN' }),
      internet: flags.boolean({ char: 'i', description: 'import deb package from internet' }),
      verbose: flags.boolean({ char: 'v', description: 'verbose' })
   }

   async run() {
      Utils.titles('update')

      const { flags } = this.parse(Update)

      if (Utils.isRoot()) {
         if (await Utils.customConfirm(`Select yes to continue...`)) {
            Utils.warning('Updating eggs...')
            if (Utils.isSources() && !(flags.internet || flags.lan)) {
               Utils.warning('You are using eggs from sources')
               console.log('You can upgrade getting a new version from git:')
               console.log('cd ~/penguins-eggs')
               console.log('git pull')
               console.log('')
               console.log('You can also create a fresh installation on your hone:')
               console.log('cd ~')
               console.log('git clone https://github.com/pieroproietti/penguins-eggs')
               console.log('')
               console.log('Before to use eggs, remember to install npm packages:')
               console.log('cd ~/penguins-eggs')
               console.log('npm install')
            } else if (Utils.isDebPackage() || flags.internet || flags.lan) {
               Utils.warning('You have eggs installed a package .deb')
               console.log('If you have eggs in yours repositories apt:')
               console.log('sudo apt update')
               console.log('sudo apt upgrade eggs')
               console.log('')
               console.log('else')
               console.log('sudo eggs update -i')
               console.log('Download and install automatically new versions of eggs from dev channel.')
               console.log('')
               console.log('else')
               console.log('Sownload manually package from https://sourceforge.net/projects/penguins-eggs/files/packages-deb/')
               console.log('and install it with:')
               console.log('sudo dpkg -i eggs_7.6.x-x_xxxxx.deb')
               if (flags.lan) {
                  this.getFromLan()
               } else if (flags.internet) {
                  this.getFromInternet()
               } else {
                  console.log(`updating ${Utils.getPackageName()} version ${Utils.getPackageVersion()}`)
                  shx.exec(`npm update ${Utils.getPackageName()} -g`)
               }
            }
         }
      }
   }

   /**
    * completely remove eggs
    */
   async remove() {
      if (Utils.isRoot()) {
         console.log('remove and purge eggs')
         await exec('apt-get -y purge eggs > /dev/null')
         await exec('rm /usr/lib/penguins-eggs -rf')
         Utils.warning(`eggs was removed completely.`)
         Utils.warning(`Don't forget to run sudo pt sanitize to clean all the remains of the previus eggs production!`)
      }
   }


   /**
    * download da locale
    */
   async getFromLan() {
      const Tu = new Tools
      await Tu.loadSettings()
      Utils.titles(`Download from LAN, host: ${Tu.export_host} path: ${Tu.export_path_deb}`)
      await exec(`scp ${Tu.export_user_deb}@${Tu.export_host}:${Tu.export_path_deb}${Tu.file_name_deb} .`)
      await this.remove()
      console.log('sudo dpkg -i eggs... to install')
   }

   /**
    * download da sourceforge.net
    */
   async getFromInternet(version = 'eggs_7.6.55-1') {
      Utils.titles(`choose the version`)

      let arch = 'amd64'
      if (process.arch === 'ia32') {
         arch = 'i386'
      }
      const url = `https://penguins-eggs.net/versions/all/${arch}/`
      const axios = require('axios').default

      let res = await axios.get(url)
      let data = res.data

      /**
       * choose the version
       */
      const inquirer = require('inquirer')
      const choices :string [] = ['abort']
      choices.push(new inquirer.Separator('exit without update.'))
      for (let i = 0; i < data.length; i++) {
         choices.push(data[i].version)
         choices.push(new inquirer.Separator(data[i].changelog))
      }
      const questions: Array<Record<string, any>> = [
         {
            type: 'list',
            message: 'select version ',
            name: 'selected',
            choices: choices
         }
      ]
      const answer = await inquirer.prompt(questions)
      if (answer.selected === 'abort') {
         process.exit(0)
      } 
      const deb = 'eggs_' + answer.selected + '-1_amd64.deb'
      let download = 'https://sourceforge.net/projects/penguins-eggs/files/packages-deb/' + deb
      
      /**
       * downloading
       */
      Utils.titles(`downloading ${deb}`)
      if (await Utils.customConfirm(`Want to download ${deb}`)) {
         process.chdir(`/tmp`)
         if (fs.existsSync(deb)) {
            fs.unlinkSync(deb)
         }

         /**
          * Installing
          */
         await exec(`wget ${download}`)
         Utils.titles(`install ${deb}`)
         if (await Utils.customConfirm(`Want to install ${deb}`)) {
            await exec(`dpkg -i ${deb}`)
         }
      }
   }
}
