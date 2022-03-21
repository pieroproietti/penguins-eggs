import { boolean } from "@oclif/core/lib/parser/flags"

export interface IMaterial {
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
        packagesPip: string [],
        debs: boolean,
        dirs: boolean,
        hostname: boolean,
        customizations: {
            scripts: string [],
        }
        reboot: boolean
    }
}
