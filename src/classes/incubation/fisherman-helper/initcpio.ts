import { access } from 'fs/promises';

/**
 * ./src/classes/incubation/fisherman-helper/initcpio.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
import { exec } from '../../../lib/utils.js'

/**
 * Cerca il file .preset per mkinitcpio appropriato per il kernel corrente.
 * @returns Il percorso del file .preset trovato.
 * @throws {Error} Se non è possibile trovare un file .preset valido.
 */
export async function initcpio(): Promise<string> {
  try {
    const kernelVersion = (await exec('uname -r', { capture: true })).data
    const version = kernelVersion.trim();

    // Logica Manjaro
    if (version.includes('MANJARO')) {
      try {
        const parts = version.split('.');
        const kernelName = `linux${parts[0]}${parts[1]}`;

        // Tentativo 1: Major/Minor (es. /etc/mkinitcpio.d/linux61.preset)
        const manjaroPreset = `/etc/mkinitcpio.d/${kernelName}.preset`;
        await access(manjaroPreset);
        return manjaroPreset;

      } catch {
        try {
          const parts = version.split('.');
          const kernelName = `linux${parts[0]}${parts[1]}`;
          // Tentativo 2: Major/Minor con Architettura (es. /etc/mkinitcpio.d/linux61-x86_64.preset)
          const manjaroPresetArch = `/etc/mkinitcpio.d/${kernelName}-x86_64.preset`;
          await access(manjaroPresetArch);
          return manjaroPresetArch;

        } catch {
          // Fallito, si procede al FALLBACK ARCH
        }
      }
    } else if (version.includes('cachyos')) {
      // Logica CachyOS
      try {
        let kernelType = 'linux-cachyos'; // default
        if (version.includes('lts')) {
          kernelType = 'linux-cachyos-lts';
        } else if (version.includes('zen')) {
          kernelType = 'linux-cachyos-zen';
        } else if (version.includes('hardened')) {
          kernelType = 'linux-hardened';
        }

        const cachyPreset = `/etc/mkinitcpio.d/${kernelType}.preset`
        await access(cachyPreset);
        return cachyPreset;
      } catch {
        // Fallito, si procede al fallback Arch
      }
    }

    // FALLBACK ARCH
    let kernelType = 'linux'; // default

    if (version.includes('lts')) {
      kernelType = 'linux-lts';
    } else if (version.includes('zen')) {
      kernelType = 'linux-zen';
    } else if (version.includes('hardened')) {
      kernelType = 'linux-hardened';
    }

    const archPreset = `/etc/mkinitcpio.d/${kernelType}.preset`;

    // Verifica che esista
    await access(archPreset);
    return archPreset;

  } catch {
    // Lancia un errore se tutti i tentativi falliscono.
    throw new Error(`Impossibile trovare un file .preset valido in /etc/mkinitcpio.d/.`);
  }
}