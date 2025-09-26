/**
 * penguins-eggs
 * 
 * Kernel management utilities
 * Handle vmlinuz and initramfs detection across different distributions
 */

import fs from 'node:fs'
import path from 'path'
import Distro from '../distro.js'
import Utils from '../utils.js'
import { execSync } from 'node:child_process'


/**
 * Kernel utilities for managing vmlinuz and initramfs paths
 */
export default class Kernel {
  /**
   * Ricava path per vmlinuz
   * 
   * @returns Path al file vmlinuz
   */
  static vmlinuz(kernel = ''): string {
    let vmlinuz = ''

    if (!Utils.isContainer()) {
      vmlinuz = this.vmlinuzFromUname()

      if (vmlinuz === '') {
        vmlinuz = this.vmlinuzFromCmdline()
        if (vmlinuz === '') {
          console.log('vmlinuz not found')
          process.exit(1)
        }
      }
    } else {
      Utils.warning("cannot work on containers actually!")
      process.exit(1)
    }

    if (!fs.existsSync(vmlinuz)) {
      console.log(`vmlinuz: ${vmlinuz} does not exist!`)
      process.exit(1)
    }
    return vmlinuz
  }


  /**
   * cerca il path per initramfs/initrd nella directory /boot 
   * se fallisce, prova la convenzione Arch
   *
   * @param kernel - Versione del kernel (es. '6.5.0-14-generic'). Se omessa, usa il kernel in esecuzione.
   * @returns Path al file initramfs.
   */
  static initramfs(kernel = ''): string {
    let targetKernel = kernel

    // 1. Determina la versione del kernel target
    if (targetKernel === '') {
      if (Utils.isContainer()) {
        Utils.warning("Non è possibile determinare il kernel in un container.")
        process.exit(1)
      }
      targetKernel = execSync('uname -r').toString().trim()
    }
    const kernelVersionShort = targetKernel.split('.').slice(0, 2).join('.');

    const bootDir = '/boot';

    // 2. Leggi tutti i file nella directory /boot
    let bootFiles: string[];
    try {
      bootFiles = fs.readdirSync(bootDir);
    } catch (error) {
      console.error(`ERRORE: Impossibile leggere la directory ${bootDir}.`);
      process.exit(1);
    }

    // 3. Cerca il file corrispondente con un sistema di priorità
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


    // Se troviamo almeno un candidato, usiamo quello
    if (candidates.length > 0) {
      let foundPath = path.join(bootDir, candidates[0])

      /**
       * ma, se sono più di uno, usiamo il più breve 
       * per evitare estensioni come -fallback.img, .old, .bak, etc
       */
      if (candidates.length > 1) {
        // Filtra i candidati per escludere quelli di fallback se esiste un'alternativa
        const nonFallbackCandidates = candidates.filter(c => !c.includes('-fallback'));
        const searchArray = nonFallbackCandidates.length > 0 ? nonFallbackCandidates : candidates;

        foundPath = path.join(bootDir, searchArray[0]); // Inizia con il primo
        for (const candidate of searchArray) {
          const current = path.join(bootDir, candidate)
          if (current.length < foundPath.length) {
            foundPath = current
          }
        }
      }
      return foundPath;
    }


    // 4. Fallback per casi specifici (Arch e Alpine Linux)
    // Questo viene eseguito solo se la ricerca dinamica fallisce.
    const staticFallbacks = [
      // --- Alpine Linux ---
      'initramfs-lts',        // Kernel Long-Term Support
      'initramfs-virt',       // Kernel per ambienti virtualizzati
      'initramfs-standard',   // Kernel standard (meno comune)
      'initramfs-rpi',        // Kernel per Raspberry Pi
      // --- Arch Linux ---
      'initramfs-linux.img',          // Arch Linux standard
      'initramfs-linux-lts.img',      // Arch Linux LTS
      'initramfs-linux-zen.img',      // Arch Linux Zen
      'initramfs-linux-hardened.img', // Arch Linux hardened
    ];


    for (const fallback of staticFallbacks) {
      const fallbackPath = path.join(bootDir, fallback);
      if (fs.existsSync(fallbackPath)) {
        // Nota: questo potrebbe non corrispondere al 100% al kernel in esecuzione,
        // ma è il comportamento atteso su questi sistemi
        return fallbackPath;
      }
    }


    // 5. Se nessuna delle strategie ha funzionato, esci con errore
    Utils.warning(`Could not find an initramfs file for kernel ${targetKernel} in ${bootDir}.`)
    process.exit(1);
  }


  /**
   * ALL PRIVATE
   */


  /**
   * most of the distros:
   * debian, fedora, opensuse, rasberry
   */
  private static vmlinuzFromUname(): string {
    const kernelVersion = execSync('uname -r').toString().trim();

    // Try 1: path standard (es. Debian, Ubuntu, Fedora)
    let standardPath = `/boot/vmlinuz-${kernelVersion}`;
    if (fs.existsSync(standardPath)) {
      return standardPath;
    }

    // Try 2: Arch Linux
    let archPath = ''
    if (kernelVersion.includes("-lts")) {
      archPath = `/boot/vmlinuz-linux-lts`
    } else if (kernelVersion.includes("-zen")) {
      archPath = `/boot/vmlinuz-linux-zen`
    } else if (kernelVersion.includes("-hardened")) {
      archPath = `/boot/vmlinuz-linux-hardened`
    } else if (kernelVersion.includes("-arch")) {
      archPath = `/boot/vmlinuz-linux`
    }

    // Se abbiamo trovato un percorso per Arch e il file esiste, lo ritorniamo
    if (archPath && fs.existsSync(archPath)) {
      return archPath;
    }

    // Fallback: se nessun file è stato trovato, lancia un errore.
    // Questo garantisce che la funzione non ritorni mai 'undefined'.
    throw new Error(`Impossibile trovare un file vmlinuz valido per il kernel: ${kernelVersion}`);
  }

  /**
   * vmlinuxFromCmdline
   * raspberry /proc/cmdline dont contain it
   */
  private static vmlinuzFromCmdline() {
    let distro = new Distro()
    let vmlinuz = ''

    const cmdline = fs.readFileSync('/proc/cmdline', 'utf8').split(" ")

    cmdline.forEach(cmd => {
      if (cmd.includes('BOOT_IMAGE')) {
        vmlinuz = cmd.substring(cmd.indexOf('=') + 1)

        // patch per fedora BOOT_IMAGE=(hd0,gpt2)/vmlinuz-6.9.9-200.fc40.x86_64
        if (vmlinuz.includes(")")) {
          vmlinuz = cmd.substring(cmd.indexOf(')') + 1)
        }
        if (!fs.existsSync(vmlinuz)) {
          if (fs.existsSync(`/boot/${vmlinuz}`)) {
            vmlinuz = `/boot/${vmlinuz}`
          }
        }
      }
    })
    // btrfs: eg: /@root/boot/vmlinuz
    if (vmlinuz.includes('@')) {
      let subvolumeEnd = vmlinuz.indexOf('/', vmlinuz.indexOf('@'))
      vmlinuz = vmlinuz.substring(subvolumeEnd)
    }


    /**
     * Take always /boot/vmlinuz if exists
     */
    if (path.dirname(vmlinuz) === '/') {
      if (fs.existsSync(`/boot${vmlinuz}`)) {
        vmlinuz = `/boot${vmlinuz}`
      }
    }
    return vmlinuz
  }
}