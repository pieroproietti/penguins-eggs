/**
 * Executes shell command as it would happen in BASH script
 * @param {string} command
 * @param {Object} [options] Object with options.
 *                           Set `echo` to TRUE, to echo command passed.
 *                           Set `ignore` to TRUE to ignore stdout
 *                           Set `capture` to TRUE, to capture and return stdout.
 *
 * @returns {Promise<{code: number, data: string | undefined, error: Object}>}
 */

import {IExec} from '../interfaces'

export function exec(command: string, {echo = false, ignore = false, capture = false} = {}): Promise<IExec> {
  if (echo) {
    console.log(command)
  }

  const spawn = require('child_process').spawn
  // const childProcess = spawn('bash', ['-c', command], { stdio: capture ? 'pipe' : 'inherit' });
  // const childProcess = spawn('bash', ['-c', command], { stdio: capture ? 'pipe' : ignore ? 'ignore' : 'inherit' });
  const childProcess = spawn('bash', ['-c', command], {
    stdio: ignore ? 'ignore' : (capture ? 'pipe' : 'inherit'),
  })

  return new Promise((resolve, reject) => {
    let stdout = ''

    if (capture) {
      childProcess.stdout.on('data', (data: string) => {
        stdout += data
      })
    }

    childProcess.on('error', function (error: string) {
      reject({code: 1, error: error})
    })

    childProcess.on('close', function (code: number) {
      if (code > 0) {
        reject({code: code, error: 'Command failed with code ' + code})
      } else {
        resolve({code: code, data: stdout})
      }
    })
  })
}
