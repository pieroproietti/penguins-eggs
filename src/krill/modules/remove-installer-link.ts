/**
 * krill: module removeInstallerLink
 *
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 *
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

import Sequence from '../krill-sequence.js'
import fs from 'fs'

/**
   * removeInstallerLink
   */
export default async function removeInstallerLink(this: Sequence): Promise<void> {
  const file = `${this.installTarget}/usr/bin/penguins-links-add.sh`
  let lines = []
  let content = ''
  if (fs.existsSync(file)) {
    lines = fs.readFileSync(file, {encoding: 'utf8', flag: 'r'}).split('\n')
    for (let i = 0; i < lines.length; i++) {
      if (lines[i]) {
        if (lines[i].search('penguins-krill.desktop') !== -1) {
          lines[i] += '#'
        }

        if (lines[i].search('penguins-clinstaller.desktop') !== -1) {
          lines[i] = '#' + lines[i]
        }

        if (lines[i].search('install-debian.desktop') !== -1) {
          lines[i] = '#' + lines[i]
        }

        content += lines[i] + '\n'
      }
    }
  }

  fs.writeFileSync(file, content)
}
