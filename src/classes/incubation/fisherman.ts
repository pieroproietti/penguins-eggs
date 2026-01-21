/**
 * ./src/classes/incubation/fisherman.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import chalk from 'chalk'
import yaml from 'js-yaml'
import mustache from 'mustache'
import fs from 'node:fs'
import path from 'node:path'

import { IDistro, IInstaller, IRemix } from '../../interfaces/index.js'
import { exec, shx } from '../../lib/utils.js'
import { settings } from './fisherman-helper/settings.js'

// _dirname
const __dirname = path.dirname(new URL(import.meta.url).pathname)

// pjson
import { createRequire } from 'node:module'

import { ICalamaresFinished } from '../../interfaces/calamares/i-calamares-finished.js'
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
    let moduleTemplate = path.resolve(__dirname, this.installer.templateMultiarch, name)
    if (theme !== 'eggs') {
      moduleTemplate = path.join(theme, 'theme/calamares/calamares-modules', name)
    }

    const moduleDest = path.join(this.installer.multiarchModules, name)
    const moduleScript = `/usr/sbin/${name}.sh`

    if (this.verbose) this.show(name, 'module', moduleDest)

    if (!fs.existsSync(moduleDest)) {
      fs.mkdirSync(moduleDest)
    }

    shx.cp(path.join(moduleTemplate, 'module.yaml'), path.join(moduleDest, 'module.desc'))
    if (isScript) {
      shx.cp(path.join(moduleTemplate, `${name}.sh`), moduleScript)
      await exec(`chmod +x ${moduleScript}`)
    }

    return moduleScript
  }

  /**
   *
   * @param name
   */
  async buildCalamaresPy(name: string) {
    const moduleSource = path.resolve(__dirname, this.installer.templateMultiarch, name)
    const moduleDest = path.join(this.installer.multiarchModules, name)

    if (this.verbose) this.show(name, 'python', moduleDest)
    if (!fs.existsSync(moduleDest)) {
      fs.mkdirSync(moduleDest)
    }

    shx.cp(path.join(moduleSource, 'module.yaml'), path.join(moduleDest, 'module.desc'))
    shx.cp(path.join(moduleSource, `${name}.yaml`), path.join(moduleDest, `${name}.conf`))
    shx.cp(path.join(moduleSource, 'main.py'), moduleDest)
    await exec(`chmod +x ${path.join(moduleSource, 'main.py')}`)
  }

  /**
   *
   * @param name
   * @param replaces [['search','replace']]
   */
  async buildModule(name: string, vendor = 'eggs') {
    let moduleSource = path.resolve(__dirname, this.installer.templateModules, `${name}.yaml`)

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
      let customModuleSource = path.resolve(__dirname, `../../../addons/${vendor}/theme/calamares/modules/${name}.yaml`)
      if (vendor.includes('/')) {
        customModuleSource = path.join(vendor, `theme/calamares/modules/${name}.yaml`)
      }

      if (fs.existsSync(customModuleSource)) {
        moduleSource = customModuleSource
      }
    }

    const moduleDest = path.join(this.installer.modules, `${name}.conf`)
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
   * buildModuleDracut
   */
  async buildModuleDracut(initrd: string) {
    const name = 'dracut'

    const moduleSource = path.resolve(__dirname, this.installer.templateModules, `${name}.mustache`)
    const moduleDest = path.join(this.installer.modules, `${name}.conf`)
    const template = fs.readFileSync(moduleSource, 'utf8')
    const view = { initrd }
    fs.writeFileSync(moduleDest, mustache.render(template, view))
  }

  /**
   * buildModuleFinished
   */
  async buildModuleFinished() {
    const name = 'finished'
    await this.buildModule(name)
    const file = path.join(this.installer.modules, `${name}.conf`)
    const fileContent = fs.readFileSync(file, 'utf8')
    const values = yaml.load(fileContent) as ICalamaresFinished
    values.restartNowCommand = 'reboot'
    let destContent = `# ${name}.conf, created by penguins-eggs ${pjson.version}\n`
    destContent += '---\n'
    destContent += yaml.dump(values)
    fs.writeFileSync(file, destContent, 'utf8')
  }

  async buildModuleInitcpio() {
    const { initcpio } = await import('./fisherman-helper/initcpio.js')
    const preset = await initcpio()
    const name = 'initcpio'
    const moduleSource = path.resolve(__dirname, this.installer.templateModules, `${name}.mustache`)
    const moduleDest = path.join(this.installer.modules, `${name}.conf`)
    const template = fs.readFileSync(moduleSource, 'utf8')
    const view = { preset }
    fs.writeFileSync(moduleDest, mustache.render(template, view))
  }

  /**
   * buildModulePackages
   */
  async buildModulePackages(distro: IDistro, release = false) {
    let backend = 'apt'
    switch (distro.familyId) {
      case 'alpine': {
        backend = 'apk'

        break
      }

      case 'archlinux': {
        backend = 'pacman'

        break
      }

      case 'fedora': {
        backend = 'dnf'

        break
      }

      case 'fedora': {
        backend = 'zypper'

        break
      }
      // No default
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
    const moduleSource = path.resolve(__dirname, this.installer.templateModules, `${name}.mustache`)
    const moduleDest = path.join(this.installer.modules, `${name}.conf`)
    const template = fs.readFileSync(moduleSource, 'utf8')
    const view = {
      backend,
      operations
    }
    fs.writeFileSync(moduleDest, mustache.render(template, view))
  }

  /**
   * buildModuleRemoveuser
   */
  async buildModuleRemoveuser(username: string) {
    const name = 'removeuser'
    const moduleSource = path.resolve(__dirname, this.installer.templateModules, `${name}.mustache`)
    const moduleDest = path.join(this.installer.modules, `${name}.conf`)
    const template = fs.readFileSync(moduleSource, 'utf8')
    const view = { username }
    fs.writeFileSync(moduleDest, mustache.render(template, view))
  }

  /**
   * ====================================================================================
   * buildModule...
   * ====================================================================================
   */

  /**
   * buildModuleUnpackfs
   */
  async buildModuleUnpackfs() {
    const name = 'unpackfs'
    const moduleSource = path.resolve(__dirname, this.installer.templateModules, `${name}.mustache`)
    const moduleDest = path.join(this.installer.modules, `${name}.conf`)
    const template = fs.readFileSync(moduleSource, 'utf8')
    const source = path.join(this.distro.liveMediumPath, this.distro.squashfs)
    const view = { source }
    fs.writeFileSync(moduleDest, mustache.render(template, view))
  }

  /**
   *
   * @param name
   */
  async contextualprocess(name: string) {
    const moduleSource = path.resolve(__dirname, this.installer.templateModules, `${name}_context.yaml`)
    const moduleDest = path.join(this.installer.modules, `${name}_context.conf`)
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
  async helper(name: string) {
    const helperSource = path.resolve(__dirname, this.installer.template, 'libexec', `${name}.sh`)
    const helperDest = `/usr/libexec/calamares/${name}.sh`
    if (fs.existsSync(helperSource)) {
      if (this.verbose) this.show(name, 'helper', helperDest)

      let fileContent = fs.readFileSync(helperSource, 'utf8')
      fileContent = fileContent.replaceAll('__LIVE_MEDIUM_PATH__', this.distro.liveMediumPath)
      fs.writeFileSync(helperDest, fileContent, { encoding: 'utf-8', mode: 0o755 })
    } else if (this.verbose) {
      console.log(`calamares: ${name} helper, nothing to do`)
    }
  }

  /**
   *
   * @param name
   */
  async shellprocess(name: string) {
    const moduleSource = path.resolve(__dirname, this.installer.templateModules, `shellprocess@${name}.yaml`)
    const moduleDest = path.join(this.installer.modules, `shellprocess@${name}.conf`)
    if (fs.existsSync(moduleSource)) {
      if (this.verbose) this.show(name, 'shellprocess', moduleDest)

      let fileContent = fs.readFileSync(moduleSource, 'utf8')
      fileContent = fileContent.replaceAll('__LIVE_MEDIUM_PATH__', this.distro.liveMediumPath)
      fs.writeFileSync(moduleDest, fileContent, 'utf-8')
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
      case 'calamares_module': {
        console.log('fisherman: ' + chalk.cyanBright(name) + ' calamares_module in ' + chalk.cyanBright(path))

        break
      }

      case 'contextualprocess': {
        console.log('fisherman: ' + chalk.cyanBright(name) + ' shellprocess in ' + chalk.cyanBright(path))

        break
      }

      case 'module': {
        console.log('fisherman: ' + chalk.yellow(name) + ' module in ' + chalk.yellow(path))

        break
      }

      case 'shellprocess': {
        console.log('fisherman: ' + chalk.green(name) + ' shellprocess in ' + chalk.green(path))

        break
      }
      // No default
    }
  }
}
