/**
 * ./src/classes/utils.d/architecture.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * Architecture detection utilities - UEFI, arch-specific paths
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import shx from 'shelljs'
import os from 'os'

export default class Architecture {
   /**
    * Return true if i686 architecture
    * @remarks to move in Utils
    * @returns {boolean} true se l'architettura è i686
    */
   static isi686(): boolean {
      return process.arch === 'ia32'
   }

   /**
    * uefiArch
    * @returns arch
    */
   static uefiArch(): string {
      let arch = ''
      if (process.arch === 'ia32') {
         arch = 'i386'
         // 
         if (shx.exec('uname -m', { silent: true }).stdout.trim() === 'x86_64') {
            arch = 'amd64'
         }
      } else if (process.arch === 'x64') {
         arch = 'amd64'
      } else if (process.arch === 'arm64') {
         arch = 'arm64'
      }
      return arch
   }

   /**
    * i386-pc,
    * i386-efi,
    * x86_64-efi, 
    * arm64-efi,
    * 
    * ATTEMZIONE: install efibootmgr
    * 
    * Fedora/RHEL have i386-pc
    */
   static uefiFormat(): string {
      let format = ''
      if (process.arch === 'ia32') {
         format = 'i386-efi'
         if (shx.exec('uname -m', { silent: true }).stdout.trim() === 'x86_64') {
            format = 'x86_64-efi'
         }
      } else if (process.arch === 'x64') {
         format = 'x86_64-efi'
      } else if (process.arch === 'arm64') {
         format = 'arm64-efi'
      }
      return format
   }

   /**
    * 
    * @returns 
    */
   static usrLibPath() {
      let path = ''
      if (process.arch === 'x64') {
         path = 'x86_64-linux-gnu'
      } else if (process.arch === 'arm64') {
         path = 'aarch64-linux-gnu'
      }
      return path
   }

   /**
    * get the kernel version
    */
   static kernelVersion(): string {
      return os.release()
   }
}