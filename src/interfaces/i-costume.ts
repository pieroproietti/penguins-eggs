export interface ICostume {
    name: string
    author: string
    description: string
    release: string
    applyTo: string
    distroId: string
    codenameId: string
    releaseId: string
    sequence: {
        repositories: {
            sourcesList: {
                main: boolean,
                contrib: boolean,
                nonFree: boolean
            },
            sourcesListD: string [],
            update: boolean,
            fullUpgrade: boolean,
        },
        dependencies: string []
        packages: string [],
        noInstallRecommends: string [],
        firmwares: {
            codecs: string[],
            drivers_graphics_tablet: string[],
            drivers_network: string[],
            drivers_printer: string[],
            drivers_various: string[],
            drivers_video_amd: string[],
            drivers_video_nvidia: string[],
            drivers_wifi: string[],
        }
        debs: boolean,
        packagesPip: string [],
        dirs: boolean,
        accessories: string[],
        hostname: boolean,
        customizations: {
            scripts: string [],
        }
        reboot: boolean
    }
}
