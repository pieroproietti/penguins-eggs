'use strict'
import inquirer = require('inquirer')

export default async function getDns(initial: string): Promise<string[]> {

   return new Promise(function (resolve) {
      const questions: Array<Record<string, any>> = [
         {
            type: 'input',
            name: 'dns',
            message: "dns: 192.168.61.2; 8.8.8.8 ",
            default: initial
         },
      ]

      inquirer.prompt(questions).then(function (options) {
         resolve(options.dns)
      })
   })
}
