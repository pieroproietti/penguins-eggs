/**
 * ./src/classes/utils.d/package-info.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * Package information and installation mode detection utilities
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import path from 'path'
import os from 'os'
import System from './system.js'

// pjson
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pjson = require('../../../package.json');

// __dirname
const __dirname = path.dirname(new URL(import.meta.url).pathname);

export default class PackageInfo {
   /**
    * return the name of the package: penguins-eggs
    * @returns penguins-eggs
    */
   static getPackageName(): string {
      return pjson.shortName
   }

   /**
    * return the short name of the package: eggs
    * @returns eggs
    */
   static getFriendName(): string {
      return pjson.shortName
   }

   /**
    * return the version of the package
    * @returns version example 8.0.0
    */
   static getPackageVersion(): string {
      return pjson.version
   }

   /**
    * Get author name
    */
   static getAuthorName(): string {
      return 'Piero Proietti piero.proietti@gmail.com'
   }

   /**
    * Controlla se è un pacchetto deb
    * /usr/lib/penguins-eggs/bin/node
    */
   static isPackage(): boolean {
      let ret = false
      //if (process.execPath !== '/usr/bin/node') {
      if (process.execPath === '/usr/lib/penguins-eggs/bin/node') {
         ret = true
      }
      return ret
   }

   /**
    * Controlla se è un pacchetto sorgente
    */
   static isSources(): boolean {
      let ret = false
      if (__dirname.substring(0, 6) === '/home/') {
         ret = true
      }
      return ret
   }

   /**
    * Controlla se è un pacchetto npm
    */
   static isNpmPackage(): boolean {
      return !(this.isPackage() || this.isSources())
   }

   /**
    *
    */
   static rootPenguin(): string {
      return path.resolve(__dirname, '../../../')
   }

   /**
    *
    * @returns wardrobe
    */
   static async wardrobe(): Promise<string> {
      let wardrobe = `${os.homedir()}/.wardrobe`
      if (System.isRoot()) {
         wardrobe = `/home/${await PackageInfo.getPrimaryUser()}/.wardrobe`
      }
      return wardrobe
   }

   /**
    * Return the primary user's name
    */
   static async getPrimaryUser(): Promise<string> {
      const { execSync } = require('child_process');
      let primaryUser = '';
      try {
         // Attempt to get the user from logname
         primaryUser = execSync('/usr/bin/logname 2>/dev/null', { encoding: 'utf-8' }).trim();
      } catch (error) {
         // console.log("logname failed, so we continue with other methods")
      }
      if (primaryUser === 'root') {
         primaryUser = ''
      }
      if (primaryUser === '') {
         try {
            // Check if doas is installed and get the DOAS_USER
            execSync('command -v doas', { stdio: 'ignore' });
            primaryUser = execSync('echo $DOAS_USER', { encoding: 'utf-8' }).trim();
         } catch (error) {
            // console.log("doas is not installed or DOAS_USER is not set, continue with the next method")
         }
      }
      if (primaryUser === '') {
         try {
            // Check for the SUDO_USER
            primaryUser = execSync('echo $SUDO_USER', { encoding: 'utf-8' }).trim();
         } catch (error) {
            // console.log("SUDO_USER is not set, continue with the next method")
         }
      }
      if (primaryUser === '') {
         // console.log("Fallback to the USER environment variable")
         primaryUser = process.env.USER || '';
      }
      if (primaryUser === '') {
         primaryUser = 'dummy'
         // console.error('Cannot determine the primary user.');
         // process.exit(1);
      }
      return primaryUser
   }
}