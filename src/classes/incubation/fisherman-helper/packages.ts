import {O_APPEND} from 'node:constants'
import {IDistro} from '../../../interfaces'
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
  // Per i linguaggi trovare BCP47 libreria...

  const processLang = process.env.LANG

  let lang = 'en_gb'

  switch (processLang) {
  case 'it_IT.UTF-8': {
    lang = 'it'

    break
  }

  case 'en_US.UTF-8': {
    lang = 'en_gb'

    break
  }

  case 'es_PE.UTF-8': {
    lang = 'es_es'

    break
  }

  case 'pt_BR.UTF-8': {
    lang = 'pt_br'

    break
  }

  case 'fr_FR.UTF-8': {
    lang = 'fr'

    break
  }

  case 'de_DE.UTF-8': {
    lang = 'de'

    break
  }
  // No default
  }

  let text = '  - try_install:\n'

  // Pacchetti da installare sempre
  text += `    - hunspell-${lang}\n`

  // Pacchetti da installare a seconda della distribuzione
  if (distro.versionLike === 'focal' || distro.versionLike === 'bionic') {
    text += `    - language-pack-${lang}\n`
  }

  // Pacchetti da installare se sono presenti
  if (Pacman.packageIsInstalled('libreoffice-base-core')) {
    text += `    - libreoffice-l10n-${lang}\n`
    text += `    - libreoffice-help-${lang}\n`
  }

  if (Pacman.packageIsInstalled('firefox-esr')) {
    text += `    - firefox-esr-${lang}\n`
  }

  if (Pacman.packageIsInstalled('thunderbird')) {
    text += `    - thunderbird-locale-${lang}\n`
  }

  return text
}

/**
 *
 * @param distro
 */
function removeEggs(distro: IDistro): string {
  const packages = Pacman.packages()
  let text = ''
  for (const i in packages) {
    const deb2check = packages[i].trimStart().trimEnd()
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
    text += `    - '${package2check}'\n`
  }

  return text
}
