import { O_APPEND } from 'node:constants'
import { IDistro } from '../../../interfaces'
/**
 *
 */
import Pacman from '../../pacman'

/**
 *
 */
export function remove(distro: IDistro): string {
  let text = '  - remove:\n'
  text += removeEggs(distro)
  text += '\n'
  return text
}

/**
 *
 * @param distro
   - try_install:
      - language-pack-$LOCALE
      - hunspell-$LOCALE
      - libreoffice-help-$LOCALE

 */
export function tryInstall(distro: IDistro): string {

  let try_install = '  - try_install:\n'

  let packages = ''
  /**
   * Depending on the distro
   */
  if (distro.distroLike === 'Ubuntu') {
    packages += '    - language-pack-$LOCALE\n'
  }

  // Da localizzare se presenti
  if (Pacman.packageIsInstalled('hunspell')) {
    packages += 'hunspell-$LOCALE\n'
  }

  if (Pacman.packageIsInstalled('libreoffice-base-core')) {
    packages += `    - libreoffice-l10n-$LOCALE\n`
    packages += `    - libreoffice-help-$LOCALE\n`
  }

  if (Pacman.packageIsInstalled('firefox-esr')) {
    packages += `    - firefox-esr-$LOCALE\n`
  }

  if (Pacman.packageIsInstalled('firefox')) {
    packages += `    - firefox-$LOCALE\n`
  }

  if (Pacman.packageIsInstalled('thunderbird')) {
    packages += `    - thunderbird-locale-$LOCALE\n`
  }

  let retVal = ''
  if (packages !== '') {
    retVal += try_install + packages
  }

  return retVal
}

/**
 *
 * @param distro
 */
function removeEggs(distro: IDistro): string {
  const remove = true
  const packages = Pacman.packages(remove)
  let text = ''
  for (const elem of packages) {
    text += `    - ${elem.trim()}\n`
  }
  text += `    - calamares\n`
  return text
}

