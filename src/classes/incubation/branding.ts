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
  const {homeUrl} = distro
  const {supportUrl} = distro
  const bugReportUrl = 'https://github.com/pieroproietti/penguins-eggs/issues'

  const productName = remix.versionName // Questa va nel titolo ed in basso
  const shortProductName = remix.fullname
  const today = new Date()
  const day = ('0' + today.getDate()).slice(-2)
  const month = ('0' + (today.getMonth() + 1)).slice(-2)
  const year = today.getFullYear()
  const version = year + '-' + month + '-' + day
  const shortVersion = version
  const versionedName = remix.fullname + ' (' + version + ')' // Questa la mette nella descrizione andrebbe aggiunta la versione dal nome della iso
  const shortVersionedName = remix.versionName + ' ' + version

  let bootloaderEntryName = distro.distroId

  /**
   * some distros: Devuan, LMDE, syslinuxos 
   * must have: bootloaderEntryName=Debian 
   * to work on EFI
   */
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

  const productUrl = homeUrl
  const releaseNotesUrl = 'https://github.com/pieroproietti/penguins-eggs/changelog.md'
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
      bootloaderEntryName,
      bugReportUrl,
      productName,
      productUrl,
      releaseNotesUrl,
      shortProductName,
      shortVersion,
      shortVersionedName,
      supportUrl,
      version,
      versionedName,
    },
    style: {
      // li ripeto per calamares 3.3
      SidebarBackground:    "#010027",
      SidebarBackgroundCurrent: "#017877",
      SidebarText:          "#FFFFFF",
      SidebarTextCurrent:   "#fbfbfb",
      sidebarBackground:    "#010027",
      sidebarBackgroundCurrent: "#017877",
      sidebarText:          "#FFFFFF",
      sidebarTextCurrent:   "#fbfbfb"
    },
    welcomeStyleCalamares: true,
  }
  return yaml.dump(branding)
}
