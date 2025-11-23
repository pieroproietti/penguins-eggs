/**
 * ./src/appimage/dependency-manager.ts
 * penguins-eggs v.25.11.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import Distro from '../classes/distro.js'
import Diversions from '../classes/diversions.js';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const ALPINE_PACKAGES = [
  'alp-conf', 'apk-tools', 'bash', 'cryptsetup', 'curl', 'dosfstools',
  'e2fsprogs', 'efibootmgr', 'findutils', 'git', 'grub', 'grub-efi',
  'isolinux', 'jq', 'linux-firmware', 'lvm2', 'mtools', 'ncurses',
  'nodejs', 'openssl', 'parted', 'procps', 'py3-setuptools', 'rsync',
  'sfdisk', 'shadow', 'squashfs-tools', 'syslinux', 'tar', 'xorriso',
  'xz', 'zstd'
].join(' ');

const META_PACKAGE_NAME = 'penguins-eggs-deps';
const ALPINE_VIRTUAL_PKG = '.penguins-eggs-deps'; // Nota il punto iniziale

export class DependencyManager {
  private appRoot: string
  private distro: Distro
  familyId: string

  
  constructor() {
    if (process.env.APPDIR) {
      this.appRoot = path.join(process.env.APPDIR, 'drivers');
    } else {
      this.appRoot = '/'
    }

    this.distro = new Distro()
    this.familyId = this.distro.familyId
    if (this.distro.familyId === 'archlinux' && Diversions.isManjaroBased(this.distro.distroLike)) {
      this.familyId = 'manjaro'
    }

  }

  /**
   * Reinstalla i driver: Rimuove e poi Installa.
   * Utile per forzare un aggiornamento delle dipendenze o riparare un'installazione.
   */
  public reinstallDrivers(): boolean {

    console.log(`[eggs] Reinstallazione driver per: ${this.familyId}...`);
    // Tentiamo la rimozione (ignoriamo errori se non era installato)
    try {
      this.removeDrivers();
    } catch (e) {
      console.log(`[eggs] Nessuna versione precedente trovata o rimozione non necessaria.`);
    }
    // Procediamo con l'installazione pulita
    return this.installDrivers();
  }

  /**
   * Rimuove i driver (meta-pacchetti) e pulisce le dipendenze.
   * @param familyId L'ID della famiglia distro
   */
  public removeDrivers(): boolean {
    console.log(`[eggs] Rimozione driver per: ${this.familyId}...`);

    try {
      switch (this.familyId) {
        // ==========================================
        // ALPINE LINUX
        // ==========================================
        case 'alpine':
          console.log('[eggs] Rimozione dipendenze Alpine...');
          execSync(`apk del ${ALPINE_VIRTUAL_PKG}`, { stdio: 'inherit' });
          return true;

        // ==========================================
        // ARCHLINUX / MANJARO
        // ==========================================
        case 'archlinux':
        case 'manjaro':
          console.log(`[eggs] Rimozione pacchetto ${META_PACKAGE_NAME} (Arch/Manjaro)...`);
          // -Rns: Rimuove pacchetto, configurazioni e dipendenze non usate da altri
          execSync(`pacman -Rns --noconfirm ${META_PACKAGE_NAME}`, { stdio: 'inherit' });
          return true;

        // ==========================================
        // DEBIAN / UBUNTU FAMILY
        // ==========================================
        case 'debian':
          console.log(`[eggs] Rimozione pacchetto ${META_PACKAGE_NAME} (Debian)...`);
          // Purge rimuove anche i file di configurazione
          // autoremove pulisce le dipendenze installate dal meta-pacchetto
          execSync(`apt-get purge -y ${META_PACKAGE_NAME} && apt-get autoremove -y`, { stdio: 'inherit' });
          return true;

        // ==========================================
        // RPM FAMILY (EL9 / FEDORA / OPENSUSE)
        // ==========================================
        case 'el9':
        case 'fedora':
          console.log(`[eggs] Rimozione pacchetto ${META_PACKAGE_NAME} (RPM/DNF)...`);
          execSync(`dnf remove -y ${META_PACKAGE_NAME}`, { stdio: 'inherit' });
          return true;

        case 'opensuse':
          console.log(`[eggs] Rimozione pacchetto ${META_PACKAGE_NAME} (Zypper)...`);
          // -u (--clean-deps) rimuove anche le dipendenze non più necessarie
          execSync(`zypper rm -y -u ${META_PACKAGE_NAME}`, { stdio: 'inherit' });
          return true;

        default:
          console.warn(`[eggs] Rimozione non supportata automaticamente per '${this.familyId}'.`);
          return false;
      }

    } catch (error: any) {
      // Spesso la rimozione fallisce semplicemente perché il pacchetto non c'è.
      // Logghiamo warning invece di errore fatale.
      console.warn(`[eggs] Warning rimozione: ${error.message}`);
      return false;
    }
  }

  /**
   * Installa i driver (meta-pacchetti) corretti in base alla distribuzione.
   * * @param distroId L'ID della distro (es. 'manjaro', 'fedora', 'ubuntu')
   * @param appRootPath La root dell'applicazione dove si trova la cartella 'appimage-deps'
   */
  public installDrivers(): boolean {
    const depsBase = this.appRoot

    try {
      switch (this.familyId) {

        // ==========================================
        // ALPINE LINUX (Nativo)
        // ==========================================
        case 'alpine': {
          console.log('[eggs] Configurazione dipendenze Alpine (Virtual Package)...');
          // --virtual crea un pacchetto fittizio rimuovibile che raggruppa le dipendenze
          execSync(`apk add --no-cache --virtual ${ALPINE_VIRTUAL_PKG} ${ALPINE_PACKAGES}`, { stdio: 'inherit' });
          return true;
        }

        // ==========================================
        // ARCHLINUX
        // ==========================================
        case 'archlinux': {
          const archFile = findPackage(path.join(depsBase, 'arch'), '.zst');
          if (archFile) {
            console.log(`[eggs] Installazione Arch Meta-Package: ${path.basename(archFile)}`);
            execSync(`pacman -Sy --noconfirm && pacman -U --noconfirm "${archFile}"`, { stdio: 'inherit' });
            return true;
          }
          break;
        }

        
        // ==========================================
        // DEBIAN / UBUNTU FAMILY
        // ==========================================
        case 'debian': {
          const debFile = findPackage(path.join(depsBase, 'debian'), '.deb');
          if (debFile) {
            console.log(`[eggs] Installazione Debian Meta-Package: ${path.basename(debFile)}`);
            
            // Gestione sicura per l'utente _apt copiando in /tmp
            const tempDebPath = path.join('/tmp', path.basename(debFile));
            try {
                fs.copyFileSync(debFile, tempDebPath);
                execSync(`apt-get update && apt-get install -y "${tempDebPath}"`, { stdio: 'inherit' });
            } finally {
                // Assicuriamoci di pulire il file temporaneo anche in caso di errore
                if (fs.existsSync(tempDebPath)) {
                    fs.unlinkSync(tempDebPath);
                }
            }
            return true;
          }
          break;
        }

        // ==========================================
        // RHEL / CENTOS / ALMA (RPM Family)
        // ==========================================
        case 'el9': {
          // Cerca file contenente 'el9'
          const elFile = findPackage(path.join(depsBase, 'rpm'), '.rpm', 'el9');
          if (elFile) { 
            console.log(`[eggs] Installazione EL9 Meta-Package: ${path.basename(elFile)}`);
            execSync(`dnf install -y "${elFile}"`, { stdio: 'inherit' });
            return true;
          }
          break;
        }


        // ==========================================
        // FEDORA (RPM Family)
        // ==========================================
        case 'fedora': {
          // Cerca file contenente 'fc42' o 'fc' dentro la cartella rpm
          const fedoraFile = findPackage(path.join(depsBase, 'rpm'), '.rpm', 'fc42');
          if (fedoraFile) { 
            console.log(`[eggs] Installazione Fedora Meta-Package: ${path.basename(fedoraFile)}`);
            execSync(`dnf install -y "${fedoraFile}"`, { stdio: 'inherit' });
            return true;
          }
          break;
        }


        // ==========================================
        // MANJARO (Variant: manjaro-tools-iso)
        // ==========================================
        case 'manjaro': {
          const manjaroFile = findPackage(path.join(depsBase, 'manjaro'), '.zst');
          if (manjaroFile) {
            console.log(`[eggs] Installazione Manjaro Meta-Package: ${path.basename(manjaroFile)}`);
            execSync(`pacman -Sy --noconfirm && pacman -U --noconfirm "${manjaroFile}"`, { stdio: 'inherit' });
            return true;
          }
          break;
        }


        // ==========================================
        // OPENSUSE (RPM Family)
        // ==========================================
        case 'opensuse': {
          const suseFile = findPackage(path.join(depsBase, 'rpm'), '.rpm', 'opensuse');
          if (suseFile) {
             console.log(`[eggs] Installazione openSUSE Meta-Package: ${path.basename(suseFile)}`);
             // --allow-unsigned-rpm è necessario perché i nostri pacchetti non sono firmati con GPG
             execSync(`zypper install -y --allow-unsigned-rpm "${suseFile}"`, { stdio: 'inherit' });
             return true;
          }
          break;
        }

        default:
          console.warn(`[eggs] Distribuzione '${this.familyId}' non supportata dai meta-pacchetti automatici.`);
          return false;
      }

    } catch (error: any) {
      console.error(`[eggs] ERRORE FATALE installazione dipendenze: ${error.message}`);
      // Rilanciamo l'errore per permettere al chiamante di decidere se uscire o continuare
      throw error;
    }

    // Se siamo qui, non è stato trovato il file specifico
    console.warn(`[eggs] Nessun meta-pacchetto trovato per ${this.familyId} in ${depsBase}`);
    return false;
  }

}


  /**
   * Cerca un file pacchetto in una directory specifica.
   * @param dir Directory in cui cercare (es. .../appimage-deps/rpm)
   * @param ext Estensione del file (es. '.rpm')
   * @param pattern Stringa opzionale che deve essere inclusa nel nome (es. 'el9')
   */
  function findPackage(dir: string, ext: string, pattern: string = ''): string | null {
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
