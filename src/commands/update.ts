/**
 * penguins-eggs
 * command: update.ts
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import {Command, Flags} from '@oclif/core'
import shx from 'shelljs'
import Utils from '../classes/utils'
import Tools from '../classes/tools'
import Pacman from '../classes/pacman'
import {exec} from '../lib/utils'
const inquirer = require('inquirer') 


/**
 *
 */
export default class Update extends Command {
  static flags = {
    help: Flags.help({char: 'h'}),
    verbose: Flags.boolean({char: 'v', description: 'verbose'}),
  }

  static description = "update the Penguins' eggs tool"
  static examples = [
    'eggs update',
  ]

  async run(): Promise<void> {
    Utils.titles(this.id + ' ' + this.argv)
    const {flags} = await this.parse(Update)
    Utils.titles(this.id + ' ' + this.argv)

    if (Utils.isRoot()) {
      if (Utils.isSources()) {
        Utils.warning(`You are on penguins-eggs v. ${Utils.getPackageVersion()} from sources`)
      } else if (Utils.isDebPackage()) {
        Utils.warning(`You are on eggs-${Utils.getPackageVersion()} installed as package .deb`)
      }

      await this.chooseUpdate()
    } else {
      Utils.useRoot(this.id)
    }
  }

  /**
   * Altrimenti, seleziona il tipo di
   * aggiornamento desiderato
   * indipendentemente dal flag
   */
  async chooseUpdate() {
    console.log()
    const choose = await this.chosenDeb()
    Utils.titles(`updating via ${choose}`)
    switch (choose) {
    case 'apt': {
      await this.getDebFromApt()

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
    choices.push('apt', 'lan', 'manual', 'sources')

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
    console.log('Before to use eggs from sources, remember to install npm packages:')
    console.log('cd ~/penguins-eggs')
    console.log('npm install')
  }

  /**
   *
   */
  async getDebFromManual() {
    console.log('Download package from: \n\nhttps://sourceforge.net/projects/penguins-eggs/files/packages-deb/')
    console.log('\nand install it with:')
    console.log('\nsudo dpkg -i eggs_x.x.x-1.deb')
  }

  /**
   * download da LAN
   */
  async getDebFromLan() {
    const Tu = new Tools()
    await Tu.loadSettings()

    Utils.warning('import from lan')
    const cmd = `scp ${Tu.config.remoteUser}@${Tu.config.remoteHost}:${Tu.config.remotePathDeb}${Tu.config.filterDeb}${Utils.machineArch()}.deb /tmp`
    await exec(cmd, {echo: true, capture: true})

    if (await Utils.customConfirm(`Want to install ${Tu.config.filterDeb}${Utils.machineArch()}.deb`)) {
      await exec(`dpkg -i /tmp/${Tu.config.filterDeb}${Utils.machineArch()}.deb`)
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
