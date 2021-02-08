/**
 * perri's brewery
 * 
 */

import fs = require('fs')
import shx = require('shelljs')
import mustache = require('mustache')
import path = require('path')


import makeMarkdown from './make_markdown'
import makeMan from './make_man'
import makeManHtml from './make_man_html'


/**
 * 
 */
export default class Perrisbrewery {
    sourceVersion = ''
    buildVersion = ''
    linuxArch = ''
    nodeVersion = ''
    buildDir = ''
    htmlDir = ''


    go(sourcesDir = '') {
        console.log('Perri\'s Brewery')

        console.log(`sourcesDir: ${sourcesDir} `)

        const pathSources = path.dirname(sourcesDir)
        console.log(`pathSources: ${pathSources} `)

        const filenames = fs.readdirSync(pathSources)
        filenames.forEach(file => {
            if (file.endsWith('.deb')) {
                console.log(pathSources + '/' + file)
                this.unpackDeb(pathSources, file)

                this.makeControl()

                const removeTriploApice = true
                makeMarkdown(this.sourceVersion+'-'+this.buildVersion,removeTriploApice)
                makeMan(this.buildDir)
                makeManHtml()

                this.packDeb()
            }
        })
    }

    /**
     * 
     * @param pathSources 
     * @param source 
     */
    unpackDeb(pathSources = '', source = '') {
        const name = 'eggs'

        console.log(`source: ${source} `)
        this.sourceVersion = source.substring(source.indexOf('eggs_') + 5, source.indexOf('eggs_') + 11)
        console.log(`sourceVersion: ${this.sourceVersion} `)

        this.buildVersion = source.substring(source.indexOf('eggs_') + 12, source.indexOf('eggs_') + 13)
        console.log(`mantainerVersion: ${this.buildVersion} `)

        const version = this.sourceVersion + "-" + this.buildVersion
        console.log(`version: ${version} `)

        this.linuxArch = "i386"
        if (source.includes('amd64')) {
            this.linuxArch = "amd64"
        }

        if (source.includes('armel')) {
            this.linuxArch = "armel"
        }
        console.log(`arch: ${this.linuxArch} `)

        this.buildDir = `eggs_${version}_${this.linuxArch}`
        console.log(`buildDir: ${this.buildDir}`)

        const dest = `${name}_${version}_${this.linuxArch}.deb`
        console.log(`dest: ${dest} `)

        if (fs.existsSync(this.buildDir)) {
            shx.exec(`rm ${this.buildDir} -rf`)
        }
        shx.exec(`mkdir ${this.buildDir} `)
        shx.exec(`dpkg-deb -R ${pathSources}/${source} ${this.buildDir}`)
        shx.exec(`cd ${this.buildDir}`)
        shx.exec(`dh_make -sc lgpl2 -e piero.proietti@gmail.com --createorig`)
        shx.exec(`cd ..`)
        shx.exec(`cp ./scripts/* ${this.buildDir}/DEBIAN`)


        this.nodeVersion = process.version


        return
    }


    /**
     * makeControl
     */
    makeControl(){
        const template = fs.readFileSync('template/control.template', 'utf8')
        const view = {
            version: version,
            arch: this.linuxArch,
        }
        fs.writeFileSync(`${this.buildDir}/DEBIAN/control`, mustache.render(template, view))
    }
    /**
     * 
     */
    packDeb() {
        shx.exec(`dpkg-deb --build ${this.buildDir}`)
        shx.exec(`rm ${this.buildDir} -rf`)
    }
}