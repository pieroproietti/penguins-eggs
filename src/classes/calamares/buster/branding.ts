/**
 * penguins-eggs: buster/branding.ts
 *
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 */
import yaml = require('js-yaml')
import { IDistro, IOses } from '../../../interfaces'

/**
 * 
 * @param distro 
 * @param oses 
 * @param verbose 
 */
export function branding(distro: IDistro, oses: IOses, verbose = false): string {
    const versionLike: string = oses.versionLike
    const homeUrl: string = oses.homeUrl
    const supportUrl: string = oses.supportUrl
    const bugReportUrl: string = oses.bugReportUrl

    const productName = distro.name
    const shortProductName = distro.name
    const version = distro.versionNumber + ' ( ' + distro.versionName + ')'
    const shortVersion = distro.versionNumber
    const versionedName = distro.name
    const shortVersionedName = distro.versionName
    const bootloaderEntryName = productName
    const productUrl = homeUrl
    const releaseNotesUrl = 'https://github.com/pieroproietti/penguins-eggs'
    const productLogo = `${distro.branding}-logo.png`
    const productIcon = `${distro.branding}-logo.png`
    const productWelcome = 'welcome.png'
    const slideshow = 'show.qml'

    const branding =
    {
        componentName: distro.branding,
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
