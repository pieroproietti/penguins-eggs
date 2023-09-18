/**
 * penguins-eggs
 * lib: select_interface.ts
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
const inquirer = require('inquirer') 

export default async function selectInterface(iface = 'eth0', ifaces: string[]): Promise<string> {
  const questions: Array<Record<string, any>> = [
    {
      type: 'list',
      name: 'option',
      message: 'Select interface: ',
      choices: ifaces,
      default: iface,
    },
  ]

  return new Promise(function (resolve) {
    inquirer.prompt(questions).then(function (options: any) {
      resolve(options.option)
    })
  })
}
