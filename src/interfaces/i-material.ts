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
        packagesNoInstallRecommends: string [],
        debs: boolean,
        customizations: {
            scripts: string [],
            skel: boolean,
            usr: boolean,
        }
        hostname: boolean,
        reboot: boolean
    }
}
