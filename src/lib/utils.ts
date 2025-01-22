/**
 * ./src/lib/utils.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

/**
 * Executes shell command as it would happen in BASH script
 * @param {string} command
 * @param {Object} [options] Object with options.
 *                           Set `echo` to TRUE, to echo command passed.
 *                           Set `ignore` to TRUE to ignore stdout
 *                           Set `capture` to TRUE, to capture and return stdout.
 *
 * @returns {Promise<{code: number, data: string | undefined, error: Object}>}
 *
 * https://github.com/oclif/core/issues/453#issuecomment-1200778612
 * codespool:
 * You could wrap spawn in a promise, listen to exit event, and resolve when it happens. That should play nicely with oclif/core.
 * We are using it here:
 * https://github.com/AstarNetwork/swanky-cli/blob/master/src/commands/compile/index.ts
 */

import { spawn } from 'node:child_process'

import { IExec } from '../interfaces/index.js'

/**
 *
 * @param command
 * @param param1
 * @returns
 */
export async function exec(command: string, { capture = false, echo = false, ignore = false } = {}): Promise<IExec> {
  /**
   * You could wrap spawn in a promise,
   * listen to exit event,
   * and resolve when it happens.
   *
   * That should play nicely with oclif/core.
   */
  return new Promise((resolve, reject) => {
    if (echo) {
      console.log(command)
    }

    const child = spawn('bash', ['-c', command], {
      stdio: ignore ? 'ignore' : capture ? 'pipe' : 'inherit'
    })

    let stdout = ''
    if (capture) {
      child.stdout?.on('data', (data: string) => {
        stdout += data
      })
    }

    // 'error' event
    child.on('error', (error: string) => {
      reject({ code: 1, error })
    })

    // The 'exit' event is emitted after the child process ends. If the process exited, code is the final exit code of the process,
    // otherwise null. If the process terminated due to receipt of a signal, signal is the string name of the signal, otherwise null.
    // One of the two will always be non-null.
    child.on('exit', (code: number) => {
      resolve({ code, data: stdout })
    })

    // end promise
  })
}

/**
 * Compare two instances in order to determinate if they have save property values
 * 
 * @param instance1 T
 * @param instance2 T
 * @returns boolean
 */
export function compareInstances<T>(instance1: T, instance2: T): boolean { return JSON.stringify(instance1) === JSON.stringify(instance2); } 

/**
  * Il problema è in questa funzione: core/cli-ux/indesx.ts
  * qui riportata solo come esempio
  *
function timeout(p: Promise<any>, ms: number) {
  function wait(ms: number, unref = false) {
    return new Promise(resolve => {
      const t: any = setTimeout(() => resolve(null), ms)
      if (unref) t.unref()
    })
  }

  return Promise.race([p, wait(ms, true).then(() => ux.error('timed out'))])
}
*/
