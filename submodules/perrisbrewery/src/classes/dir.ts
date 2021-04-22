/* eslint-disable valid-jsdoc */
/* eslint-disable no-console */
import path = require('path')
import fs = require('fs')

export default class Dir {

   analyze(pathSource = '') {
      const pathDebs = pathSource + '/dist/deb/'
      const debFound: string[] = []
      if (fs.existsSync(pathDebs)) {
         const filenames = fs.readdirSync(pathDebs)
            filenames.forEach((file: string) => {
            if (path.extname(file) === '.deb') {
               debFound.push(file)
            }
         })
      } else {
         console.log('pathDebs: ' + pathDebs + 'not exist!')
      }
      return debFound
   }
}
