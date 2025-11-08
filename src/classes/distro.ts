/**
 * penguins-eggs
 * class: distro.ts
 * author: Piero Proietti (modified by Hossein Seilani)
 * license: MIT
 *
 * FINAL VERSION WITH EXPLAINED COMMENTS AND NEW CHANGE TAGS
 */

import yaml from 'js-yaml';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import shell from 'shelljs';

import { IDistro } from '../interfaces/index.js';
import Utils from './utils.js';
import Diversions from './diversions.js';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

interface IDistros {
  distroLike: string;
  family: string;
  id: string; // codenameId
  ids: string[];
}

class Distro implements IDistro {
  // NEW CHANGE 1: Added default values for all main distro properties to ensure proper initialization.
  // This prevents undefined values in later logic and standardizes URLs and paths.
  bugReportUrl: string = 'https://github.com-pieroproietti/penguins-eggs/issue';
  codenameId: string = '';
  distroUniqueId: string = '';
  distroId: string = '';
  distroLike: string = '';
  familyId: string = 'debian';
  homeUrl: string = 'https://penguins-eggs.net';
  isCalamaresAvailable: boolean = true;
  liveMediumPath: string = '/run/lcd ive/medium/';
  releaseId: string = '';
  squashfs: string = 'live/filesystem.squashfs';
  supportUrl: string = 'https://penguins-eggs.net';
  syslinuxPath: string = path.resolve(__dirname, `../../syslinux`);
  usrLibPath: string = '/usr/lib';

  constructor() {
    // NEW CHANGE2: Initialize OS info using Utils.getOsRelease()
    // This ensures the distroId, codenameId, and releaseId are set early for proper logic.
    const osInfo = Utils.getOsRelease();
    this.distroId = osInfo.ID;
    this.codenameId = osInfo.VERSION_CODENAME;
    this.releaseId = osInfo.VERSION_ID;

    // NEW CHANGE3: Normalize special distro names to handle edge cases like Debian sid
    // or custom Biglinux/Bigcommunity derivatives to maintain consistency.
    if (this.distroId === 'Debian' && this.codenameId === 'sid') this.codenameId = 'trixie';
    if (this.distroId.includes('Biglinux')) this.distroId = 'Biglinux';
    if (this.distroId.includes('Bigcommunity')) this.distroId = 'Bigcommunity';

    // NEW CHANGE4: Modularize distro configuration for better readability and maintenance
    this.configureDistro();
    this.applyFamilySpecificPaths();

    // NEW CHANGE5: Load URLs from /etc/os-release to override defaults if available
    this.loadOSReleaseUrls();
  }

  /**
   * NEW CHANGE6: Modular configuration for main distro types like Alpine, Fedora-family, etc.
   * This simplifies the constructor and keeps distro-specific logic isolated.
   */
  private configureDistro() {
    // NEW CHANGE7: Handle Alpine specific paths and properties
    if (this.distroId === 'Alpine') {
      this.familyId = 'alpine';
      this.distroLike = 'Alpine';
      this.codenameId = 'rolling';
      this.distroUniqueId = this.familyId;
      this.liveMediumPath = '/mnt/';
      return;
    }

    /**
     * Arch 
     */
    if (this.codenameId === 'rolling' || this.codenameId === 'n/a') {
      this.familyId = 'archlinux'
      this.distroLike = 'Arch'
      this.codenameId = 'rolling'
      this.distroUniqueId = 'archlinux'
      this.liveMediumPath = '/run/archiso/bootmnt/'
      this.squashfs = `arch/x86_64/airootfs.sfs`
      return;
    }

    // NEW CHANGE8: Consolidated Fedora-family detection for multiple derivatives
    const fedoraDistros = ['Almalinux', 'Fedora', 'Nobara', 'Rhel', 'Rocky'];
    if (fedoraDistros.includes(this.distroId)) {
      this.familyId = 'fedora';
      this.distroLike = 'Fedora';
      this.codenameId = 'rolling';
      this.distroUniqueId = this.familyId;
      this.liveMediumPath = '/run/initramfs/live/';
      return;
    }

    // NEW CHANGE9: Openmamba specific properties
    if (this.distroId === 'Openmamba') {
      this.familyId = 'openmamba';
      this.distroLike = 'Openmamba';
      this.codenameId = 'rolling';
      this.distroUniqueId = this.familyId;
      this.liveMediumPath = '/run/initramfs/live/';
      return;
    }

    // NEW CHANGE10: OpenSUSE specific properties
    if (this.distroId.includes('Opensuse')) {
      this.familyId = 'opensuse';
      this.distroLike = 'Opensuse';
      this.codenameId = 'rolling';
      this.distroUniqueId = this.familyId;
      this.liveMediumPath = '/run/initramfs/live/';
      return;
    }

    // NEW CHANGE11: Handle Debian/Ubuntu/Devuan and their derivatives
    this.debianFamily();
  }

