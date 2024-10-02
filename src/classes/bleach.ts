/**
 * ./src/classes/bleach.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import fs from 'node:fs'

// libraries
import { exec } from '../lib/utils.js'
import Distro from './distro.js'
import Utils from './utils.js'

/**
 * Bleach:
 */
export default class Bleach {
  /**
   * clean
   * @param verbose
   */
  async clean(verbose = false) {
    let echo = { capture: false, echo: false, ignore: true }
    if (verbose) {
      echo = { capture: false, echo: true, ignore: true }
      Utils.warning('cleaning the system')
    }

    const distro = new Distro()
    switch (distro.familyId) {
      case 'debian': {
        await exec('apt-get clean', echo)
        await exec('apt-get autoclean', echo)
        const lockFile = '/var/lib/apt/lists/lock'
        await exec(`rm ${lockFile} -rf`, echo)

        break
      }

      case 'archlinux': {
        await exec('pacman -Scc', Utils.setEcho(true))

        break
      }

      case 'alpine': {
        await exec('apk cache clean', echo)
        await exec('apk cache purge', echo)

        break
      }

      case 'fedora': {
        await exec(`dnf clean all`, echo)

        break
      }

      case 'opensuse': {
        await exec(`zypper clean`, echo)

        break
      }

      case 'voidlinux': {
        await exec(`xbps-remove -O`, echo)
        break
      }
      
      // No default
    }

    await this.cleanHistory(verbose)
    await this.cleanJournal(verbose)
    await this.cleanSystemCache(verbose)
  }

  /**
   * cleanHistory
   * @param verbose
   */
  private async cleanHistory(verbose = false) {
    if (verbose) {
      Utils.warning('cleaning bash history')
    }

    const dest = '/root/.bash_history'
    if (fs.existsSync(dest)) {
      await rm(dest, verbose)
    }
  }

  /**
   * cleanJournal
   * @param verbose
   */
  private async cleanJournal(verbose = false) {
    let echo = { capture: false, echo: false, ignore: true }
    if (verbose) {
      echo = { capture: false, echo: true, ignore: true }
      Utils.warning('cleaning journald')
    }

    if (Utils.isSystemd()) {
      try {
        await exec('journalctl --rotate', echo)
        await exec('journalctl --vacuum-time=1s', echo)
      } catch (error) {
        Utils.error(error as string)
      }
    } else {
      // Truncate logs, remove archived logs.
      await exec('find /var/log -name "*gz" -print0 | xargs -0r rm -f', echo)
      await exec('find /var/log/ -type f -exec truncate -s 0 {} \\;', echo)
    }
  }

  /**
   * cleanSystemCache
   * @param verbose
   */
  private async cleanSystemCache(verbose = false) {
    let echo = { capture: false, echo: false, ignore: true }
    if (verbose) {
      echo = { capture: false, echo: true, ignore: true }
      Utils.warning('cleaning system cache')
    }

    // Clear PageCache only.
    await exec('sync; echo 1 > /proc/sys/vm/drop_caches', echo)

    // Clear dentries and inodes.
    await exec('sync; echo 2 > /proc/sys/vm/drop_caches', echo)

    // Clear PageCache, dentries and inodes.
    await exec('sync; echo 3 > /proc/sys/vm/drop_caches', echo)
  }
}

/**
 *
 * @param dest
 */
async function rm(dest = '', verbose = false) {
  let echo = { capture: false, echo: false, ignore: true }
  if (verbose) {
    echo = { capture: false, echo: true, ignore: true }
  }

  if (fs.existsSync(dest)) {
    await exec(`rm ${dest} -rf`, echo)
  } else {
    console.log(`non esiste ${dest}`)
  }
}

async function rmdir(dest = '', verbose = false) {
  let echo = { capture: false, echo: false, ignore: true }
  if (verbose) {
    echo = { capture: false, echo: true, ignore: true }
  }

  const result: string[] = fs.readdirSync(dest)
  if (result.length > 0) {
    await exec(`rm ${dest} -rf`, echo)
  }
}
