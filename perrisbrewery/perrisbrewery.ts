/**
 * perri's brewery
 * 
 */

import fs = require('fs')
import shx = require('shelljs')
import mustache = require('mustache')
import path = require ('path')

console.log('Perri\'s Brewery')
const sourcesDir = process.argv[2]

console.log(`sourcesDir: ${sourcesDir}`)

const pathSources=path.dirname(sourcesDir)
console.log(`pathSources: ${pathSources}`)


const filenames = fs.readdirSync(pathSources)
filenames.forEach(file => {
    if (file.endsWith('.deb')){
        console.log(pathSources+'/'+file)
        convert(pathSources, file)
    }
})

/**
 * 
 * @param source 
 */
function convert(pathSources='', source = '') {
    const name = 'eggs'

    console.log(`source: ${source}`)
    const sourceVersion = source.substring(source.indexOf('eggs_')+5, source.indexOf('eggs_') + 11)
    console.log(`sourceVersion: ${sourceVersion}`)

    const mantainerOldVersion = source.substring(source.indexOf('eggs_')+12, source.indexOf('eggs_') + 13)
    let mantainerVersion = +mantainerOldVersion +1
    console.log(`mantainerVersion: ${mantainerVersion}`)

    const version = sourceVersion + "-" + mantainerVersion
    console.log(`version: ${version}`)

    let arch = source.substring(source.indexOf(version) + 9, version.length +11)
    if ((arch !== 'amd64') && (arch !== 'armel')) {
        arch = 'i386'
    }
    console.log(`arch: ${arch}`)

    const tempDir = `eggs_${version}_${arch}`
    console.log(`tempDir: ${tempDir}`)

    const dest = `${name}_${version}_${arch}.deb`
    console.log(`dest: ${dest}`)

    if (fs.existsSync(tempDir)) {
        shx.exec(`rm ${tempDir} -rf`)
    }
    shx.exec(`mkdir ${tempDir}`)
    shx.exec(`dpkg-deb -R ${pathSources}/${source} ${tempDir}`)
    shx.exec(`cd ${tempDir}`)
    shx.exec(`dh_make -sc lgpl2 -e piero.proietti@gmail.com --createorig`)
    shx.exec(`cd ..`)
    shx.exec(`cp ./scripts/* ${tempDir}/DEBIAN`)


    const template = fs.readFileSync('template/control.template', 'utf8')
    const view = {
        version: version,
        arch: arch,
    }
    fs.writeFileSync(`${tempDir}/DEBIAN/control`, mustache.render(template, view))

    shx.exec(`dpkg-deb --build ${tempDir}`)


    // shx.exec(`mv ${name}-${version}.deb ${dest}`)
    shx.exec(`rm ${tempDir} -rf`)
}

