/**
 * penguins-eggs: buster/branding.ts
 *
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 */
import yaml = require('js-yaml')
import { IRemix, IOses } from '../../../interfaces'

/**
 * 
 * @param remix 
 * @param oses 
 * @param verbose 
 */
export function branding(remix: IRemix, oses: IOses, verbose = false): string {
    const versionLike: string = oses.versionLike
    const homeUrl: string = oses.homeUrl
    const supportUrl: string = oses.supportUrl
    const bugReportUrl: string = oses.bugReportUrl

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

    const branding =
    {
        componentName: remix.branding,
        welcomeStyleCalamares: true,
        strings:
        {
            productName: productName,
            shortProductName: shortProductName,
            version: version,
            shortVersion: shortVersion,
            versionedName: versionedName,
            shortVersionedName: shortVersionedName,
            bootloaderEntryName: bootloaderEntryName,
            productUrl: productUrl,
            supportUrl: supportUrl,
            releaseNotesUrl: releaseNotesUrl,
        },
        images:
        {
            productLogo: productLogo,
            productIcon: productIcon,
            productWelcome: productWelcome,
        },
        slideshow: slideshow,
        style:
        {
            sidebarBackground: '#2c3133',
            sidebarText: '#FFFFFF',
            sidebarTextSelect: '#4d7079',
        },
    }
    return yaml.safeDump(branding)
}
