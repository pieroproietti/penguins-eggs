/**
 * rifacimento di makemain in ts
 */

import fs = require('fs')
import shx = require('shelljs')
import mustache = require('mustache')

console.log('Perri\'s Brewery')

const readme = fs.readFileSync(`../README.md`, { encoding: 'utf8' }).split('\n')

shx.exec(`rm man -rf`)
shx.exec(`mkdir man`)

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
      isComment = true

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

   // Aggiunge le linee
   if (isToc && !isComment) {
      toc += readme[i] + '\n'
   }
   if (isUsage && !isComment) {
      if (readme[i].includes('`')) {
         if (!readme[i].includes('```')) {
            readme[i] = readme[i].replace('`', '')
            readme[i] = readme[i].replace('`', '')
         }
      }
      usage += readme[i] + '\n'
   }
   if (isCommands && !isComment) {
      if (!readme[i].includes('See code')) {
         if (readme[i].includes('`')) {
            if (!readme[i].includes('```')) {
               readme[i] = readme[i].replace('`', '')
               readme[i] = readme[i].replace('`', '')
            }
         }
         commands += readme[i] + '\n'
      }
   }
}

/**
 * Creazione della versione markdown
 */
console.log('creazione versione markdown')
const template = fs.readFileSync('template/man.template.md', 'utf8')
const view = {
   toc: '',
   usage: usage,
   commands: commands,
}
fs.writeFileSync(`man/eggs.md`, mustache.render(template, view))
shx.cp('man/eggs.md', 'man/eggs')


/**
 *  Postproduzione versione md
 * 
 * mustache inserisce &#x60;&#x60;&#x60; al posto di ```
 */
shx.mv(`man/eggs.md`, 'man/md-1.md')
const sourceMd = fs.readFileSync(`man/md-1.md`, { encoding: 'utf8' }).split('\n')
let destMd = ''
for (let i = 0; i < sourceMd.length; i++) {
   if (sourceMd[i].includes('&#x60;&#x60;&#x60;')) {
      console.log('trovato!')
      sourceMd[i] = sourceMd[i].replace('&#x60;&#x60;&#x60;', '```')
   }
   destMd += sourceMd[i] + '\n'
}
fs.writeFileSync(`man/eggs.md`, destMd)


/**
 * Creazione versione man
 */
console.log(`creazione versione man`)
shx.exec(`ronn --roff --manual='eggs manual' --organization=penguins-eggs.net  --style=toc,80c man/eggs --section 1 -o man/`)

console.log(`compressione versione man`)
shx.exec('gzip man/eggs.1')
shx.mv('man/eggs.1.gz', 'man/eggs.1')

/**
 * creazione versione html
 */
console.log(`creazione versione html`)
shx.exec(`ronn --html --manual='eggs manual' --organization=penguins-eggs.net  --style=toc,man  man/eggs --section 1 -o man`)

// postproduzione html 1
console.log(`postproduzione html 1`)
shx.mv(`man/eggs.1.html`, 'man/html-1.html')
let sourceHtml = fs.readFileSync(`man/html-1.html`, { encoding: 'utf8' }).split('\n')
let destHtml = ''
for (let i = 0; i < sourceHtml.length; i++) {
   if (sourceHtml[i].includes('<a href="#EGGS-')) {
      sourceHtml[i] = sourceHtml[i].toLowerCase()
      if (sourceHtml[i].indexOf('[')) {
         sourceHtml[i] = sourceHtml[i].replace('command', 'COMMAND')
         sourceHtml[i] = sourceHtml[i].replace('command', 'COMMAND')
         sourceHtml[i] = sourceHtml[i].replace('shell', 'SHELL')
         sourceHtml[i] = sourceHtml[i].replace('shell', 'SHELL')
      }
   }
   destHtml += sourceHtml[i] + '\n'
}
fs.writeFileSync(`man/html-2.html`, destHtml)


// postproduzione html 2
console.log(`postproduzione html 2`)
sourceHtml = fs.readFileSync(`man/html-2.html`, { encoding: 'utf8' }).split('\n')
destHtml = ''
for (let i = 0; i < sourceHtml.length; i++) {
   if (sourceHtml[i].includes('<p>```')) {
      sourceHtml[i] = sourceHtml[i].replace('<p>```', '<pre>')
   }
   if (sourceHtml[i].includes('```</p>')) {
      sourceHtml[i] = sourceHtml[i].replace('```</p>', '`</pre>')
   }
   destHtml += sourceHtml[i] + '\n'
}
fs.writeFileSync(`man/eggs.1.html`, destHtml)


/**
 * pulizia
 */
shx.rm('man/eggs')
shx.rm('man/html-1.html')
shx.rm('man/html-2.html')

const home = `/home/artisan/`
shx.exec(`sensible-browser "file://${home}penguins-eggs/perrisbrewery/man/eggs.1.html"`)