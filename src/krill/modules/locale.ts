/**
 * penguins-eggs
 * krill modules: locale.ts
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

import Sequence from '../krill-sequence'
import Utils from '../../classes/utils'
import {exec} from '../../lib/utils'

/**
    * locale
   */
export default async function locale(this: Sequence) {
  /**
     * influcence: - /etc/default/locale
     *             - /etc/locale.conf
     *             - /etc/timezone
     */
  const defaultLocale = this.language

  // /etc/default/locale
  let file = this.installTarget + '/etc/default/locale'
  let content = ''
  content += `LANG=${defaultLocale}\n`
  content += `LC_CTYPE=${defaultLocale}\n`
  content += `LC_NUMERIC=${defaultLocale}\n`
  content += `LC_TIME=${defaultLocale}\n`
  content += `LC_COLLATE=${defaultLocale}\n`
  content += `LC_MONETARY=${defaultLocale}\n`
  content += `LC_MESSAGES=${defaultLocale}\n`
  content += `LC_PAPER=${defaultLocale}\n`
  content += `LC_NAME=${defaultLocale}\n`
  content += `LC_ADDRESS=${defaultLocale}\n`
  content += `LC_TELEPHONE=${defaultLocale}\n`
  content += `LC_MEASUREMENT=${defaultLocale}\n`
  content += `LC_IDENTIFICATION=${defaultLocale}\n`
  content += `LC_ALL=${defaultLocale}\n`
  Utils.write(file, content)

  // /etc/locale.conf
  file = this.installTarget + '/etc/locale.conf'
  Utils.write(file, content)

  // timezone
  try {
    await this.timezone()
  } catch (error) {
    await Utils.pressKeyToExit(JSON.stringify(error))
  }
}
