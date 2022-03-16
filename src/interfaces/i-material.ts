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
        packages: string [],
        accessories: string [],
        debs: boolean,
        hostname: boolean,
        reboot: boolean
    }
}
