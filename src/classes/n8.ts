/**
 * ./src/classes/n8.ts (node 8)
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import fs, { Dirent } from 'node:fs'

export default class n8 {
  static dirent2string(dir: Dirent): string {
    return dir.name
    // Removed not needed more node8 is past
    let dirname = ''
    dirname = process.versions.node.split('.')[0] === '8' ? JSON.stringify(dir).replace('"', '').replace('"', '') : dir.name
    return dirname
  }

  /**
   *
   * @param dirPath
   */
  static isDirectory(name: string): boolean {
    const path = '/' + name
    const isDirectory = fs.existsSync(path) && fs.lstatSync(path).isDirectory()
    return isDirectory
  }

  static isFile(name: string): boolean {
    const path = '/' + name
    const isFile = fs.existsSync(path) && fs.lstatSync(path).isFile()
    return isFile
  }

  static isSymbolicLink(name: string): boolean {
    const path = '/' + name
    const isSymbolicLink = fs.existsSync(path) && fs.lstatSync(path).isSymbolicLink()
    return isSymbolicLink
  }
}
