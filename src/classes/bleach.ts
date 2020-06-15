/* eslint-disable no-console */
/**
 * penguins-eggs: Bleach.ts
 *
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 */

// libraries
const exec = require('../lib/utils').exec

/**
 * Bleach:
 */
export default class Ovary {
  /**
    *
    * @param verbose
    */
  static async clean(verbose = false) {
    await this.cleanJournal(verbose)
    await this.cleanApt(verbose)
  }

  /**
   *
   * @param verbose    */
  static async cleanJournal(verbose = false) {
    if (verbose) {
      console.log('cleang journal')
    }
    await exec('journalctl --rotate')
    await exec('journalctl --vacuum-time=1s')
  }

  static async cleanApt(verbose = false) {
    if (verbose) {
      console.log('cleang apt')
    }
    await exec('apt clean')
    await exec('apt autoclean')
  }
}
