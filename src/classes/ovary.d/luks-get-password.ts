/**
 * ./src/classes/ovary.d/luks-home.ts
 * penguins-eggs v.25.10.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

// packages
import fs from 'fs'
import { spawn, StdioOptions } from 'node:child_process'

// classes
import Ovary from '../ovary.js'
import Utils from '../utils.js'


/**
 * Ottiene la password LUKS dall'utente
 */
export async function luksGetPassword(this: Ovary): Promise<void> {
  const inquirer = (await import('inquirer')).default

  // Chiedi se usare password di default
  const useDefault = await inquirer.prompt([{
    type: 'confirm',
    name: 'useDefault',
    message: `Use default password "${this.luksPassword}" for LUKS encryption?`,
    default: false
  }])

  if (useDefault.useDefault) {
    Utils.warning(`Using default password: ${this.luksPassword}`)
    return
  }

  // Chiedi password personalizzata con conferma
  let password = ''
  let confirmed = false

  while (!confirmed) {
    const answers = await inquirer.prompt([
      {
        type: 'password',
        name: 'password',
        message: 'Enter LUKS encryption password:',
        validate: (input: string) => {
          if (input.length < 8) {
            return 'Password must be at least 8 characters'
          }
          return true
        }
      },
      {
        type: 'password',
        name: 'confirm',
        message: 'Confirm password:'
      }
    ])

    if (answers.password === answers.confirm) {
      password = answers.password
      confirmed = true
      this.hidden = true
      Utils.success('Password confirmed!')
    } else {
      Utils.error('Passwords do not match. Please try again.')
    }
  }

  this.luksPassword = password
}  