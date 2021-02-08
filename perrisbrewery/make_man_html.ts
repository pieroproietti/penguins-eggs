/**
 * rifacimento di makemain in ts
 */

import fs = require('fs')
import shx = require('shelljs')
import MakeMd from './make_markdown'

export default function makeManHtml() {

   console.log('Perri\'s Brewery')

   const md = new MakeMd
   const removeTriploApice = false
   md.go(removeTriploApice) // restituisce man/eggs.md


   /**
    * creazione versione html
    */

   console.log(`creazione versione html`)
   shx.mv(`man/eggs.md`, 'man/eggs')
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

   // const home = `/home/artisan/`
   // shx.exec(`sensible-browser "file://${home}penguins-eggs/perrisbrewery/man/eggs.1.html"`)
}
