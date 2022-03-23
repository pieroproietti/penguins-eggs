/**
 * packages.ts
 */
export interface Packages {
    name: string
    version: string
    mantainer: string
    architecture: string
    description: string
//    buildDependencies: {
//        buildDepends: string[]
//        buildDependsIndep: string[]
//        buildDependsArch: string[]
//    }
    binaryDependencies: {
        depends: string[]
//        recommends: string[]
//        suggests: string[]
//        enhances: string[]
//        preDepends: string[]
    }
//    breack: string[]
//    conflics: string[]
}
