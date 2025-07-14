/**
 * ./src/classes/incubation/fisherman-helper/packages.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import { IDistro } from '../../../interfaces/index.js'
import Pacman from '../../pacman.js'

/**
 *
 * @param distro
 * @returns yaml-string
 */
export function remove(distro: IDistro): string {
  const packages = ['calamares-eggs', 'calamares']

  if (distro.familyId === 'archlinux') {
    packages.push('penguins-eggs')
  }

  if (distro.familyId === 'debian') {
    packages.push('penguins-eggs', 'live-boot', 'live-boot-doc', 'live-boot-initramfs-tools', 'live-tools')
  }

  const installedPackages: string[] = []
  for (const elem of packages) {
    if (Pacman.packageIsInstalled(elem)) {
      installedPackages.push(elem)
    }
  }

  installedPackages.sort()

  let yaml = ''
  for (const elem of installedPackages) {
    yaml += `  - ${elem.trim()}\n`
  }

  if (yaml !== '') {
    yaml = '- try_remove:\n' + yaml
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
    yaml += '  - language-pack-$LOCALE\n'
  }

  // Da localizzare se presenti
  if (Pacman.packageIsInstalled('hunspell')) {
    yaml += '  - hunspell-$LOCALE\n'
  }

  if (Pacman.packageIsInstalled('libreoffice-base-core')) {
    yaml += '  - libreoffice-l10n-$LOCALE\n'
    yaml += '  - libreoffice-help-$LOCALE\n'
  }

  if (Pacman.packageIsInstalled('firefox-esr')) {
    yaml += '  - firefox-esr-$LOCALE\n'
  }

  if (Pacman.packageIsInstalled('firefox')) {
    yaml += '  - firefox-$LOCALE\n'
  }

  if (Pacman.packageIsInstalled('thunderbird')) {
    yaml += '  - thunderbird-locale-$LOCALE\n'
  }

  if (yaml !== '') {
    yaml = '- try_install:\n' + yaml
  }

  return yaml
}
