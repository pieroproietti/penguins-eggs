/**
 * penguins-eggs: buster/branding.ts
 *
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 */
import yaml = require('js-yaml')
import { IRemix, IDistro } from '../../interfaces'

/**
 *
 * @param remix
 * @param oses
 * @param verbose
 */
export function branding(remix: IRemix, distro: IDistro, brand = '', verbose = false): string {
   const homeUrl: string = distro.homeUrl
   const supportUrl: string = distro.supportUrl
   const bugReportUrl = 'https://github.com/pieroproietti/penguins-eggs/issues'

   const productName = remix.versionName // Questa va nel titolo ed in basso
   const shortProductName = remix.fullname
   const today = new Date()
   const day = ("0" + today.getDate()).slice(-2);
   const month = ("0" + (today.getMonth() + 1)).slice(-2);
   const year = today.getFullYear();
   const version = year + '-' + month + '-' + day
   const shortVersion = version
   const versionedName = remix.fullname  + ' ('+ version + ')' // Questa la mette nella descrizione andrebbe aggiunta la versione dal nome della iso
   const shortVersionedName = remix.versionName + ' ' + version
   //let bootloaderEntryName = distro.distroId
   let bootloaderEntryName = remix.fullname

   // Necessario: Devuan e LMDE devono avere EFI=Debian
   if (bootloaderEntryName === 'Devuan') {
      bootloaderEntryName = 'Debian'
   } else if (bootloaderEntryName === 'LMDE') {
      bootloaderEntryName = 'Debian'
   }
   const productUrl = homeUrl
   const releaseNotesUrl = 'https://github.com/pieroproietti/penguins-eggs/changelog.md'
   const productLogo = `${remix.branding}-logo.png`
   const productIcon = `${remix.branding}-logo.png`
   const productWelcome = 'welcome.png'
   const slideshow = 'show.qml'

   const branding = {
      componentName: remix.branding,
      welcomeStyleCalamares: true,
      strings: {
         productName: productName,
         shortProductName: shortProductName,
         version: version,
         shortVersion: shortVersion,
         versionedName: versionedName,
         shortVersionedName: shortVersionedName,
         bootloaderEntryName: bootloaderEntryName,
         productUrl: productUrl,
         supportUrl: supportUrl,
         bugReportUrl: bugReportUrl,
         releaseNotesUrl: releaseNotesUrl
      },
      images: {
         productLogo: productLogo,
         productIcon: productIcon,
         productWelcome: productWelcome
      },
      slideshowAPI: 1,
      slideshow: slideshow,
      style: {
         sidebarBackground: '#2c3133',
         sidebarText: '#FFFFFF',
         sidebarTextSelect: '#4d7079'
      }
   }
   return yaml.dump(branding)
}
