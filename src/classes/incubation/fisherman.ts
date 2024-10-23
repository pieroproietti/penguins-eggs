/**
 * ./src/classes/incubation/fisherman.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import chalk from 'chalk'
import mustache from 'mustache'
import fs from 'node:fs'
import path from 'node:path'
import shx from 'shelljs'
import yaml from 'js-yaml'

import { IDistro, IInstaller, IRemix } from '../../interfaces/index.js'
import { exec } from '../../lib/utils.js'
import { settings } from './fisherman-helper/settings.js'

// _dirname
const __dirname = path.dirname(new URL(import.meta.url).pathname)


import {ICalamaresDisplaymanager} from '../../interfaces/i-calamares-displaymanager.js'
import {ICalamaresFinished} from '../../interfaces/i-calamares-finished.js'
import {ICalamaresPackages, Operation} from '../../interfaces/i-calamares-packages.js'

// pjson
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const pjson = require('../../../package.json')

/**
 * vecchi require che vanno sostituiti con import
 */
import { displaymanager } from './fisherman-helper/displaymanager.js'
import { remove, remove as removePackages, tryInstall } from './fisherman-helper/packages.js'

interface IReplaces {
  replace: string
  search: string
}

export default class Fisherman {
  distro: IDistro

  installer = {} as IInstaller

  verbose = false

  constructor(distro: IDistro, installer: IInstaller, verbose = false) {
    this.distro = distro
    this.installer = installer
    this.verbose = verbose
  }

  /**
   *
   * @param name
   * @param isScript
   */
  async buildCalamaresModule(name: string, isScript = true, theme = 'eggs'): Promise<string> {
    let moduleTemplate = path.resolve(__dirname, this.installer.templateMultiarch + name)
    if (theme !== 'eggs') {
      moduleTemplate = theme + '/theme/calamares/calamares-modules/' + name
    }

    const moduleDest = this.installer.multiarchModules + name
    const moduleScript = `/usr/sbin/${name}.sh`

    if (this.verbose) this.show(name, 'module', moduleDest)

    if (!fs.existsSync(moduleDest)) {
      fs.mkdirSync(moduleDest)
    }

    shx.cp(`${moduleTemplate}/module.yml`, `${moduleDest}/module.desc`)
    if (isScript) {
      shx.cp(`${moduleTemplate}/${name}.sh`, moduleScript)
      await exec(`chmod +x ${moduleScript}`)
    }

    return moduleScript
  }

  /**
   *
   * @param name
   */
  async buildCalamaresPy(name: string) {
    const moduleSource = path.resolve(__dirname, this.installer.templateMultiarch + '/' + name)
    const moduleDest = this.installer.multiarchModules + name

    if (this.verbose) this.show(name, 'python', moduleDest)
    if (!fs.existsSync(moduleDest)) {
      fs.mkdirSync(moduleDest)
    }

    shx.cp(`${moduleSource}/module.yml`, `${moduleDest}/module.desc`)
    shx.cp(`${moduleSource}/${name}.yml`, `${moduleDest}/${name}.conf`)
    shx.cp(`${moduleSource}/main.py`, moduleDest)
    await exec(`chmod +x ${moduleSource}/main.py`)
  }

  /**
   *
   * @param name
   * @param replaces [['search','replace']]
   */
  async buildModule(name: string, vendor = 'eggs') {
    let moduleSource = path.resolve(__dirname, this.installer.templateModules + name + '.yml')

    /**
     * We need vendor here to have possibility to load custom modules for calamares
     * the custom modules live in: /addons/vendor/theme/calamares/modules
     * and - if exist - take priority on distro modules on /conf/distros/calamares/modules
     *
     * example:
     *
     * ./addons/openos/theme/calamares/modules/partition.yml
     * take place of:
     * ./conf/distros/bullseye/calamares/modules/partition.yml
     * and end in:
     * /etc/calamares/modules/partition.conf
     *
     * And we solve the issue of Sebastien who need btrfs
     *
     */
    if (vendor !== 'eggs') {
      let customModuleSource = path.resolve(__dirname, `../../../addons/${vendor}/theme/calamares/modules/${name}.yml`)
      if (vendor.includes('/')) {
        customModuleSource = `${vendor}/theme/calamares/modules/${name}.yml`
      }

      if (fs.existsSync(customModuleSource)) {
        moduleSource = customModuleSource
      }
    }

    const moduleDest = this.installer.modules + name + '.conf'
    if (fs.existsSync(moduleSource)) {
      if (this.verbose) {
        this.show(name, 'module', moduleDest)
      }

      // We need to adapt just mount.conf
      if (name === 'mount') {
        const calamaresVersion = (await exec('calamares --version', { capture: true, echo: false, ignore: false })).data.trim().slice(10, 13)
        let options = '[ bind ]'
        if (calamaresVersion === '3.2') {
          options = 'bind'
        }
        const view = { options }
        const moduleSourceTemplate = fs.readFileSync(moduleSource, 'utf8')
        fs.writeFileSync(moduleDest, mustache.render(moduleSourceTemplate, view))
      } else {
        shx.cp(moduleSource, moduleDest)
      }
    } else if (this.verbose) {
      console.log('unchanged: ' + chalk.greenBright(name))
    }
  }

  /**
   *
   * @param name
   */
  async contextualprocess(name: string) {
    const moduleSource = path.resolve(__dirname, this.installer.templateModules + name + '_context.yml')
    const moduleDest = this.installer.modules + name + '_context.conf'
    if (fs.existsSync(moduleSource)) {
      if (this.verbose) this.show(name, 'contextualprocess', moduleDest)
      shx.cp(moduleSource, moduleDest)
    } else if (this.verbose) {
      console.log(`calamares: ${name} contextualprocess, nothing to do!`)
    }
  }

