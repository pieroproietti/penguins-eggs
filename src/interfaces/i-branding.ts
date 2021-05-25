export interface IBranding {
    componentName: string,
    welcomeStyleCalamares: boolean,
    strings: {
        productName: string,
        shortProductName: string,
        version: string,
        shortVersion: string,
        versionedName: string,
        shortVersionedName: string,
        bootloaderEntryName: string,
        productUrl: string,
        supportUrl: string,
        bugReportUrl: string,
        releaseNotesUrl: string
    },
    images: {
        productLogo: string,
        productIcon: string,
        productWelcome: string
    },
    slideshowAPI: number,
    slideshow: string,
    style: {
        sidebarBackground: string,
        sidebarText: string,
        sidebarTextSelect: string
    }
}
