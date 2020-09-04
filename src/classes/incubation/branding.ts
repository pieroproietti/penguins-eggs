/**
 * penguins-eggs: buster/branding.ts
 *
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 */
import yaml = require('js-yaml')
import { IRemix, IDistro } from '../../interfaces'
import Ovary from '../ovary'

/**
 *
 * @param remix
 * @param oses
 * @param verbose
 */
export function branding(
   remix: IRemix,
   distro: IDistro,
   brand = '',
   verbose = false
): string {
   const versionLike: string = distro.versionLike
   const homeUrl: string = distro.homeUrl
   const supportUrl: string = distro.supportUrl
   const bugReportUrl: string = distro.bugReportUrl

   const productName = `Debian`
   const shortProductName = remix.name
   const version = remix.versionNumber + ' ( ' + remix.versionName + ')'
   const shortVersion = remix.versionNumber
   const versionedName = remix.name
   const shortVersionedName = remix.versionName
   const bootloaderEntryName = productName
   const productUrl = homeUrl
   const releaseNotesUrl = 'https://github.com/pieroproietti/penguins-eggs'
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
   //console.log(branding)
   return yaml.safeDump(branding)
}



