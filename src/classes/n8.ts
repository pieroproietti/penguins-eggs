/**
 * penguins-eggs-v7
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import fs from 'fs'

export default class n8 {
   /**
    *
    * @param dirPath
    */
   static isDirectory(name: string): boolean {
      // console.log (`isDirectory: ${name}`)
      const path = '/' + name
      const isDirectory = fs.existsSync(path) && fs.lstatSync(path).isDirectory()
      // console.log(`path: ${path} isDirectory: ${isDirectory}`)
      return isDirectory
   }

   static isFile(name: string): boolean {
      // console.log (`isFile: ${name}`)
      const path = '/' + name
      const isFile = fs.existsSync(path) && fs.lstatSync(path).isFile()
      // console.log(`path: ${path} isFile: ${isFile}`)
      return isFile
   }

   static isSymbolicLink(name: string): boolean {
      // console.log (`isSymbolicLink: ${name}`)
      const path = '/' + name
      const isSymbolicLink = fs.existsSync(path) && fs.lstatSync(path).isSymbolicLink()
      // console.log(`path: ${path} isSymbolicLink: ${isSymbolicLink}`)
      return isSymbolicLink
   }

   static dirent2string(dir: any): string {
      // const util = require('util')
      // console.log(util.inspect(dir, false, null, true /* enable colors */))

      let dirname = ''
      if (process.versions.node.split('.')[0] === '8') {
         dirname = JSON.stringify(dir).replace(`"`, ``).replace(`"`, ``)
      } else {
         // se Node>8 restituisce dirent.name
         dirname = dir.name
      }
      return dirname
   }
}
