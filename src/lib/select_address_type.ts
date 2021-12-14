/**
 * selectAddressType
 */
import inquirer from 'inquirer'

export default async function selectAddressType(): Promise<string> {
  const questions: Array<Record<string, any>> = [
    {
      type: 'list',
      name: 'option',
      message: 'Select address type: ',
      choices: ['dhcp', 'static'],
      default: 'dhcp',
    },
  ]

  return new Promise(function (resolve) {
    inquirer.prompt(questions).then(function (options) {
      resolve(options.option)
    })
  })
}
