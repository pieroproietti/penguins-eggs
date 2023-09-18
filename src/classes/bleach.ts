/* eslint-disable no-console */
/**
 * penguins-eggs
 * name: bleach.ts
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import fs from 'node:fs'
import Utils from './utils'

// libraries
import {exec} from '../lib/utils'
import Distro from './distro'

/**
 * Bleach:
 */
export default class Bleach {
  /**
   * clean
   * @param verbose
   */
  async clean(verbose = false) {
    if (verbose) {
      Utils.warning('cleaning the system')
    }

    const distro = new Distro()
    if (distro.familyId === 'debian') {
      await this.cleanApt(verbose)
    } else if (distro.familyId === 'archlinux') {
      await exec('pacman -Scc', Utils.setEcho(true))
    }

    await this.cleanHistory(verbose)
    await this.cleanJournal(verbose)
    await this.cleanSystemCache(verbose)
  }

  /**
   * cleanApt
   * @param verbose
   */
  private async cleanApt(verbose = false) {
    let echo = {echo: false, ignore: true, capture: false}
    if (verbose) {
      echo = {echo: true, ignore: true, capture: false}
    }

    await exec('apt-get clean', echo)
    await exec('apt-get autoclean', echo)
    const dest = '/var/lib/apt/lists/'
    rmdir(dest, verbose)
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
    let echo = {echo: false, ignore: true, capture: false}
    if (verbose) {
      echo = {echo: true, ignore: true, capture: false}
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
    let echo = {echo: false, ignore: true, capture: false}
    if (verbose) {
      echo = {echo: true, ignore: true, capture: false}
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
  let echo = {echo: false, ignore: true, capture: false}
  if (verbose) {
    echo = {echo: true, ignore: true, capture: false}
  }

  if (fs.existsSync(dest)) {
    await exec(`rm ${dest} -rf`, echo)
  } else {
    console.log(`non esiste ${dest}`)
  }
}

async function rmdir(dest = '', verbose = false) {
  let echo = {echo: false, ignore: true, capture: false}
  if (verbose) {
    echo = {echo: true, ignore: true, capture: false}
  }

  const result: string[] = fs.readdirSync(dest)
  if (result.length > 0) {
    await exec(`rm ${dest} -rf`, echo)
  }
}

/**
 * Elenco pulitori bleachbit
 * Solo quelli pertinenti root
 */

/*

# apt
# bash.history

// deepscan.backup
// deepscan.ds_store
// deepscan.thumbs_db
// deepscan.tmp

gnome.run
gnome.search_history

journald.clean

// kde.cache
// kde.recent_documents
// kde.tmp

# system.cache
system.clipboard // xclip
system.custom
system.desktop_entry
system.free_disk_space
system.localizations
system.memory
system.recent_documents
system.rotated_logs
system.tmp
system.trash

wine.tmp
winetricks.temporary_files

x11.debug_logs

yum.clean_all
yum.vacuum
*/
