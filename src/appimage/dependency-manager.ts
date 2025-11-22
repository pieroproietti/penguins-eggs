import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Lista dei pacchetti per Alpine Linux.
 * Alpine gestisce i "World Sets" (pacchetti virtuali) nativamente, 
 * quindi non usiamo file esterni ma questa lista.
 */
const ALPINE_PACKAGES = [
  'alp-conf', 'apk-tools', 'bash', 'cryptsetup', 'curl', 'dosfstools',
  'e2fsprogs', 'efibootmgr', 'findutils', 'git', 'grub', 'grub-efi',
  'isolinux', 'jq', 'linux-firmware', 'lvm2', 'mtools', 'ncurses',
  'nodejs', 'openssl', 'parted', 'procps', 'py3-setuptools', 'rsync',
  'sfdisk', 'shadow', 'squashfs-tools', 'syslinux', 'tar', 'xorriso',
  'xz', 'zstd'
].join(' ');

export class DependencyManager {

  /**
   * Cerca un file pacchetto in una directory specifica.
   * @param dir Directory in cui cercare (es. .../appimage-deps/rpm)
   * @param ext Estensione del file (es. '.rpm')
   * @param pattern Stringa opzionale che deve essere inclusa nel nome (es. 'el9')
   */
  private static findPackage(dir: string, ext: string, pattern: string = ''): string | null {
    try {
      if (!fs.existsSync(dir)) {
        console.warn(`[DependencyManager] Directory non trovata: ${dir}`);
        return null;
      }
      
      const files = fs.readdirSync(dir);
      const found = files.find(file => file.endsWith(ext) && file.includes(pattern));
      
      return found ? path.join(dir, found) : null;
    } catch (error) {
      console.error(`[DependencyManager] Errore leggendo la directory ${dir}`, error);
      return null;
    }
  }

  /**
   * Installa i driver (meta-pacchetti) corretti in base alla distribuzione.
   * @param distroId L'ID della distro (es. 'manjaro', 'fedora', 'ubuntu')
   * @param appRootPath La root dell'applicazione dove si trova la cartella 'appimage-deps'
   */
  public static installDrivers(distroId: string, appRootPath: string): boolean {
    const depsBase = path.join(appRootPath, 'appimage-deps');
    const normalizedDistro = distroId.toLowerCase();

    console.log(`[eggs] Verifica driver per distro: ${normalizedDistro}`);
    console.log(`[eggs] Percorso base dipendenze: ${depsBase}`);

    try {
      switch (normalizedDistro) {
        
        // ==========================================
        // DEBIAN / UBUNTU FAMILY
        // ==========================================
        case 'debian': {
          const debFile = this.findPackage(path.join(depsBase, 'debian'), '.deb');
          if (debFile) {
            console.log(`[eggs] Installazione Debian Meta-Package: ${path.basename(debFile)}`);
            // Usiamo apt-get install ./file.deb perché risolve le dipendenze automaticamente
            execSync(`apt-get update && apt-get install -y "${debFile}"`, { stdio: 'inherit' });
            return true;
          }
          break;
        }

        // ==========================================
        // ARCH LINUX (Variant: mkinitcpio-archiso)
        // ==========================================
        case 'archlinux': {
          const archFile = this.findPackage(path.join(depsBase, 'arch'), '.zst');
          if (archFile) {
            console.log(`[eggs] Installazione Arch Meta-Package: ${path.basename(archFile)}`);
            execSync(`pacman -Sy --noconfirm && pacman -U --noconfirm "${archFile}"`, { stdio: 'inherit' });
            return true;
          }
          break;
        }

        // ==========================================
        // MANJARO (Variant: manjaro-tools-iso)
        // ==========================================
        case 'manjaro': {
          const manjaroFile = this.findPackage(path.join(depsBase, 'manjaro'), '.zst');
          if (manjaroFile) {
            console.log(`[eggs] Installazione Manjaro Meta-Package: ${path.basename(manjaroFile)}`);
            execSync(`pacman -Sy --noconfirm && pacman -U --noconfirm "${manjaroFile}"`, { stdio: 'inherit' });
            return true;
          }
          break;
        }

        // ==========================================
        // FEDORA (RPM Family)
        // ==========================================
        case 'fedora': {
          // Cerca file contenente 'fc42' o 'fc' dentro la cartella rpm
          const fedoraFile = this.findPackage(path.join(depsBase, 'rpm'), '.rpm', 'fc42');
          if (fedoraFile) {
            console.log(`[eggs] Installazione Fedora Meta-Package: ${path.basename(fedoraFile)}`);
            execSync(`dnf install -y "${fedoraFile}"`, { stdio: 'inherit' });
            return true;
          }
          break;
        }

        // ==========================================
        // RHEL / CENTOS / ALMA (RPM Family)
        // ==========================================
        case 'el9': {
          // Cerca file contenente 'el9'
          const elFile = this.findPackage(path.join(depsBase, 'rpm'), '.rpm', 'el9');
          if (elFile) {
            console.log(`[eggs] Installazione EL9 Meta-Package: ${path.basename(elFile)}`);
            execSync(`dnf install -y "${elFile}"`, { stdio: 'inherit' });
            return true;
          }
          break;
        }

        // ==========================================
        // OPENSUSE (RPM Family)
        // ==========================================
        case 'opensuse' {
          const suseFile = this.findPackage(path.join(depsBase, 'rpm'), '.rpm', 'opensuse');
          if (suseFile) {
             console.log(`[eggs] Installazione openSUSE Meta-Package: ${path.basename(suseFile)}`);
             // --allow-unsigned-rpm è necessario perché i nostri pacchetti non sono firmati con GPG
             execSync(`zypper install -y --allow-unsigned-rpm "${suseFile}"`, { stdio: 'inherit' });
             return true;
          }
          break;
        }

        // ==========================================
        // ALPINE LINUX (Nativo)
        // ==========================================
        case 'alpine': {
          console.log('[eggs] Configurazione dipendenze Alpine (Virtual Package)...');
          // --virtual crea un pacchetto fittizio rimuovibile che raggruppa le dipendenze
          execSync(`apk add --no-cache --virtual .penguins-eggs-deps ${ALPINE_PACKAGES}`, { stdio: 'inherit' });
          return true;
        }

        default:
          console.warn(`[eggs] Distribuzione '${distroId}' non supportata dai meta-pacchetti automatici.`);
          return false;
      }

    } catch (error: any) {
      console.error(`[eggs] ERRORE FATALE installazione dipendenze: ${error.message}`);
      // Rilanciamo l'errore per permettere al chiamante di decidere se uscire o continuare
      throw error;
    }

    // Se siamo qui, non è stato trovato il file specifico
    console.warn(`[eggs] Nessun meta-pacchetto trovato per ${distroId} in ${depsBase}`);
    return false;
  }
}