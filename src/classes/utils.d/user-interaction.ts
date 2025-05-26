/**
 * ./src/classes/utils.d/user-interaction.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * User interaction utilities - prompts, confirmations, user input
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import inquirer from 'inquirer'
import { spawnSync } from 'child_process'
import ConsoleOutput from './console-output.js'

// pjson
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pjson = require('../../../package.json');

export default class UserInteraction {
   /**
    *
    * @param msg
    */
   static async customConfirm(msg = 'Select yes to continue... '): Promise<boolean> {
      const varResult = await UserInteraction.customConfirmCompanion(msg)
      const result = JSON.parse(varResult)
      if (result.confirm === 'Yes') {
         return true
      } else {
         return false
      }
   }

   /**
    *
    * @param msg
    */
   static async customConfirmCompanion(msg = 'Select yes to continue... '): Promise<any> {
      return new Promise(function (resolve) {
         const questions: any = [
            {
               type: 'list',
               name: 'confirm',
               message: msg,
               choices: ['No', 'Yes'],
               default: 'No'
            }
         ]
         inquirer.prompt(questions).then(function (options: any) {
            resolve(JSON.stringify(options))
         })
      })
   }

   /**
    *
    * @param msg
    */
   static async customConfirmAbort(msg = 'Confirm'): Promise<any> {
      return new Promise(function (resolve) {
         const questions: any = [
            {
               type: 'list',
               name: 'confirm',
               message: msg,
               choices: ['No', 'Yes', 'Abort'],
               default: 'Yes'
            }
         ]
         inquirer.prompt(questions).then(function (options: any) {
            resolve(JSON.stringify(options))
         })
      })
   }

   /**
    *
    */
   static async pressKeyToExit(warming = 'Process will end', procContinue = true) {
      ConsoleOutput.warning(warming)
      let msg = 'Press a key to exit...'
      if (procContinue) {
         msg = 'Press a key to continue...'
      }
      console.log(msg)
      const pressKeyToExit = spawnSync('read _ ', { shell: true, stdio: [0, 1, 2] })
      if (!procContinue) {
         process.exit(0)
      }
   }

   /**
    *
    * @param command
    */
   static useRoot(command = ''): void {
      ConsoleOutput.titles(pjson.shortName + ' ' + command + ` need to run with root privileges. Please, prefix it with sudo`)
   }

   /**
    *
    * @param verbose
    */
   static setEcho(verbose = false): object {
      let echo = { echo: false, ignore: true }
      if (verbose) {
         echo = { echo: true, ignore: false }
      }
      return echo
   }
}