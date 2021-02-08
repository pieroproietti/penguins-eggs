/**
 * rifacimento di makemain in ts
 */

import fs = require('fs')
import shx = require('shelljs')
import mustache from 'mustache'

/**
 * 
 * @param removeTriploApice 
 */
export default function makeMarkdown(version='0.0.1', removeTriploApice = false) {

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
                  // Rimuove ` attorno ai comandi
                  //readme[i] = readme[i].replace('`', '')
                  //readme[i] = readme[i].replace('`', '')
               } else if (removeTriploApice) {
                  readme[i] = readme[i].replace('```', '')
               }
            }
            commands += readme[i] + '\n'
         }
      }
   }

   toc = ''


   let linuxVersion = 'linux-x64'
   if (process.arch === 'ia32') {
      linuxVersion = 'linux-x32'
   } else if (process.arch === 'armel') {
      linuxVersion = 'linux-armel'
   }

   const nodeVersion = 'node-' + process.version

   /**
    * Creazione della versione markdown
    */
   console.log('creazione versione markdown')
   const template = fs.readFileSync('template/man.template.md', 'utf8')
   const view = {
      toc: toc,
      usage: usage,
      commands: commands,
      version: version,
      linuxVersion: linuxVersion,
      nodeVersion: nodeVersion
   }
   fs.writeFileSync(`man/eggs.md`, mustache.render(template, view))
}
