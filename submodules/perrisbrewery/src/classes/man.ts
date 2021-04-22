/* eslint-disable node/no-extraneous-require */
/* eslint-disable max-depth */
/* eslint-disable complexity */
/* eslint-disable no-console */
/**
 * man
 */

import fs = require('fs')
import mustache = require('mustache')
import yaml = require('js-yaml')
import shx = require('shelljs')
import {IPackage} from '../interfaces'

/**
 *
 * @param removeTriploApice
 */
// eslint-disable-next-line complexity
export default class Man {
  readmeName = ''

  constructor(readmeName = './README.md') {
    this.readmeName = readmeName
  }

  createMd() {
    if (fs.existsSync('pb.yaml')) {
      let pbPackage = {} as IPackage
      pbPackage = yaml.load(fs.readFileSync('pb.yaml', 'utf-8')) as IPackage

      const readme = fs.readFileSync(this.readmeName, 'utf-8').split('\n')

      let toc = ''
      const tocStart = '<!-- toc -->'
      let isToc = false
      const tocStop = '<!-- tocstop -->'

      let usage = ''
      const usageStart = '<!-- usage -->'
      let isUsage = false
      const usageStop = '<!-- usagestop -->'

      let commands = ''
      const commandsStart = '<!-- commands -->'
      let isCommands = false
      const commandsStop = '<!-- commandsstop -->'
      for (let i = 0; i < readme.length; i++) {
        let isComment = false
        if (readme[i].includes('<!--')) {
          isComment = false

          if (readme[i].includes(tocStart)) {
            isToc = true
          }
          if (readme[i].includes(tocStop)) {
            isToc = false
          }

          if (readme[i].includes(usageStart)) {
            isUsage = true
          }
          if (readme[i].includes(usageStop)) {
            isUsage = false
          }

          if (readme[i].includes(commandsStart)) {
            isCommands = true
          }
          if (readme[i].includes(commandsStop)) {
            isCommands = false
          }
        }

        // Aggiunge la linea alla sezione
        if (isToc && !isComment) {
          toc += readme[i] + '\n'
        }
        if (isUsage && !isComment) {
          usage += readme[i] + '\n'
        }
        if (isCommands && !isComment) {
          if (!readme[i].includes('See code:')) {
            commands += readme[i] + '\n'
          }
        }
      }
      toc = ''
      usage = usage.toString()

      /**
        * Creazione della versione markdown di man
        */
      const tempMd = pbPackage.destDir + '/DEBIAN/' + pbPackage.name + '.md'
      const template = fs.readFileSync('perrisbrewery/template/man.template.md', 'utf8')
      let linuxVersion = 'linux-x32'
      if (pbPackage.linuxArch==='amd64') {
        linuxVersion = 'linux-x64'
      } if (pbPackage.linuxArch==='armel') {
        linuxVersion = 'linux-arm'
      }
      const view = {
        toc: toc,
        usage: usage,
        commands: commands,
        sourceVersion: pbPackage.sourceVersion,
        linuxVersion: linuxVersion,
        nodeVersion: pbPackage.nodeVersion,
      }

      fs.writeFileSync(tempMd, mustache.render(template, view), 'utf8')
    }
  }

  convertToMan() {
    if (fs.existsSync('pb.yaml')) {
      let pbPackage = {} as IPackage
      pbPackage = yaml.load(fs.readFileSync('pb.yaml', 'utf8')) as IPackage

      const destMd = pbPackage.destDir + '/DEBIAN/' + pbPackage.name + '.md'
      const destMan = pbPackage.destDir + '/DEBIAN/' + pbPackage.name + '.1'

      const vfile = require('to-vfile')

      const unified = require('unified')

      const markdown = require('remark-parse')

      const gfm = require('remark-gfm')

      const man = require('remark-man')

      const optMan = {
        name: 'eggs',
        section: '1',
        description: 'eggs manpage',
        version: pbPackage.version,
      }

      unified()
      .use(markdown)
      .use(gfm)
      .use(man, optMan)
      .process(vfile.readSync(destMd), function (err: any, file: any) {
        if (err) throw err
        file.extname = '.1'
        vfile.writeSync(file)
      })
      // Compressione
      shx.exec('gzip -9 ' + destMan)
      // per il formato che uso adesso
      shx.exec('cp ' + destMan + '.gz ' + pbPackage.destDir + '/usr/lib/penguins-eggs/manpages/doc/man/')
      // copia nel sorgente per i pacchetti npm
      shx.exec('cp ' + destMan + '.gz ' + './manpages/doc/man/')
      // copia in DEBIAN al momento non funziona
      // shx.exec(`mkdir ${pbPackage.tempDir}/DEBIAN/manpages/doc/man -p`)
      // shx.exec('cp ' + destMan + '.gz ' +  pbPackage.destDir + '/DEBIAN/manpages/doc/man')
    }
  }
}

