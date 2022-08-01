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

import { string } from '@oclif/core/lib/flags'
import { resolve } from 'path'
import { CodeAction, getAllJSDocTagsOfKind } from 'typescript'
import { IExec } from '../interfaces'
// import { spawn } from 'child_process'

/**
 * 
 * @param command 
 * @param param1 
 * @returns 
 */

export async function exec(command: string, { echo = false, ignore = false, capture = false } = {}): Promise<IExec> {

  /**
   * dovrebbe andare... ma non va!
   */
  return new Promise((resolve, reject) => {
    if (echo) {
      console.log(command)
    }
  
    const spawn = require('child_process').spawn

    const child = spawn('bash', ['-c', command], {
      stdio: ignore ? 'ignore' : capture ? 'pipe' : 'inherit'
    })

    let stdout = ''

    if (capture) {
      child.stdout.on('data', (data: string) => {
        stdout += data
      })
    }

    // 'error' event
    child.on('error', function (error: string) {
      reject({ code: 1, error: error })
    })

    // The 'close' event is emitted after a process has ended and the stdio streams of a child process have been closed. 
    // This is distinct from the 'exit' event, since multiple processes might share the same stdio streams. 
    // The 'close' event will always emit after 'exit' was already emitted, or 'error' if the child failed to spawn.

    // The 'exit' event is emitted after the child process ends. If the process exited, code is the final exit code of the process, 
    // otherwise null. If the process terminated due to receipt of a signal, signal is the string name of the signal, otherwise null. 
    // One of the two will always be non-null.
    child.on('exit', (code: number) => {
      resolve({ code: code, data: stdout })
    })
    // end promise
  })
}
