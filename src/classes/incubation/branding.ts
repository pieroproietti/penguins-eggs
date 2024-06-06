/**
 * ./src/classes/incubation/branding.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import yaml from 'js-yaml'

import { IDistro, IRemix } from '../../interfaces/index.js'

/**
 *
 * @param remix
 * @param distro
 * @param theme
 * @param verbose
 * @returns
 */
export function branding(remix: IRemix, distro: IDistro, theme = '', verbose = false): string {
  const {homeUrl, supportUrl, bugReportUrl} = distro

  // Li ridenomino per calamares
  const productUrl= homeUrl
  // const supportUrl= supportUrl
  const knownIssuesUrl="https://github.com/pieroproietti/penguins-eggs/issues/"
  const releaseNotesUrl = bugReportUrl

  const productName = remix.versionName // Questa va nel titolo ed in basso
  const shortProductName = remix.fullname

  const today = new Date()
  const version = today.toISOString().split('T')[0]   // 2021-09-30
  const shortVersion = version.split('-').join('.')    // 2021.09.30
  const versionedName = remix.fullname + ' (' + shortVersion + ')' // Questa la mette nella descrizione andrebbe aggiunta la versione dal nome della iso
  const shortVersionedName = remix.versionName + ' ' + version

  /**
   * some distros: Devuan, LMDE, syslinuxos 
   * must have: bootloaderEntryName=Debian 
   * to work on EFI
   */
  let bootloaderEntryName = ''
  switch (distro.distroId.toLowerCase()) {
    case 'devuan':
    case 'lmde':
    case 'syslinuxos': {
      bootloaderEntryName = 'Debian'

      break
    }

    default: {
      bootloaderEntryName = distro.distroId
    }
  }

  
  const productLogo = `${remix.branding}-logo.png`
  const productIcon = `${remix.branding}-logo.png`
  const productWelcome = 'welcome.png'
  const slideshow = 'show.qml'

  const branding = {
    componentName: remix.branding,
    images: {
      productIcon,
      productLogo,
      productWelcome,
    },
    slideshow,
    slideshowAPI: 1,
    strings: {
      productUrl,
      supportUrl,
      knownIssuesUrl,
      releaseNotesUrl,
      bootloaderEntryName,
      productName,
      shortProductName,
      version,
      shortVersion,
      shortVersionedName,
      versionedName,
    },
  style: {
    // 3.2.x
    sidebarBackground:        "#292F34",
    sidebarText:              "#FFFFFF",
    sidebarTextCurrent:       "#292F34",
    sidebarBackgroundCurrent: "#D35400",
    // 3.3.x
    SidebarBackground:        "#292F34",
    SidebarText:              "#FFFFFF",
    SidebarTextCurrent:       "#292F34",
    SidebarBackgroundCurrent: "#D35400",
    },
    welcomeStyleCalamares: true,
  }
  return yaml.dump(branding)
}

