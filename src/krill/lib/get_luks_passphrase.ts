/**
 * ./src/lib/get_luks-passphrase.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import inquirer from 'inquirer'

export default async function getLuksPassphrase(passphrase = '', confirm = ''): Promise<string> {
  const questions: any = [
    {
      default: passphrase,
      message: `I often use "evolution"\nChoose a passphrase to encrypt device: `,
      name: 'passphrase',
      type: 'password',
      // validate: requireLetterAndNumber
    },
    {
      default: confirm,
      message: `Confirm your passphrase: `,
      name: 'confirm',
      type: 'password',
      // validate: requireLetterAndNumber
    }
  ]

  const options = await inquirer.prompt(questions)

  if (options.passphrase !== options.confirm) {
    console.error('Error: Passphrases do not match. Please try again.')
    return getLuksPassphrase() // Richiede di nuovo l'input
  }

  return options.confirm
}
