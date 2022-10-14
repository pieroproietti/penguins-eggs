import { IDistro } from '../../../interfaces'
/**
 * 
 */
import Pacman from '../../pacman'



/**
 * Work only with:
 * - calamares
 * - penguins-eggs
 * 
 * dependencies actually are removed by package managers
 */
export function remove(distro: IDistro): string {
  let removePackages = ["calamares"]
  if (distro.familyId === 'archlinux') {
    removePackages.push("penguins-eggs")
  } if (distro.familyId === 'debian') {
    removePackages.push("eggs")
  }

  let text = '  - remove:\n'
  for (const elem of removePackages) {
    text += `    - ${elem.trim()}\n`
  }
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


  let packages = ''
  /**
   * Depending on the distro
   */
  if (distro.distroLike === 'Ubuntu') {
    packages += '    - language-pack-$LOCALE\n'
  }

  // Da localizzare se presenti
  if (Pacman.packageIsInstalled('hunspell')) {
    packages += '    - hunspell-$LOCALE\n'
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
    retVal += '  - try_install:\n' + packages
  }

  return retVal
}
