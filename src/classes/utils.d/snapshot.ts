/**
 * ./src/classes/utils.d/snapshot.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * Snapshot management utilities - ISO, prefixes, volid
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import fs from 'fs'
import shx from 'shelljs'
import Filesystem from './filesystem.js'
import Formatters from './formatters.js'

export default class Snapshot {
   /**
    * Restituisce il prefisso della iso
    * @param distroId
    * @param codenameId
    */
   static snapshotPrefix(distroId: string, codenameId: string): string {
      let result = `egg-of_${distroId.toLowerCase()}-`
      if (codenameId === 'rolling' || codenameId === '') {
         const releaseId = Filesystem.getOsRelease().VERSION_ID.trim()
         if (releaseId !== '') {
            result += `${releaseId}-`
         }
      } else {
         result += `${codenameId.toLowerCase()}-`
      }
      // result = result.replace(`/`, '-')
      return result
   }

   /**
    * Count the eggs present in the nest
    * @returns {number} Numero degli snapshot presenti
    */
   static getSnapshotCount(snapshot_dir = '/'): number {
      if (fs.existsSync(snapshot_dir)) {
         const files = fs.readdirSync(snapshot_dir)
         let nIsos = 0
         for (const f of files) {
            if (f.endsWith('.iso')) {
               nIsos++
            }
         }
         return nIsos
      }
      return 0
   }

   /**
    * Get the syze of the snapshot
    * @returns {string} grandezza dello snapshot in Byte
    */
   static getSnapshotSize(snapshot_dir = '/'): number {
      let fileSizeInBytes = 0
      const size = shx.exec(`/usr/bin/find ${snapshot_dir} -maxdepth 1 -type f -name '*.iso' -exec du -sc {} + | tail -1 | awk '{print $1}'`, { silent: true }).stdout.trim()
      if (size === '') {
         fileSizeInBytes = 0
      } else {
         fileSizeInBytes = Number(size)
      }
      return fileSizeInBytes
   }

   /**
    *
    * @param prefix
    * @param backup
    * @returns
    */
   static getPrefix(prefix: string, backup = false) {
      if (backup) {
         if (prefix.substring(0, 7) === 'egg-of_') {
            prefix = 'egg-bk_' + prefix.substring(7)
         } else {
            prefix = 'egg-bk_' + prefix
         }
      }
      return prefix
   }

   /**
    *
    * @param volid
    */
   static getVolid(volid = 'unknown') {
      // // 28 +  4 .iso = 32 lunghezza max di volid
      if (volid.length >= 32) {
         volid = volid.substring(0, 32)
      }
      return volid
   }

   /**
    * Return postfix
    * @param basename
    * @returns eggName
    */
   static getPostfix(): string {
      let postfix = '_' + Formatters.formatDate(new Date()) + '.iso'
      return postfix
   }
}
