/* eslint-disable valid-jsdoc */
/* eslint-disable no-console */
/**
 * perri's brewery
 *
 */
import fs = require('fs')
import shx = require('shelljs')
import mustache = require('mustache')
import path = require('path')
import {IPackage} from '../interfaces'

export default class Dpkg {
  pbPackage = {} as IPackage

  /**
   * Riceve in ingresso un path o un file deb
   * @param debPackage
   */
  analyze(pathSource = '') {
    this.pbPackage.path = path.dirname(pathSource) + '/'
    const debPackage = path.basename(pathSource)

    this.pbPackage.name = debPackage.substring(0, debPackage.indexOf('_'))
    this.pbPackage.sourceVersion = debPackage.substring(debPackage.indexOf('_') + 1, debPackage.indexOf('-'))
    this.pbPackage.buildVersion = debPackage.substring(debPackage.indexOf('-') + 1, debPackage.indexOf('-') + 2)
    this.pbPackage.linuxArch = 'i386'
    if (debPackage.includes('amd64')) {
      this.pbPackage.linuxArch = 'amd64'
    }
    if (debPackage.includes('armel')) {
      this.pbPackage.linuxArch = 'armel'
    }

    // shx.exec('mkdir ./perrisbrewery/workdir')
    this.pbPackage.tempDir = `./perrisbrewery/workdir/${this.pbPackage.name}_${this.pbPackage.sourceVersion}-${this.pbPackage.buildVersion}_${this.pbPackage.linuxArch}`
    if (this.pbPackage.linuxArch === 'i386') {
      this.pbPackage.nodeVersion = 'v8.17.0'
    } else {
      this.pbPackage.nodeVersion = process.version
    }
    this.pbPackage.destDir = this.pbPackage.tempDir // `./perrisbrewery/workdir/${this.pbPackage.name}-${this.pbPackage.sourceVersion}-${this.pbPackage.buildVersion}_${this.pbPackage.linuxArch}`
    return this.pbPackage
  }

  /**
   *
   * @param pathSources
   * @param source
   */
  disclose() {
    if (fs.existsSync(this.pbPackage.tempDir)) {
      shx.exec(`rm ${this.pbPackage.tempDir} -rf`)
    }
    shx.exec(`mkdir ${this.pbPackage.tempDir} `)
    shx.exec(`dpkg-deb -R ${this.pbPackage.path}${this.pbPackage.name}_${this.pbPackage.sourceVersion}-${this.pbPackage.buildVersion}_${this.pbPackage.linuxArch}.deb ${this.pbPackage.tempDir}`)

    // Creo directory destinazione
    // shx.exec(`mkdir ${this.pbPackage.destDir}`)
    // const cmd = `cp -r ${this.pbPackage.tempDir} ${this.pbPackage.destDir}`
    // console.log(cmd)
    // shx.exec(cmd)
    // const curDir = process.cwd()
    // process.chdir(this.pbPackage.destDir)
    // cmd = `dh_make -sc lgpl2 -e piero.proietti@gmail.com --createorig -p ${this.pbPackage.name}-${this.pbPackage.sourceVersion}-${this.pbPackage.buildVersion} --yes`
    // console.log(cmd)
    // shx.exec(cmd)
    // shx.exec('rm changelog')
    // shx.exec('rm compat')
    // shx.exec('rm control')
    // shx.exec('rm copyright')
    // shx.exec('rm debian/*.cron.d.ex')
    // shx.exec('rm debian/*.doc-base.EX')
    // shx.exec('rm debian/*.docs')
    // shx.exec('rm debian/manpage.1.ex')
    // shx.exec('rm debian/manpage.sgml.ex')
    // shx.exec('rm debian/manpage.xml.ex')
    // shx.exec('rm debian/menu.ex')
    // shx.exec('rm debian/postinst.ex')
    // shx.exec('rm debian/postrm.ex')
    // shx.exec('rm debian/preinst.ex')
    // shx.exec('rm debian/prerm.ex')
    // shx.exec('rm debian/README.Debian')
    // shx.exec('rm debian/README.source')
    // shx.exec('rm debian/rules')
    // shx.exec('rm debian/source')
    // shx.exec('rm debian/watch.ex')
    // process.chdir(curDir)
  }

  /**
   * 
   */
  makeScripts() {

    shx.exec(`cp ./perrisbrewery/scripts/* ${this.pbPackage.destDir}/DEBIAN/`)
  }

  /**
   * makeControl
   */
  makeControl() {
    const template = fs.readFileSync('perrisbrewery/template/control.template', 'utf8')
    const view = {
      name: this.pbPackage.name,
      version: this.pbPackage.sourceVersion + '-' + this.pbPackage.buildVersion,
      section: 'main',
      priority: 'standard',
      arch: this.pbPackage.linuxArch,
      mantainer: 'artisan <piero.proietti@gmail.com>',
      description: 'eggs Perri\'s Brewery edition. Remaster your system and distribuite it!',
    }
    // depends, suggest e conflicts vengono gestiti a mano
    fs.writeFileSync(`${this.pbPackage.destDir}/DEBIAN/control`, mustache.render(template, view))
  }

  /**
   *
   */
  close(pbPackage: IPackage) {
    this.pbPackage = pbPackage

    shx.exec(`dpkg-deb --build ${this.pbPackage.destDir}`)
  }
}
