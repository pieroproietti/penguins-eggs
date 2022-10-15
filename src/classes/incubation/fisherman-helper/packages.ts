/**
 * packages.ts
 */
import { IDistro } from '../../../interfaces'
import Pacman from '../../pacman'

/**
 * 
 * @param distro 
 * @returns yaml-string
 */
export function remove(distro: IDistro): string {
  let packages = ["calamares"]
  if (distro.familyId === 'archlinux') {
    packages.push("penguins-eggs")
  } if (distro.familyId === 'debian') {
    packages.push("eggs")
  }

  let yaml = ''
  for (const elem of packages) {
    yaml += `    - ${elem.trim()}\n`
  }

  if (yaml !== '') {
    yaml = '- remove:\n' + yaml
  }
  return yaml
}

/**
 *
 * @param distro
 * @returns yaml-string
 */
export function tryInstall(distro: IDistro): string {
  let yaml = ''
  /**
   * Depending on the distro
   */
  if (distro.distroLike === 'Ubuntu') {
    yaml += '    - language-pack-$LOCALE\n'
  }

  // Da localizzare se presenti
  if (Pacman.packageIsInstalled('hunspell')) {
    yaml += '    - hunspell-$LOCALE\n'
  }

  if (Pacman.packageIsInstalled('libreoffice-base-core')) {
    yaml += `    - libreoffice-l10n-$LOCALE\n`
    yaml += `    - libreoffice-help-$LOCALE\n`
  }

  if (Pacman.packageIsInstalled('firefox-esr')) {
    yaml += `    - firefox-esr-$LOCALE\n`
  }

  if (Pacman.packageIsInstalled('firefox')) {
    yaml += `    - firefox-$LOCALE\n`
  }

  if (Pacman.packageIsInstalled('thunderbird')) {
    yaml += `    - thunderbird-locale-$LOCALE\n`
  }

  if (yaml !== '') {
    yaml = '  - try_install:\n' + yaml
  }

  return yaml
}