  /**
   * NEW CHANGE12: Map Debian, Ubuntu, Devuan codenames to proper IDs and paths
   * This avoids long if/else chains and allows easier future updates.
   */
  private debianFamily() {
    const mapping: Record<string, { distroLike: string; uniqueId: string; livePath?: string; calamares?: boolean }> = {
      jessie: { distroLike: 'Debian', uniqueId: 'jessie', livePath: '/lib/live/mount/medium/', calamares: false },
      stretch: { distroLike: 'Debian', uniqueId: 'stretch', livePath: '/lib/live/mount/medium/', calamares: false },
      buster: { distroLike: 'Debian', uniqueId: 'buster' },
      bullseye: { distroLike: 'Debian', uniqueId: 'bullseye' },
      bookworm: { distroLike: 'Debian', uniqueId: 'bookworm' },
      trixie: { distroLike: 'Debian', uniqueId: 'trixie' },
      forky: { distroLike: 'Debian', uniqueId: 'forky' },
      beowulf: { distroLike: 'Devuan', uniqueId: 'beowulf' },
      chimaera: { distroLike: 'Devuan', uniqueId: 'chimaera' },
      daedalus: { distroLike: 'Devuan', uniqueId: 'daedalus' },
      excalibur: { distroLike: 'Devuan', uniqueId: 'excalibur' },
      bionic: { distroLike: 'Ubuntu', uniqueId: 'bionic', livePath: '/lib/live/mount/medium/' },
      focal: { distroLike: 'Ubuntu', uniqueId: 'focal' },
      jammy: { distroLike: 'Ubuntu', uniqueId: 'jammy' },
      noble: { distroLike: 'Ubuntu', uniqueId: 'noble' },
      questing: { distroLike: 'Ubuntu', uniqueId: 'questing' },
      devel: { distroLike: 'Ubuntu', uniqueId: 'devel' },
    };

    // NEW CHANGE13: Apply mapping if codename exists
    const cfg = mapping[this.codenameId];
    if (cfg) {
      this.familyId = "debian"
      this.distroLike = cfg.distroLike;
      this.distroUniqueId = cfg.uniqueId;
      if (cfg.livePath !== undefined) this.liveMediumPath = cfg.livePath;
      if (cfg.calamares !== undefined) this.isCalamaresAvailable = cfg.calamares;
      return;
    }

    // NEW CHANGE14: Detect derivatives if not in mapping
    this.detectDerivatives();
  }

  /**
   * NEW CHANGE15: Async derivative detection from YAML files
   * This allows future-proofing and easy updates for new distros.
   */
  private async detectDerivatives() {
    const derivativeFiles = [
      '/etc/penguins-eggs.d/derivatives.yaml',
      path.resolve(__dirname, '../../conf/derivatives.yaml')
    ];

    let found = false;

    for (const file of derivativeFiles) {
      if (fsSync.existsSync(file)) {
        const content = await fs.readFile(file, 'utf8');
        const distros = yaml.load(content) as IDistros[];
        for (const distro of distros) {
          if (distro.ids?.includes(this.codenameId)) {
            this.distroLike = distro.distroLike;
            this.distroUniqueId = distro.id;
            this.familyId = distro.family;
            found = true;
            break;
          }
        }
        if (found) break;
      }
    }

    if (!found) {
      const fedoraFiles = [
        '/etc/penguins-eggs.d/derivatives_fedora.yaml',
        path.resolve(__dirname, '../../conf/derivatives_fedora.yaml')
      ];

      for (const file of fedoraFiles) {
        if (fsSync.existsSync(file)) {
          const content = await fs.readFile(file, 'utf8');
          const elem = yaml.load(content) as string[];
          if (elem.includes(this.distroId)) {
            this.familyId = 'fedora';
            this.distroLike = 'Fedora';
            this.codenameId = 'rolling';
            this.distroUniqueId = this.familyId;
            this.liveMediumPath = '/run/initramfs/live/';
            found = true;
            break;
          }
        }
      }
    }

    if (!found) {
      console.warn(`This distro ${this.distroId}/${this.codenameId} is not yet recognized!`);
      console.warn('Edit derivatives.yaml and run: sudo eggs dad -d to re-configure.');
      process.exit(0);
    }
  }

  /**
   * NEW CHANGE16: Apply family-specific paths for usrLibPath, squashfs, and liveMediumPath
   * Handles Debian, openSUSE, Manjaro and derivatives consistently.
   */
  private applyFamilySpecificPaths() {
    if (this.familyId === 'archlinux') {
      if (Diversions.isManjaroBased(this.distroId)) {
        this.liveMediumPath = '/run/miso/bootmnt/';
        this.squashfs = 'manjaro/x86_64/livefs.sfs';
        this.codenameId = shell.exec('lsb_release -cs', { silent: true }).stdout.toString().trim();
        this.distroUniqueId = 'manjaro';
      }
    } else if (this.familyId === 'debian') {
      this.usrLibPath = '/usr/lib/' + Utils.usrLibPath();
    } else if (this.familyId === 'opensuse') {
      this.usrLibPath = '/usr/lib64/';
    }
  }

  /**
   * NEW CHANGE17: Load custom HOME, SUPPORT, BUG_REPORT URLs from /etc/os-release
   * Allows overrides of default URLs for user-friendly experience.
   */
  private loadOSReleaseUrls() {
    const os_release = '/etc/os-release';
    if (!fsSync.existsSync(os_release)) return;

    const data = fsSync.readFileSync(os_release, 'utf8');
    const lines = data.split('\n');

    for (const line of lines) {
      if (line.startsWith('HOME_URL=')) this.homeUrl = line.slice('HOME_URL='.length).replace(/"/g, '');
      if (line.startsWith('SUPPORT_URL=')) this.supportUrl = line.slice('SUPPORT_URL='.length).replace(/"/g, '');
      if (line.startsWith('BUG_REPORT_URL=')) this.bugReportUrl = line.slice('BUG_REPORT_URL='.length).replace(/"/g, '');
    }
  }
}

export default Distro;
