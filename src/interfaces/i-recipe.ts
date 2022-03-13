export interface IRecipe {
    name: string
    author: string
    description: string
    release: string
    applyTo: string
    distroId: string
    codenameId: string
    releaseId: string
    sourceslist: string []
    sourceslistd: string []
    repositories: string[]
    packages: string[]
    debs: string
    sequence: string[]
}
