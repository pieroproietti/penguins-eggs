/**
 * ./src/krill/modules/locale-cfg.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

import fs from 'node:fs'

import { shx } from '../../../lib/utils.js'
import Sequence from '../sequence.js'

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
    supporteds = fs.readFileSync('/usr/share/i18n/SUPPORTED', 'utf8').split('\n')
  } else if (this.distro.familyId === 'archlinux') {
    const supportedsSource = fs.readFileSync('/etc/locale.gen', 'utf8').split('\n')
    for (let line of supportedsSource) {
      if (line.slice(0, 2) !== '# ') {
        // se non è un commento
        line = line.slice(1) // Rimuove #
      }

      supporteds.push(line)
    }
  }

  const localeGenSource = fs.readFileSync(`${this.installTarget}/etc/locale.gen`, 'utf8').split('\n')
  let localeGenDest = ''
  const krillBookmark = '#   Locales enabled by krill\n'
  for (const line of localeGenSource) {
    if (line.includes(krillBookmark)) {
      break
    }

    localeGenDest += line + '\n'
  }

  localeGenDest += '\n'
  localeGenDest += krillBookmark

  const locales: string[] = []
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
