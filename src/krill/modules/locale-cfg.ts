/**
 * krill: module locale-cfg
 *
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 *
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

import Sequence from '../krill-sequence'
import fs from 'fs'

/* localeCfg
* Enable the configured locales (those set by the user on the
* user page) in /etc/locale.gen, if they are available in the
* target system.
*/
export default async function localeCfg(this: Sequence) {
   /** 
    * influence: - locale-gen
    */
   let supporteds: string[] = []
   if (this.distro.familyId === 'debian') {
      // Format: en_US.UTF-8 UTF-8
      supporteds = fs.readFileSync('/usr/share/i18n/SUPPORTED', 'utf-8').split('\n')
   } else if (this.distro.familyId === 'archlinux') {
      // shx.exec('localectl list-locales > /tmp/SUPPORTED') // with await exec don't work! 
      const supportedsSource = fs.readFileSync('/etc/locale.gen', 'utf-8').split('\n')

      // Original Format: #en_US.UTF-8 UTF-8  
      for (let line of supportedsSource) {
         if (line.substring(0, 2) !== "# ") { // se non è un commento
            line = line.substring(1) // Rimuove #
         }
         supporteds.push(line)
      }
      // Format: en_US.UTF-8 UTF-8  
   }

   const localeGenSource = fs.readFileSync(`${this.installTarget}/etc/locale.gen`, 'utf-8').split('\n')
   let localeGenDest = ''
   const krillBookmark = '#   Locales enabled by krill\n'
   for (let line of localeGenSource) {
      if (line.includes(krillBookmark)) {
         break
      }
      localeGenDest += line + '\n'
   }

   localeGenDest += '\n'
   localeGenDest += krillBookmark

   const locales: string []  = []
   if (this.language !== 'en_US.UTF-8') {
      locales.push('en_US.UTF-8')
   }
   locales.push(this.language)
   for (const supported of supporteds) {
      for (const locale of locales) {
         if (supported.includes(locale)) {
            localeGenDest += `${supported}\n`
         }
      }
   }
   fs.writeFileSync(`${this.installTarget}/etc/locale.gen`, localeGenDest)
}

