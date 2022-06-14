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
  let remove = true
  let removePackages = Pacman.packages(remove)

  if (distro.distroLike === 'Arch') {
    removePackages = ["calamares"]
    removePackages = ["penguins-eggs"]
  } else {
    removePackages.push("calamares")
    removePackages.push("eggs")
  }

  const mustRemain = ["coreutils", "cryptsetup",  "curl", "dosfstools", "git","parted",  "rsync", "lvm2"]

  let sorted= []
  for (const elem of removePackages) {
    if (!mustRemain.includes(elem)) {
      sorted.push(elem)
    }
  }
  sorted = sorted.sort()

  let text = '  - remove:\n'
  for (const elem of sorted) {
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

