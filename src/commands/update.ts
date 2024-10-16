/**
 * ./src/commands/syncfrom.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import { Command, Flags } from '@oclif/core'
import inquirer from 'inquirer'
import shx from 'shelljs'
import Distro from '../classes/distro.js'

import Pacman from '../classes/pacman.js'
import Tools from '../classes/tools.js'
import Utils from '../classes/utils.js'
import { exec } from '../lib/utils.js'

/**
 *
 */
export default class Update extends Command {
  static description = "update the Penguins' eggs tool"

  static examples = ['eggs update']

  static flags = {
    help: Flags.help({ char: 'h' }),
    verbose: Flags.boolean({ char: 'v', description: 'verbose' })
  }

  distro = new Distro()

  async chooseUpdate() {
    console.log()
    const choose = await this.choosePkg()
    Utils.titles(`updating via ${choose}`)
    switch (choose) {
      case 'apt': {
        await this.getPkgFromRepo()

        break
      }

      case 'lan': {
        await this.getPkgFromLan()

        break
      }

      case 'manual': {
        this.getPkgManually()

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
  async choosePkg(): Promise<string> {
    const choices: string[] = ['abort']
    choices.push('apt', 'lan', 'manual', 'sources')

    const questions: Array<Record<string, any>> = [
      {
        choices,
        message: 'select update method',
        name: 'selected',
        type: 'list'
      }
    ]
    const answer = await inquirer.prompt(questions)
    if (answer.selected === 'abort') {
      process.exit(0)
    }

    return answer.selected
  }

  /**
   *
   */
  async getPkgFromRepo() {
    if (this.distro.familyId === "debian") {
      if (await Pacman.packageAvailable('eggs')) {
        await exec('apt reinstall eggs')
      } else {
        console.log('eggs is not present in your repositories')
        console.log('but you can upgrade from internet')
      }
    }
  }

  /**
   * download da LAN
   */
  async getPkgFromLan() {
    const Tu = new Tools()
    await Tu.loadSettings()

    Utils.warning('import from lan')

    if (this.distro.familyId === "debian") {
      const filterDeb = `penguins-eggs_10.?.*-?_${Utils.uefiArch()}.deb`
      const cmd = `scp ${Tu.config.remoteUser}@${Tu.config.remoteHost}:${Tu.config.remotePathPackages}/debs/${filterDeb} /tmp`
      await exec(cmd, { capture: true, echo: true })

      if (await Utils.customConfirm(`Want to install ${filterDeb}`)) {
        await exec(`dpkg -i /tmp/${filterDeb}`)
      }

    } else if (this.distro.familyId === 'archlinux') {
      let repo = "aur"
      if (this.distro.distroId === "ManjaroLinux" || this.distro.distroId === "BigLinux") {
        const repo = 'manjaro'
      }
      const filterAur = `penguins-eggs-10.?.*-?-any.pkg.tar.zst`
      const cmd = `scp ${Tu.config.remoteUser}@${Tu.config.remoteHost}:${Tu.config.remotePathPackages}/${repo}/${filterAur} /tmp`
      await exec(cmd, { capture: true, echo: true })
      if (await Utils.customConfirm(`Want to install ${filterAur}`)) {
        await exec(`pacman -U /tmp/${filterAur}`)
      }
    }
  }

  /**
   *
   */
  async getPkgManually() {
    console.log('Download package from: \n\nhttps://sourceforge.net/projects/penguins-eggs/files/Packages/')
    console.log('\nand install it with:')
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

  async run(): Promise<void> {
    Utils.titles(this.id + ' ' + this.argv)
    const { flags } = await this.parse(Update)
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
}
