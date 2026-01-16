/**
 * penguins-eggs
 * Kernel management utilities
 */

import fs from 'node:fs'
import path from 'path'

import { execSync } from '../../lib/utils.js'
import Distro from '../distro.js'
import Utils from '../utils.js'

export default class Kernel {
  
  /**
   * Cerca initramfs
   */
  static initramfs(kernel = ''): string {
    let targetKernel = kernel

    if (targetKernel === '') {
      if (Utils.isContainer() && !Utils.isChroot()) {
        Utils.warning("Non è possibile determinare il kernel in un container.")
        process.exit(1)
      }

      targetKernel = (execSync('uname -r', { stdio: 'ignore' }) || '').trim()
    }

    const kernelVersionShort = targetKernel.split('.').slice(0, 2).join('.');
    const bootDir = '/boot';

    let bootFiles: string[];
    try {
      bootFiles = fs.readdirSync(bootDir);
    } catch {
      console.error(`ERRORE: Impossibile leggere la directory ${bootDir}.`);
      process.exit(1);
    }

    const candidates: string[] = [];
    for (const filename of bootFiles) {
      if ((
        filename.startsWith('initramfs-') ||
        filename.startsWith('initrd.img-') ||
        filename.startsWith('initrd-')) &&
        (filename.includes(targetKernel) || filename.includes(kernelVersionShort))
      ) {
        candidates.push(filename);
      }
    }

    if (candidates.length > 0) {
      let foundPath = path.join(bootDir, candidates[0])
      if (candidates.length > 1) {
        const nonFallbackCandidates = candidates.filter(c => !c.includes('-fallback'));
        const searchArray = nonFallbackCandidates.length > 0 ? nonFallbackCandidates : candidates;
        foundPath = path.join(bootDir, searchArray[0]); 
        for (const candidate of searchArray) {
          const current = path.join(bootDir, candidate)
          if (current.length < foundPath.length) {
            foundPath = current
          }
        }
      }

      return foundPath;
    }

    // Fallbacks
    const staticFallbacks = [
      'initramfs-lts', 'initramfs-virt', 'initramfs-standard', 'initramfs-rpi',
      'initramfs-linux.img', 'initramfs-linux-lts.img', 'initramfs-linux-zen.img', 'initramfs-linux-hardened.img',
      'initramfs-linux-cachyos.img', 'initramfs-linux-cachyos-lts.img',
    ];

    for (const fallback of staticFallbacks) {
      const fallbackPath = path.join(bootDir, fallback);
      if (fs.existsSync(fallbackPath)) {
        return fallbackPath;
      }
    }

    Utils.warning(`Could not find an initramfs file for kernel ${targetKernel} in ${bootDir}.`)
    process.exit(1);
  }

  /**
   * Ricava path per vmlinuz (o vmlinux su RISC-V)
   */
  static vmlinuz(kernel = ''): string {
    let kernelFile = ''

    // Esegui se NON è un container
    if (Utils.isContainer()) {
      Utils.warning("cannot work on containers actually!")
      process.exit(1)
    } else {
      kernelFile = this.vmlinuzFromUname()

      if (kernelFile === '') {
        kernelFile = this.vmlinuzFromCmdline()
        if (kernelFile === '') {
          console.log('kernel (vmlinuz/vmlinux) not found')
          process.exit(1)
        }
      }
    }

    if (!fs.existsSync(kernelFile)) {
      console.log(`kernel: ${kernelFile} does not exist!`)
      process.exit(1)
    }

    return kernelFile
  }

  /**
   * PRIVATE METHODS
   */

  private static vmlinuzFromCmdline() {
    let kernelFile = '' 
    // ... (Logica esistente invariata) ...
    try {
        const cmdline = fs.readFileSync('/proc/cmdline', 'utf8').split(" ")
        for (const cmd of cmdline) {
        if (cmd.includes('BOOT_IMAGE')) {
            kernelFile = cmd.slice(Math.max(0, cmd.indexOf('=') + 1))
            if (kernelFile.includes(")")) {
            kernelFile = cmd.slice(Math.max(0, cmd.indexOf(')') + 1))
            }

            if (!fs.existsSync(kernelFile) && fs.existsSync(`/boot/${kernelFile}`)) {
                kernelFile = `/boot/${kernelFile}`
            }
        }
        }

        if (kernelFile.includes('@')) {
        const subvolumeEnd = kernelFile.indexOf('/', kernelFile.indexOf('@'))
        kernelFile = kernelFile.slice(Math.max(0, subvolumeEnd))
        }

        if (path.dirname(kernelFile) === '/' && fs.existsSync(`/boot${kernelFile}`)) {
            kernelFile = `/boot${kernelFile}`
        }
    } catch{ /* ignore read error */ }
    
    return kernelFile
  }

  private static vmlinuzFromUname(): string {
    const kernelVersion = (execSync('uname -r', { stdio: 'ignore' }) || '').trim()

    // --- CHECK FOR RISC-V (vmlinux) ---
    if (process.arch === 'riscv64') {
        // 1. Caso Perfetto: uname corrisponde al file vmlinux
        const riscvPath = `/boot/vmlinux-${kernelVersion}`
        if (fs.existsSync(riscvPath)) {
            return riscvPath;
        }

        // 2. Caso "Ciambella di Salvataggio": uname non trova file esatto? 
        // Scansioniamo la cartella per trovare QUALSIASI vmlinux disponibile.
        try {
            const files = fs.readdirSync('/boot');
            const found = files.find(file => file.startsWith('vmlinux-'));
            if (found) {
                return path.join('/boot', found);
            }
        } catch (error) {
            console.error("Errore leggendo /boot:", error);
        }

        // 3. Fallback su vmlinuz (se usassero kernel compressi)
        const riscvZPath = `/boot/vmlinuz-${kernelVersion}`
        if (fs.existsSync(riscvZPath)) {
            return riscvZPath;
        }
    }

    // --- STANDARD ARCHITECTURES (x86, ARM) ---
    const standardPath = `/boot/vmlinuz-${kernelVersion}`
    if (fs.existsSync(standardPath)) {
      return standardPath;
    }

    // Arch Linux specifics
    let archPath = ''
    if (kernelVersion.includes("-lts")) archPath = `/boot/vmlinuz-linux-lts`
    else if (kernelVersion.includes("-zen")) archPath = `/boot/vmlinuz-linux-zen`
    else if (kernelVersion.includes("-hardened")) archPath = `/boot/vmlinuz-linux-hardened`
    else if (kernelVersion.includes("-arch")) archPath = `/boot/vmlinuz-linux`

    if (archPath && fs.existsSync(archPath)) return archPath
    return ''
  }
}