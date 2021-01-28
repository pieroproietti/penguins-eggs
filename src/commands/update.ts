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
import Pacman from '../classes/pacman'
import Basket from '../classes/basket'
const exec = require('../lib/utils').exec

/**
 * 
 */
export default class Update extends Command {
   static description = "update the penguin's eggs tool.\nThis method always works, both with npm and deb packages."

   static examples = [`$ eggs update\nupdate/upgrade the penguin's eggs tool`]

   static flags = {
      help: flags.help({ char: 'h' }),
      apt: flags.boolean({ char: 'a', description: 'if eggs package is .deb, update from distro repositories' }),
      basket: flags.boolean({ char: 'b', description: 'if eggs package is .deb, update from eggs basket' }),
      npm: flags.boolean({ char: 'n', description: 'if eggs package is .npm, update from npmjs.com' }),
      verbose: flags.boolean({ char: 'v', description: 'verbose' })
   }

   async run() {
      Utils.titles(this.id + ' ' + this.argv)
      const { flags } = this.parse(Update)
      if (Utils.isRoot()) {
         Utils.titles(this.id + ' ' + this.argv)

         if (Utils.isSources()) {
            Utils.warning(`You are on penguins-eggs v. ${Utils.getPackageVersion()} from sources`)
         } else if (Utils.isDebPackage()) {
            Utils.warning(`You are on eggs-${Utils.getPackageVersion()} installed as package .deb`)
         } else {
            Utils.warning(`You are on penguins-eggs@${Utils.getPackageVersion()} installed as package npm`)
         }

         let apt = false
         let aptVersion = ''
         if (await Pacman.packageAptAvailable('eggs')) {
            apt = true
            aptVersion = await Pacman.packageAptLast('eggs')
            Utils.warning('eggs-' + aptVersion + ' is available via apt')
         } else {
            Utils.warning('eggs is not available your repositories')
         }

         let npmVersion = await Pacman.packageNpmLast('penguins-eggs')
         if (npmVersion !== '') {
            Utils.warning('penguins-eggs@' + npmVersion + ' available via npm')
         }

         let basket = new Basket()
         let basketVersion = await basket.last()
         if (basketVersion !== '') {
            Utils.warning('eggs-' + basketVersion + '-1.deb available in basket')
         }

         /**
          * Se è specificato il metodo di aggiornamento
          * e, questo corrisponde al tipo di pacchetto 
          * installato
          */
         if (flags.npm || flags.apt || flags.basket) {
            if (Utils.isDebPackage() && flags.apt) {
               await this.getDebFromApt()
            } else if (Utils.isDebPackage() && flags.basket) {
               await basket.get()
            } else if (flags.npm) {
               await this.getFromNpm()
            } else {
               await this.chooseUpdate()
            }
         } else {
            await this.chooseUpdate()
         }

      }
   }


   /**
    * Altrimenti, seleziona il tipo di
    * aggiornamento desiderato
    * indipendentemente dal flag
    */
   async chooseUpdate() {
      let basket = new Basket()

      console.log()
      const choose = await this.chosenDeb()
      Utils.titles(`updating via ${choose}`)
      if (choose === 'apt') {
         await this.getDebFromApt()
      } else if (choose === 'basket') {
         await basket.get()
      } else if (choose === 'npm') {
         await this.getFromNpm()
      } else if (choose === 'lan') {
         await this.getDebFromLan()
      } else if (choose === 'manual') {
         this.getDebFromManual()
      } else if (choose === 'sources') {
         this.getFromSources()
      }
   }
   /**
    * 
    */
   async chosenDeb(): Promise<string> {
      const inquirer = require('inquirer')
      const choices: string[] = ['abort']
      choices.push(new inquirer.Separator('exit from update'))
      choices.push('basket')
      choices.push(new inquirer.Separator('select, download and update from basket'))
      choices.push('npm')
      choices.push(new inquirer.Separator('automatic import and update from npmjs.com'))
      choices.push('lan')
      choices.push(new inquirer.Separator('automatic import and update from lan'))
      choices.push('manual')
      choices.push(new inquirer.Separator('manual download from sourceforge.net and update with dpkg'))
      choices.push('sources')
      choices.push(new inquirer.Separator('download sources from github.com'))

      const questions: Array<Record<string, any>> = [
         {
            type: 'list',
            message: 'select update method',
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


   /**
    * getFromNpm
    */
   async getFromNpm() {
      shx.exec(`npm update ${Utils.getPackageName()}@latest -g`)
   }

   /**
    * 
    * @param aptVersion 
    */
   getFromSources() {
      console.log('You can upgrade getting a new version from git:')
      console.log('cd ~/penguins-eggs')
      console.log('git pull')
      console.log('')
      console.log('Or You can also create a fresh installation on your hone:')
      console.log('cd ~')
      console.log('git clone https://github.com/pieroproietti/penguins-eggs')
      console.log('')
      console.log('Before to use eggs, remember to install npm packages:')
      console.log('cd ~/penguins-eggs')
      console.log('npm install')
   }

   /**
    * 
    */
   async getDebFromManual() {
      console.log('Download package from: \n\nhttps://sourceforge.net/projects/penguins-eggs/files/packages-deb/')
      console.log('\nand install it with:')
      const basket = new Basket()
      console.log('\nsudo dpkg -i eggs_' + await basket.last() + '-1.deb')
   }
   /**
    * download da LAN
    */
   async getDebFromLan() {
      const Tu = new Tools
      await Tu.loadSettings()
      Utils.warning(`Copy from: ${Tu.config.remoteHost}:${Tu.config.remotePathDeb}`)
      console.log()
      await exec(`scp ${Tu.config.remoteUser}@${Tu.config.remoteHost}:${Tu.config.remotePathDeb}${Tu.config.filterDeb}/tmp`)
      console.log('sudo dpkg -i /tmp/eggs_*.deb')
   }

   /**
    * 
    */
   async getDebFromApt() {
      if (await Pacman.packageAptAvailable('eggs')) {
         await exec(`apt reinstall eggs`)
      } else {
         console.log(`eggs is not present in your repositories`)
         console.log(`but you can upgrade from internet`)
      }
   }
}
