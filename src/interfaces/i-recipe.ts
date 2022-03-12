export interface IRecipe {
    name: string
    author: string
    release: string
    applyTo: string
    distroId: string
    codenameId: string
    releaseId: string
    sourcelist: [
        component: string
    ]
    sourcelistd: [
        command: string
    ]
    sequence: [
        repositories: string [],
        packages: [],
        debs: string,
    ]
    
}
