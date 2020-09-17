import { O_APPEND } from 'constants'
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
   let text = `   - try_install:\n`


   // Pacchetti da installare sempre
   text += '    - hunspell-$LOCALE\n'

   // Pacchetti da installare a seconda della distribuzione
   if ((distro.versionLike === 'focal') || (distro.versionLike === 'bionic')) {
      text += '    - language-pack-$LOCALE\n'
   }

   // Pacchetti da installare se sono presenti
   if (Pacman.packageIsInstalled(`libreoffice-base-core`)) {
      text += '    - libreoffice-l10n-$LOCALE\n'
      text += '    - libreoffice-help-$LOCALE\n'
   }

   if (Pacman.packageIsInstalled('firefox-esr')) {
      text += '    - firefox-esr-$LOCALE\n'
   }

   if (Pacman.packageIsInstalled('thunderbird')) {
      text += '    - thunderbird-locale-$LOCALE\n'
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
      const deb2check = packages[i].trimLeft().trimRight()
      text += addIfExist(deb2check)
   }
   /**
    * Rimuove i pacchetti di localizzazione
    */
   if ((distro.versionLike === 'buster') || (distro.versionLike === 'beowulf')) {
      const packages = Pacman.packagesLocalisation()
      for (const i in packages) {
         const deb2check = packages[i].trimLeft().trimRight()
         text += addIfExist(deb2check)
      }
   }
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
