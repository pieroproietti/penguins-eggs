/**
 * rifacimento di makemain in ts
 */

import fs = require('fs')
import shx = require('shelljs')
import mustache = require('mustache')
import { isFunction } from 'util'

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
      usage += readme[i] + '\n'
   }
   if (isCommands && !isComment) {
      if (! readme[i].includes('See code')){
         commands += readme[i] + '\n'
      }
   }
}

const template = fs.readFileSync('template/man.template', 'utf8')
const view = {
   toc: '',
   usage: usage,
   commands: commands,
}

fs.writeFileSync(`man/eggs.md`, mustache.render(template, view))

shx.cp('man/eggs.md', 'man/eggs')
shx.exec(`ronn --roff --manual='eggs manual' --organization=penguins-eggs.net  --style=toc,80c      man/eggs --section 1 -o man/`)
shx.exec(`ronn --html --manual='eggs manual' --organization=penguins-eggs.net  --style=toc,dark,man man/eggs --section 1 -o man/`)

shx.rm('man/eggs')
shx.exec('gzip man/eggs.1')
shx.mv('man/eggs.1.gz', 'man/eggs.1')

// modifica man/eggs.1.html 
shx.mv(`man/eggs.1.html`, 'man/source.html')
const sourceHtml = fs.readFileSync(`man/source.html`, { encoding: 'utf8' }).split('\n')
let destHtml = ''
for (let i = 0; i < sourceHtml.length; i++) {
   if(sourceHtml[i].includes('<a href="#-EGGS-')) {
      sourceHtml[i] = sourceHtml[i].toLowerCase()
   }
   destHtml += sourceHtml[i] + '\n'
}
fs.writeFileSync(`man/eggs.1.html`, destHtml)

const home = `/home/artisan/`
shx.exec(`sensible-browser "file://${home}penguins-eggs/perrisbrewery/man/eggs.1.html"`)