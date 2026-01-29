/**
 * ./src/krill/modules/remove-installer-link.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

import fs from 'node:fs'

import Sequence from '../sequence.js'

/**
 * removeInstallerLink
 */
export default async function removeInstallerLink(this: Sequence): Promise<void> {
  const file = `${this.installTarget}/usr/bin/penguins-links-add.sh`
  let lines = []
  let content = ''
  if (fs.existsSync(file)) {
    lines = fs.readFileSync(file, { encoding: 'utf8', flag: 'r' }).split('\n')
    for (let i = 0; i < lines.length; i++) {
      if (lines[i]) {
        if (lines[i].search('penguins-krill.desktop') !== -1) {
          lines[i] = '#' + lines[i]
        }

        if (lines[i].search('penguins-clinstaller.desktop') !== -1) {
          lines[i] = '#' + lines[i]
        }

        if (lines[i].search('install-system.desktop') !== -1) {
          lines[i] = '#' + lines[i]
        }

        content += lines[i] + '\n'
      }
    }
  }

  fs.writeFileSync(file, content)
}
