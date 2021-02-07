/**
 * rifacimento di makemain in ts
 */

import fs = require('fs')
import shx = require('shelljs')
import mustache = require('mustache')
// import path = require('path')

console.log('Perri\'s Brewery')

const readme = fs.readFileSync(`../README.md`, { encoding: 'utf8' }).split('\n')

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
   toc: toc,
   usage: usage,
   commands: commands,
}
fs.writeFileSync(`eggs.md`, mustache.render(template, view))

shx.exec(`ronn --roff --html eggs.md  --manual='eggs manual' --organization=penguins-eggs.net  --style=toc,80c --section 1 -o man/man1/`)

// console.log(`INIZIO toc`)
// console.log(toc)
// console.log(`FINE toc`)

// console.log(`INIZIO usage`)
// console.log(usage)
// console.log(`FINE usage`)

// console.log(`INIZIO commands`)
 console.log(commands)
// console.log(`FINE commands`)


