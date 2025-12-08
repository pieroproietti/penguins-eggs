/**
 * ./src/classes/incubation/fisherman.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import chalk from 'chalk'
import mustache from 'mustache'
import fs from 'node:fs'
import path from 'node:path'
import {shx} from '../../lib/utils.js'
import yaml from 'js-yaml'

import { IDistro, IInstaller, IRemix } from '../../interfaces/index.js'
import { exec } from '../../lib/utils.js'
import { settings } from './fisherman-helper/settings.js'

// _dirname
const __dirname = path.dirname(new URL(import.meta.url).pathname)


import { ICalamaresFinished } from '../../interfaces/calamares/i-calamares-finished.js'

// pjson
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const pjson = require('../../../package.json')

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

    let moduleDest = this.installer.modules + name + '.conf'
    if (fs.existsSync(moduleSource)) {
      shx.cp(moduleSource, moduleDest)
      if (this.verbose) {
        this.show(name, 'module', moduleDest)
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
    const moduleSource = path.resolve(__dirname, this.installer.templateModules + 'shellprocess@' + name + '.yml')
    const moduleDest = this.installer.modules + 'shellprocess@' + name + '.conf'
    if (fs.existsSync(moduleSource)) {
      if (this.verbose) this.show(name, 'shellprocess', moduleDest)

      let fileContent = fs.readFileSync(moduleSource, 'utf-8')
      fileContent = fileContent.replace(/__LIVE_MEDIUM_PATH__/g, this.distro.liveMediumPath)
      fs.writeFileSync(moduleDest, fileContent, 'utf-8')
      
    } else if (this.verbose) {
      console.log(`calamares: ${name} shellprocess, nothing to do`)
    }
  }

  /**
   *
   * @param name
   */
  async helper(name: string) {
    const helperSource = path.resolve(__dirname, this.installer.template + 'libexec/' + name + '.sh')
    const helperDest = '/usr/libexec/calamares/' + name + '.sh'
    if (fs.existsSync(helperSource)) {
      if (this.verbose) this.show(name, 'helper', helperDest)

      let fileContent = fs.readFileSync(helperSource, 'utf-8')
      fileContent = fileContent.replace(/__LIVE_MEDIUM_PATH__/g, this.distro.liveMediumPath)
      fs.writeFileSync(helperDest, fileContent, { encoding: 'utf-8', mode: 0o755 })
    } else if (this.verbose) {
      console.log(`calamares: ${name} helper, nothing to do`)
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
  * buildModule...
  * ====================================================================================
  */

  /**
   * buildModuleDracut
   */
  async buildModuleDracut(initrd: string) {
    const name = 'dracut'

    let moduleSource = path.resolve(__dirname, this.installer.templateModules + name + '.mustache')
    let moduleDest = this.installer.modules + name + '.conf'
    let template = fs.readFileSync(moduleSource, 'utf8')
    const view = { initrd: initrd }
    fs.writeFileSync(moduleDest, mustache.render(template, view))
  }

  async buildModuleInitcpio() {
    const { initcpio } = await import('./fisherman-helper/initcpio.js');
    const preset = await initcpio()
    const name = 'initcpio'
    let moduleSource = path.resolve(__dirname, this.installer.templateModules + name + '.mustache')
    let moduleDest = this.installer.modules + name + '.conf'
    let template = fs.readFileSync(moduleSource, 'utf8')
    const view = { preset: preset }
    fs.writeFileSync(moduleDest, mustache.render(template, view))
  }

  /**
   * buildModuleFinished
   */
  async buildModuleFinished() {
    const name = 'finished'
    await this.buildModule(name)
    let file = this.installer.modules + name + '.conf'
    let fileContent = fs.readFileSync(file, 'utf8')
    let values = yaml.load(fileContent) as ICalamaresFinished
    values.restartNowCommand = 'reboot'
    let destContent = `# ${name}.conf, created by penguins-eggs ${pjson.version}\n`
    destContent += '---\n'
    destContent += yaml.dump(values)
    fs.writeFileSync(file, destContent, 'utf8')
  }


  /**
   * buildModulePackages
   */
  async buildModulePackages(distro: IDistro, release = false) {
    let backend = 'apt'
    if (distro.familyId === 'alpine') {
      backend = 'apk'
    } else if (distro.familyId === 'archlinux') {
      backend = 'pacman'
    } else if (distro.familyId === 'fedora') {
      backend = 'dnf'
    } else if (distro.familyId === 'fedora') {
      backend = 'zypper'
    }

    const yamlInstall = tryInstall(distro)
    let yamlRemove = ''
    if (release) {
      yamlRemove = removePackages(distro)
    }

    let operations = ''
    if (yamlRemove !== '' || yamlInstall !== '') {
      operations = 'operations:\n' + yamlRemove + yamlInstall
    }

    const name = 'packages'
    let moduleSource = path.resolve(__dirname, this.installer.templateModules + name + '.mustache')
    let moduleDest = this.installer.modules + name + '.conf'
    let template = fs.readFileSync(moduleSource, 'utf8')
    const view = {
      backend: backend,
      operations: operations
    }
    fs.writeFileSync(moduleDest, mustache.render(template, view))

  }

  /**
   * buildModuleRemoveuser
   */
  async buildModuleRemoveuser(username: string) {
    const name = 'removeuser'
    let moduleSource = path.resolve(__dirname, this.installer.templateModules + name + '.mustache')
    let moduleDest = this.installer.modules + name + '.conf'
    let template = fs.readFileSync(moduleSource, 'utf8')
    const view = { username: username }
    fs.writeFileSync(moduleDest, mustache.render(template, view))
  }


  /**
   * buildModuleUnpackfs
   */
  async buildModuleUnpackfs() {
    const name = 'unpackfs'
    let moduleSource = path.resolve(__dirname, this.installer.templateModules + name + '.mustache')
    let moduleDest = this.installer.modules + name + '.conf'
    let template = fs.readFileSync(moduleSource, 'utf8')
    let source = path.join(this.distro.liveMediumPath, this.distro.squashfs)
    const view = { source: source }
    fs.writeFileSync(moduleDest, mustache.render(template, view))
  }

}
