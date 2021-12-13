/**
 * penguins-eggs-v7
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import fs = require('fs')
import os = require('os')
import path = require('path')
import shx = require('shelljs')
import {IRemix} from '../interfaces'
import Pacman from '../classes/pacman'
import Utils from './utils'

import axios  from 'axios'
import  https from 'https'
const agent = new https.Agent({
  rejectUnauthorized: false,
})

import {exec} from '../lib/utils'

const config_file = '/etc/penguins-eggs.d/eggs.yaml' as string
const config_tools = '/etc/penguins-eggs.d/tools.yaml' as string

/**
 * Basket
 */
export default class Basket {
    lastVersion = ''

    constructor() {
      this.lastVersion = ''
    }

    /**
     *
     */
    async last(): Promise<string> {
      if (this.lastVersion === '') {
        const url = 'https://penguins-eggs.net/versions/all/' + Utils.eggsArch() + '/'

        try {
          const res = await axios.get(url, {httpsAgent: agent})

          // const res = await axios.get(url)
          const data = res.data

          // Ordino le versioni
          data.sort((a: any, b: any) => (a.version < b.version) ? 1 : ((b.version < a.version) ? -1 : 0))
          this.lastVersion = data[0].version
        } catch (error) {
          console.log('cannot reach eggs\'s basket')
        }
      }

      return this.lastVersion
    }

    /**
     *
     * @param aptVersion
     */
    async get() {
      if (!Pacman.packageIsInstalled('wget')) {
        Utils.titles('Update from internet')
        console.log('To download eggs from basket, You need to install wget!\nUse: sudo apt install wget')
        process.exit(1)
      }

      const url = 'https://penguins-eggs.net/versions/all/' + Utils.eggsArch() + '/'
      const res = await axios.get(url, {httpsAgent: agent})
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
          choices: choices,
        },
      ]
      const answer = await inquirer.prompt(questions)
      if (answer.selected === 'abort') {
        process.exit(0)
      }

      const deb = 'eggs_' + answer.selected + '-1_' + Utils.eggsArch() + '.deb'
      const download = 'https://sourceforge.net/projects/penguins-eggs/files/packages-deb/' + deb

      /**
         * downloading
         */
      Utils.titles(`downloading ${deb}`)
      if (await Utils.customConfirm(`Want to download ${deb}`)) {
        process.chdir('/tmp')
        if (fs.existsSync(deb)) {
          fs.unlinkSync(deb)
        }

        /**
             * Installing
             */
        await exec(`wget ${download}`)
        Utils.titles(`install ${deb}`)
        if (await Utils.customConfirm(`Want to install ${deb}`)) {
          await exec('apt-get -y purge eggs > /dev/null')
          await exec('rm /usr/lib/penguins-eggs -rf')
          await exec(`dpkg -i ${deb}`)
        }
      }
    }
}
