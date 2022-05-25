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
  let text = '  - try_install:\n'

  /**
   * Depending on the distro
   */
  if (distro.distroLike === 'Ubuntu') {
    text += '    - language-pack-$LOCALE\n'
  }

  // Da localizzare se presenti
  if (Pacman.packageIsInstalled('hunspell')) {
    text += 'hunspell-$LOCALE\n'
  }

  if (Pacman.packageIsInstalled('libreoffice-base-core')) {
    text += `    - libreoffice-l10n-$LOCALE\n`
    text += `    - libreoffice-help-$LOCALE\n`
  }

  if (Pacman.packageIsInstalled('firefox-esr')) {
    text += `    - firefox-esr-$LOCALE\n`
  }

  if (Pacman.packageIsInstalled('firefox')) {
    text += `    - firefox-$LOCALE\n`
  }

  if (Pacman.packageIsInstalled('thunderbird')) {
    text += `    - thunderbird-locale-$LOCALE\n`
  }

  return text
}

/**
 *
 * @param distro
 */
function removeEggs(distro: IDistro): string {
  const remove = true
  const packages = Pacman.packages(remove)
  let text = ''
  for (const i in packages) {
    const deb2check = packages[i].trim()
    text += addIfExist(deb2check)
  }

  text += addIfExist('calamares')

  return text
}

/*
 * @param package2check
 */
function addIfExist(package2check: string): string {
  let text = ''

  if (Pacman.packageIsInstalled(package2check)) {
    text += `    - ${package2check}\n`
  }

  return text
}
