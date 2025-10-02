import { exec } from 'child_process';
import { promisify } from 'util';
import { access } from 'fs/promises';

const execAsync = promisify(exec);

export async function initcpio(): Promise<string> {
  try {
    // Ottieni la versione del kernel
    const { stdout: kernelVersion } = await execAsync('uname -r');
    const version = kernelVersion.trim();
    
    const manjaroPreset = `/etc/mkinitcpio.d/${version}.preset`
    try {
      await access(manjaroPreset)
      return manjaroPreset
    } catch {
      // Non esiste, prova con Arch
    }
    
    // Determina il tipo di kernel da uname -r
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
    await access(archPreset)
    return archPreset
    
  } catch (error) {
    throw new Error(`Impossibile determinare il path di vmlinuz: ${error}`);
  }
}
