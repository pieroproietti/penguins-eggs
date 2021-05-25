
'use strict'
import inquirer = require('inquirer')

export default async function getHostname(initial: string): Promise<string> {

   return new Promise(function (resolve) {
      const questions: Array<Record<string, any>> = [
         {
            type: 'input',
            name: 'hostname',
            message: "What is the name of this computer? ",
            default: initial
         },
      ]

      inquirer.prompt(questions).then(function (options) {
         resolve(options.hostname)
      })
   })
}
