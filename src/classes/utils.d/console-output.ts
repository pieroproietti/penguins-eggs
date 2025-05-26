/**
 * ./src/classes/utils.d/console-output.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * Console output utilities - colored output, titles, warnings, errors
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import chalk from 'chalk'

// pjson
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pjson = require('../../../package.json');

export default class ConsoleOutput {
   /**
    *
    * @param msg
    */
   static warning(msg = '') {
      console.log(pjson.shortName + ' >>> ' + chalk.cyanBright(msg) + '.')
   }

   static error(msg = '') {
      console.error(pjson.shortName + ' >>> ' + chalk.bgMagentaBright(chalk.whiteBright(msg)) + '.')
   }

   /**
    * titles
    * Penguin's are gettings alive!
    */
   static titles(command = '') {
      console.clear()
      console.log('')
      console.log(' E G G S: the reproductive system of penguins')
      console.log('')
      console.log(ConsoleOutput.flag())
      console.log('command: ' + chalk.bgBlack.white(command) + '\n')
   }

   /**
    *
    * @returns flag
    */
   static flag(): string {
      return chalk.bgGreen.whiteBright('      ' + pjson.name + '      ') +
         chalk.bgWhite.blue(" Perri's Brewery edition ") +
         chalk.bgRed.whiteBright('       ver. ' + pjson.version + '       ')
   }
}