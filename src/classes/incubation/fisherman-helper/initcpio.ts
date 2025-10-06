import { exec } from 'child_process';
import { promisify } from 'util';
import { access } from 'fs/promises';

const execAsync = promisify(exec);

export async function initcpio(): Promise<string> {
  try {
    const { stdout: kernelVersion } = await execAsync('uname -r');
    const version = kernelVersion.trim();

    // Manjaro
    if (version.includes('MANJARO')) {
      try {
        // Estrai major e minor version. Es: da "6.12.48-1-MANJARO" -> ["6", "12", "48-1-MANJARO"]
        const parts = version.split('.');
        // Costruisci il nome del preset come "linux" + "6" + "12" -> "linux612"
        const kernelName = `linux${parts[0]}${parts[1]}`;
        const manjaroPreset = `/etc/mkinitcpio.d/${kernelName}.preset`;

        await access(manjaroPreset); // Verifica se esiste /etc/mkinitcpio.d/linux612.preset
        return manjaroPreset; // Se esiste, lo restituisce e la funzione termina
      } catch {
        // Se anche questa logica fallisce, lascia che proceda al fallback per Arch
        // console.warn('Logica Manjaro fallita, si tenta il fallback per Arch...');
      }
    } else if (version.includes('cachyos')) {
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
        // Se anche questa logica fallisce, lascia che proceda al fallback per Arch
        // console.warn('Logica Manjaro fallita, si tenta il fallback per Arch...');
      }
    }

    /**
     * FALLBACK ARCH
     */

    // Determina il tipo di kernel
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

  } catch (error) {
    // Rimuoviamo l'errore originale dalla stringa per un messaggio più pulito
    throw new Error(`Impossibile trovare un file .preset valido in /etc/mkinitcpio.d/`);
  }
}