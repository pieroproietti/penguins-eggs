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
      force: flags.boolean({ char: 'f', description: 'force' }),
      verbose: flags.boolean({ char: 'v', description: 'verbose' })
   }

   async run() {
      Utils.titles('update')

      const { flags } = this.parse(Update)

      if (Utils.isRoot()) {
         if (await Utils.customConfirm(`Select yes to continue...`)) {
            Utils.warning('Updating eggs...')
            if (Utils.isSources() && !flags.force) {
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
            } else if (Utils.isDebPackage() || flags.force ) {
               Utils.warning('You have eggs installed as package .deb')
               console.log('You can choose betwheen apt, lan, internet or manual')
               const choose = await this.chosenDeb()
               console.log (choose)
               //process.exit(1)
               if (choose === 'apt') {
                  await this.getDebFromApt()
               } else if (choose === 'lan') {
                  await this.getDebFromLan()
               } else if (choose === 'internet') {
                  await this.getDebFromInternet()
               } else if (choose === 'manual') {
                  this.getDebFromManual()
               }
            } else if (Utils.isDebPackage() && flags.lan) {
               this.getDebFromLan()
            } else if (Utils.isDebPackage() && flags.internet) {
               if (!Pacman.packageIsInstalled('wget')) {
                  Utils.titles(`Update from internet`)
                  console.log('To download eggs from internet, You need to install wget!`nUse: sudo apt install wget')
                  process.exit(1)
               } else {
                  this.getDebFromInternet()
               }
            } else {
               console.log(`updating ${Utils.getPackageName()} version ${Utils.getPackageVersion()}`)
               shx.exec(`npm update ${Utils.getPackageName()} -g`)
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
    * 
    */
   async chosenDeb(): Promise<string> {
      const inquirer = require('inquirer')
      const choices: string[] = ['abort']

      choices.push('apt')
      choices.push(new inquirer.Separator('download from your repositories'))
      choices.push('internet')
      choices.push(new inquirer.Separator('automatic select and download from surceforge'))
      choices.push('lan')
      choices.push(new inquirer.Separator('copy from lan'))
      choices.push('manual')
      choices.push(new inquirer.Separator('manual'))

      const questions: Array<Record<string, any>> = [
         {
            type: 'list',
            message: 'select download source ',
            name: 'selected',
            choices: choices
         }
      ]
      const answer = await inquirer.prompt(questions)
      if (answer.selected === 'abort') {
         process.exit(0)
      }
      return answer.selected
   }

   getDebFromManual() {
      Utils.titles(`update manual`)
      console.log('Download manually package from: \n https://sourceforge.net/projects/penguins-eggs/files/packages-deb/')
      console.log('and install it with:')
      console.log('sudo dpkg -i eggs_7.6.x-x_xxxxx.deb')
   }
   /**
    * download da LAN
    */
   async getDebFromLan() {
      Utils.titles(`update from lan`)
      const Tu = new Tools
      await Tu.loadSettings()
      Utils.titles(`Download from LAN, host: ${Tu.export_host} path: ${Tu.export_path_deb}`)
      await exec(`scp ${Tu.export_user_deb}@${Tu.export_host}:${Tu.export_path_deb}${Tu.file_name_deb} .`)
      await this.remove()
      console.log('sudo dpkg -i eggs... to install')
   }

   /**
    * 
    */
   async getDebFromApt() {
      Utils.titles(`update from apt`)
      await exec(`apt reinstall eggs`)
   }
   /**
    * download da sourceforge.net
    */
   async getDebFromInternet() {
      Utils.titles(`update from internet`)

      let arch = 'amd64'
      console.log(process.arch)
      if (process.arch === 'ia32' || process.arch === 'x32') {
         arch = 'i386'
      }
      const url = `https://penguins-eggs.net/versions/all/${arch}/`
      const axios = require('axios').default

      const res = await axios.get(url)
      const data = res.data

      // Ordino le versioni
      data.sort((a: any, b: any) => (a.version < b.version) ? 1 : ((b.version < a.version) ? -1 : 0))

      const versions = []
      for (let i = 0; i < data.length && i <= 3; i++) {
         versions.push(data[i])
      }

      /**
       * choose the version
       */
      const inquirer = require('inquirer')
      const choices: string[] = ['abort']
      choices.push(new inquirer.Separator('exit without update.'))
      for (let i = 0; i < versions.length; i++) {
         choices.push(versions[i].version)
         choices.push(new inquirer.Separator(versions[i].changelog))
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
      const deb = 'eggs_' + answer.selected + '-1_' + arch + '.deb'
      const download = 'https://sourceforge.net/projects/penguins-eggs/files/packages-deb/' + deb

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
