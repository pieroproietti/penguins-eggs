/**
 * ./src/interfaces/i-branding.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

export interface IBranding {
  componentName: string
  images: {
    productIcon: string
    productLogo: string
    productWelcome: string
  }
  slideshow: string
  slideshowAPI: number
  strings: {
    bootloaderEntryName: string
    bugReportUrl: string
    productName: string
    productUrl: string
    releaseNotesUrl: string
    shortProductName: string
    shortVersion: string
    shortVersionedName: string
    supportUrl: string
    version: string
    versionedName: string
  }
  style: {
    sidebarBackground: string
    sidebarText: string
    sidebarTextSelect: string
  }
  welcomeStyleCalamares: boolean
}
