
/* eslint-disable valid-jsdoc */
/**
 * penguins-eggs-v7
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import fs = require('fs')

export default class n8 {
    /**
     * 
     * @param dirPath 
     */
    static isDirectory(name: string): boolean {
        let path = `/${name}`
        let isDirectory = fs.existsSync(path) && fs.lstatSync(path).isDirectory()
        console.log(`path: ${path} isDirectory: ${isDirectory}`)
        return isDirectory
    }

    static isFile(name: string): boolean {
        let path = `/${name}`
        let isFile = fs.existsSync(path) && fs.lstatSync(path).isFile()
        console.log(`path: ${path} isFile: ${isFile}`)
        return isFile
    }


    static isSymbolicLink(name: string): boolean {
        let path = `/${name}`
        let isSymbolicLink = fs.existsSync(path) && fs.lstatSync(path).isSymbolicLink()
        console.log(`path: ${path} isSymbolicLink: ${isSymbolicLink}`)
        return isSymbolicLink
    }

    static dirent2string(dir: fs.Dirent): string {
        const ret = JSON.stringify(dir).replace(`"`, ``).replace(`"`, ``)
        return ret
    }

}
