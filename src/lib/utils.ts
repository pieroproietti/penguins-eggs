/**
 * ./src/lib/utils.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

/**
 * Executes shell command as it would happen in BASH script
 * @param {string} command
 * @param {Object} [options] Object with options.
 *                           echo: true, to echo command passed.
 *                           ignore: true to ignore stdout
 *                           capture: true, to capture and return stdout.
 *
 * @returns {Promise<{code: number, data: string | undefined, error: Object}>}
 *
 * https://github.com/oclif/core/issues/453#issuecomment-1200778612
 * codespool:
 * You could wrap spawn in a promise, listen to exit event, and resolve when it happens. That should play nicely with oclif/core.
 * We are using it here:
 * https://github.com/AstarNetwork/swanky-cli/blob/master/src/commands/compile/index.ts
 */

import { IExec } from '../interfaces/index.js'

import { spawn } from 'child_process';

/**
 * 
 * @param command 
 * @param param1 
 * @returns 
 */
export async function exec(command: string, { echo = false, ignore = false, capture = false } = {}): Promise<IExec> {
  return new Promise((resolve, reject) => {
    if (echo) {
      console.log(command)
    }

    // Opzioni di base per spawn
    const spawnOptions: any = {
      stdio: ignore ? 'ignore' : capture ? 'pipe' : 'inherit'
    }

    const child = spawn('bash', ['-c', command], spawnOptions)

    let stdout = ''
    if (capture) {
      child.stdout?.on('data', (data: string) => {
        stdout += data
      })
    }

    child.on('error', (error: any) => {
      reject({ code: 1, error })
    })

    child.on('exit', (code: number) => {
      resolve({ code, data: stdout })
    })
  })
}