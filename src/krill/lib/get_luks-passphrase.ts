/**
 * ./src/lib/get_luks-passphrase.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import inquirer from 'inquirer'

export default async function getLuksPassphrase(passphrase = '', confirm = ''): Promise<string> {
  const requireLetterAndNumber = (value: string) => {
    if (!(/\w/.test(value) && /\d/.test(value))) {
      return 'Passphrase must contain at least one letter and one number.'
    }
    return true
  }

  const questions = [
    {
      default: passphrase,
      message: `Choose a passphrase to encrypt device: `,
      name: 'passphrase',
      type: 'password',
      validate: requireLetterAndNumber
    },
    {
      default: confirm,
      message: `Confirm your passphrase: `,
      name: 'confirm',
      type: 'password',
      validate: requireLetterAndNumber
    }
  ]

  const options = await inquirer.prompt(questions)

  if (options.passphrase !== options.confirm) {
    console.error('Error: Passphrases do not match. Please try again.')
    return getLuksPassphrase() // Richiede di nuovo l'input
  }

  return options.confirm
}