  /**
   * write settings
   */
  async createCalamaresSettings(theme = 'eggs', isClone = false) {
    await settings(this.installer.template, this.installer.configRoot, theme, isClone)
  }

  /**
   *
   * @param name
   */
  async shellprocess(name: string) {
    const moduleSource = path.resolve(__dirname, this.installer.templateModules + 'shellprocess_' + name + '.yml')
    const moduleDest = this.installer.modules + 'shellprocess_' + name + '.conf'
    if (fs.existsSync(moduleSource)) {
      if (this.verbose) this.show(name, 'shellprocess', moduleDest)
      shx.cp(moduleSource, moduleDest)
    } else if (this.verbose) {
      console.log(`calamares: ${name} shellprocess, nothing to do`)
    }
  }

  /**
   *
   * @param module
   * @param type
   * @param path
   */
  show(name: string, type: string, path: string) {
    switch (type) {
      case 'module': {
        console.log('fisherman: ' + chalk.yellow(name) + ' module in ' + chalk.yellow(path))

        break
      }

      case 'calamares_module': {
        console.log('fisherman: ' + chalk.cyanBright(name) + ' calamares_module in ' + chalk.cyanBright(path))

        break
      }

      case 'shellprocess': {
        console.log('fisherman: ' + chalk.green(name) + ' shellprocess in ' + chalk.green(path))

        break
      }

      case 'contextualprocess': {
        console.log('fisherman: ' + chalk.cyanBright(name) + ' shellprocess in ' + chalk.cyanBright(path))

        break
      }
      // No default
    }
  }

    /**
   * ====================================================================================
   * M O D U L E S
   * ====================================================================================
   */

  /**
   * Al momento rimane con la vecchia configurazione
   */
  async moduleDisplaymanager() {
    const name = 'displaymanager'
    // const displaymanager = require('./fisherman-helper/displaymanager').displaymanager
    this.buildModule(name)
    let file = `/etc/calamares/modules/${name}.conf`
    let fileContent = fs.readFileSync(file, 'utf8')
    let yamlValues = yaml.load(fileContent) as ICalamaresDisplaymanager
    yamlValues.displaymanagers = displaymanager()
    let destContent = `# ${name}.conf, created by penguins-eggs ${pjson.version}\n`
    destContent += '---\n'
    destContent += yaml.dump(yamlValues)
    fs.writeFileSync(file, destContent, 'utf8')
  }

  /**
   * Al momento rimane con la vecchia configurazione
   */
  async moduleFinished() {
    const name = 'finished'
    await this.buildModule(name)
    let file = `/etc/calamares/modules/${name}.conf`
    let fileContent = fs.readFileSync(file, 'utf8')
    let yamlValues = yaml.load(fileContent) as ICalamaresFinished
    yamlValues.restartNowCommand = 'reboot'
    let destContent = `# ${name}.conf, created by penguins-eggs ${pjson.version}\n`
    destContent += '---\n'
    destContent += yaml.dump(yamlValues)
  }


  /**
   * Al momento rimane con la vecchia configurazione
   */
  async modulePackages(distro: IDistro, release = false) {

    const name = 'packages'
    // const removePackages = require('./fisherman-helper/packages').remove
    // const tryInstall = require('./fisherman-helper/packages').tryInstall
    this.buildModule(name)

    const yamlInstall = tryInstall(distro)

    let yamlRemove = ''
    if (release) {
      yamlRemove = removePackages(distro)
    }

    let operations = ''
    if (yamlRemove !== '' || yamlInstall !== '') {
      operations = 'operations:\n' + yamlRemove + yamlInstall
    }

    shx.sed('-i', '{{operations}}', operations, this.installer.modules + name + '.conf')
  }
  
  /*
    const name = 'packages'
    this.buildModule(name)
    let file = `/etc/calamares/modules/${name}.conf`
    let fileContent = fs.readFileSync(file, 'utf8')
    let values = yaml.load(fileContent) as ICalamaresPackages
    console.log(values)
    let destContent = `# ${name}.conf, created by penguins-eggs ${pjson.version}\n`
    destContent += '---\n'
    destContent += yaml.dump(values)

    // const removePackages = require('./fisherman-helper/packages').remove
    // const tryInstall = require('./fisherman-helper/packages').tryInstall
    

    const yamlInstall = tryInstall(distro)

    let yamlRemove = ''
    if (release) {
      yamlRemove = removePackages(distro)
    }

    let operations = ''
    if (yamlRemove !== '' || yamlInstall !== '') {
      operations = 'operations:\n' + yamlRemove + yamlInstall
    }

    shx.sed('-i', '{{operations}}', operations, this.installer.modules + name + '.conf')
  }
  */

  /**
   * Al momento rimane con la vecchia configurazione
   */
  async moduleRemoveuser(username: string) {
    const name = 'removeuser'
    this.buildModule(name)
    shx.sed('-i', '{{username}}', username, this.installer.modules + name + '.conf')
  }

  /**
   * Al momento rimane con la vecchia configurazione
   */
  async moduleUnpackfs() {
    const name = 'unpackfs'
    this.buildModule(name)
    shx.sed('-i', '{{source}}', this.distro.liveMediumPath + this.distro.squashfs, this.installer.modules + name + '.conf')
  }
}
