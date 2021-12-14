/**
 * penguins-eggs-v7 based on Debian live
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import {Command, flags} from '@oclif/command'
import shx = require('shelljs')
import Utils from '../classes/utils'
import Tools from '../classes/tools'
import Pacman from '../classes/pacman'
import Basket from '../classes/basket'
import {exec} from '../lib/utils'
import inquirer from 'inquirer'

/**
 *
 */
export default class Update extends Command {
   static description = "update the penguin's eggs tool"

   static examples = ["$ eggs update\nupdate/upgrade the penguin's eggs tool"]

   static flags = {
     help: flags.help({char: 'h'}),
     apt: flags.boolean({char: 'a', description: 'if eggs package is .deb, update from distro repositories'}),
     basket: flags.boolean({char: 'b', description: 'if eggs package is .deb, update from eggs basket'}),
     verbose: flags.boolean({char: 'v', description: 'verbose'}),
   }

   async run() {
     Utils.titles(this.id + ' ' + this.argv)
     const {flags} = this.parse(Update)
     if (Utils.isRoot(this.id)) {
       Utils.titles(this.id + ' ' + this.argv)

       if (Utils.isSources()) {
         Utils.warning(`You are on penguins-eggs v. ${Utils.getPackageVersion()} from sources`)
       } else if (Utils.isDebPackage()) {
         Utils.warning(`You are on eggs-${Utils.getPackageVersion()} installed as package .deb`)
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

       const basket = new Basket()
       const basketVersion = await basket.last()
       if (basketVersion !== '') {
         Utils.warning('eggs-' + basketVersion + '-1.deb available in basket')
       }

       /**
          * Se è specificato il metodo di aggiornamento
          * e, questo corrisponde al tipo di pacchetto
          * installato
          */
       if (flags.apt || flags.basket) {
         if (Utils.isDebPackage() && flags.apt) {
           await this.getDebFromApt()
         } else if (Utils.isDebPackage() && flags.basket) {
           await basket.get()
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
     const basket = new Basket()

     console.log()
     const choose = await this.chosenDeb()
     Utils.titles(`updating via ${choose}`)
     switch (choose) {
     case 'apt': {
       await this.getDebFromApt()

       break
     }

     case 'basket': {
       await basket.get()

       break
     }

     case 'lan': {
       await this.getDebFromLan()

       break
     }

     case 'manual': {
       this.getDebFromManual()

       break
     }

     case 'sources': {
       this.getFromSources()

       break
     }
     // No default
     }
   }

   /**
    *
    */
   async chosenDeb(): Promise<string> {
     const choices: string[] = ['abort']
     choices.push(new inquirer.Separator('exit from update'), 'basket')
     choices.push(new inquirer.Separator('select, download and update from basket'), 'lan')
     choices.push(new inquirer.Separator('automatic import and update from lan'), 'manual')
     choices.push(new inquirer.Separator('manual download from sourceforge.net and update with dpkg'), 'sources')
     choices.push(new inquirer.Separator('download sources from github.com'))

     const questions: Array<Record<string, any>> = [
       {
         type: 'list',
         message: 'select update method',
         name: 'selected',
         choices: choices,
       },
     ]
     const answer = await inquirer.prompt(questions)
     if (answer.selected === 'abort') {
       process.exit(0)
     }

     return answer.selected
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
     console.log('Before to use eggs, remember to run ./init to install npm packages:')
     console.log('cd ~/penguins-eggs')
     console.log('./init')
   }

   /**
    *
    */
   async getDebFromManual() {
     console.log('Download package from: \n\nhttps://sourceforge.net/projects/penguins-eggs/files/packages-deb/')
     console.log('\nand install it with:')
     const basket = new Basket()
     console.log('\nsudo dpkg -i eggs_' + (await basket.last()) + '-1.deb')
   }

   /**
    * download da LAN
    */
   async getDebFromLan() {
     const Tu = new Tools()
     await Tu.loadSettings()

     Utils.warning('import from lan')
     const cmd = `scp ${Tu.config.remoteUser}@${Tu.config.remoteHost}:${Tu.config.remotePathDeb}${Tu.config.filterDeb}${Utils.eggsArch()}.deb /tmp`
     await exec(cmd, {echo: true, capture: true})

     if (await Utils.customConfirm(`Want to install ${Tu.config.filterDeb}${Utils.eggsArch()}.deb`)) {
       await exec(`dpkg -i /tmp/${Tu.config.filterDeb}${Utils.eggsArch()}.deb`)
     }
   }

   /**
    *
    */
   async getDebFromApt() {
     if (await Pacman.packageAptAvailable('eggs')) {
       await exec('apt reinstall eggs')
     } else {
       console.log('eggs is not present in your repositories')
       console.log('but you can upgrade from internet')
     }
   }
}
