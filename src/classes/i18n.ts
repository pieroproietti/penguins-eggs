/* eslint-disable valid-jsdoc */
/* eslint-disable no-console */

/**
 * penguins-eggs: ovary.ts VERSIONE DEBIAN-LIVE
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 *
 */

// packages
import fs = require('fs')
import path = require('path')
import os = require('os')
import shx = require('shelljs')
import chalk = require('chalk')

// interfaces
import { IMyAddons } from '../interfaces'

// libraries
const exec = require('../lib/utils').exec

// classes
import Utils from './utils'
import N8 from './n8'
import Xdg from './xdg'
import Pacman from './pacman'
import Settings from './settings'
import { utils } from 'mocha'
import mustache = require('mustache')


/**
 * Ovary:
 */
export default class I18n {
    verbose = false
    settings = {} as Settings

    constructor(verbose: boolean = false) {
        this.verbose = verbose
        this.settings = new Settings()
    }

    /**
     * 
     * @param reinstall 
     */
    generate(reinstall = false) {

        this.settings.load()

        this.verbose = true

        /**
         * apt-get purge locales --yes
         */
        console.log('remove package locales')
        // shx.exec('apt-get purge locales --yes')

        /**
         * /etc/default/locale
         */
        if (this.verbose) {
            console.log('creating /etc/default.locale')
        }
        const src = path.resolve(__dirname, `../../conf/distros/${this.settings.distro.versionId}/locales/locale.template`)
        const dest = '/etc/default/locale'
        const template = fs.readFileSync(src, 'utf8')
        const view = {
            locale: this.settings.locales_default,
        }
        fs.writeFileSync(dest, mustache.render(template, view))


        /**
         * /etc/locale.gen
         */
        if (this.verbose) {
            console.log('creating /etc/locale.gen')

        }
        // shx.cp(path.resolve(__dirname, `../../conf/distros/${this.settings.distro.versionId}/locales/locale.gen.template`), '/etc/locale.gen')
        // let locales = ''
        // for (let i=0; i < this.settings.locales.length; i++){
        //  locales += this.settings.locales[i] + ' UTF-8\n'
        // }
        // shx.sed('-i', '%locales%', locales, '/etc/locale.gen')
        const srcLocales = path.resolve(__dirname, `../../conf/distros/${this.settings.distro.versionId}/locales/locale.gen.template`)
        const destLocales = '/etc/locale.gen'
        const templateLocales = fs.readFileSync(srcLocales, 'utf8')
        const viewLocales = { 'locales': [{}] }
        for (let i = 0; i < this.settings.locales.length; i++) {
            viewLocales.locales.push({ 'locale': this.settings.locales[i] + ' UTF-8'})
        }
        fs.writeFileSync(destLocales, mustache.render(templateLocales, viewLocales))

        if (reinstall) {
            /**
             * apt-get install locales --yes
             */
            console.log('reinstall package locales')
            shx.exec('apt-get reinstall locales --yes')
        } else {
            if (this.verbose) {
                console.log('executing locale-gen')
            }
            shx.exec('/usr/sbin/locale-gen')
        }


        /**
         * che fa bleachbit?
         * 
         * elimina in /usr/share/i18n/locales/./sigla
         * 
         * sotto /usr/share/i18n/locales abbiamo
         * SUPPORTED
         * charmaps
         * locales
         * 
         * Quindi semplicemente, bleachbit rimuove
         * tutte le definizioni in 
         * /usr/share/i18n/locales/ che non corrispondono ai
         * linguaggi selezionati
         * 
         * Elimina 4,1kB /usr/share/i18n/locales/./ta_LK   
         * 
         * In più elimina
         * 
         * limina 4,1kB /usr/share/man/es/man8/validlocale.8.gz
         * Elimina 4,1kB /usr/share/man/es/man8
         * Elimina 4,1kB /usr/share/man/es
         */

    }
}
