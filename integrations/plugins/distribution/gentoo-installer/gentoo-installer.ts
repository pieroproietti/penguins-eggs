/**
 * plugins/distribution/gentoo-installer/gentoo-installer.ts
 *
 * Gentoo Linux installer integration for eggs-produced Gentoo ISOs.
 *
 * Adapted from jeremypass96/gentoo-installer
 * (https://github.com/jeremypass96/gentoo-installer), a dialog-driven
 * interactive Gentoo installer covering:
 *   - Disk partitioning (GPT/MBR, ext4/Btrfs/XFS)
 *   - Stage3 download and extraction
 *   - Portage tree sync
 *   - Kernel installation (binary or source)
 *   - USE flag configuration
 *   - GPU detection (VIDEO_CARDS)
 *   - CPU optimization (-march, -mtune)
 *   - Desktop environment selection (KDE/Xfce/MATE/TDE)
 *   - Service enabling (NetworkManager, SDDM, etc.)
 *
 * This plugin provides:
 *   1. GentooInstaller class — programmatic installer API for embedding in
 *      eggs' krill/calamares installer pipeline
 *   2. Stage3 management — download, verify, and extract Stage3 tarballs
 *   3. make.conf generation — CPU/GPU-optimized Portage configuration
 *   4. Portage profile selection — desktop/server/hardened profiles
 */

import fs from 'node:fs'
import path from 'node:path'
import https from 'node:https'
import crypto from 'node:crypto'

type ExecFn = (cmd: string, opts?: { capture?: boolean; echo?: boolean }) => Promise<{
  code: number
  data: string
  error?: string
}>

export type GentooArch = 'amd64' | 'arm64' | 'x86' | 'ppc64' | 'riscv'
export type GentooProfile = 'default' | 'desktop' | 'desktop/gnome' | 'desktop/kde' | 'hardened' | 'musl'
export type GentooFilesystem = 'ext4' | 'btrfs' | 'xfs' | 'f2fs'
export type GentooDesktop = 'kde' | 'xfce' | 'mate' | 'gnome' | 'none'
export type GentooKernel = 'binary' | 'source' | 'genkernel'

export interface GentooInstallerConfig {
  /** Target architecture. Default: amd64. */
  arch?: GentooArch
  /** Portage profile. Default: default/linux/amd64/17.1/desktop. */
  profile?: GentooProfile
  /** Root filesystem type. Default: ext4. */
  filesystem?: GentooFilesystem
  /** Desktop environment. Default: none. */
  desktop?: GentooDesktop
  /** Kernel installation method. Default: binary. */
  kernel?: GentooKernel
  /** Mirror for Stage3 download. Default: https://distfiles.gentoo.org */
  mirror?: string
  /** Stage3 variant (e.g. 'openrc', 'systemd', 'hardened'). Default: openrc. */
  stage3Variant?: string
  /** Extra USE flags to add to make.conf. */
  useFlags?: string[]
  /** CPU architecture for -march (e.g. 'native', 'x86-64-v3'). Default: native. */
  cpuArch?: string
  /** Number of parallel make jobs. Default: nproc+1. */
  makeJobs?: number
  /** Timezone. Default: UTC. */
  timezone?: string
  /** Locale. Default: en_US.UTF-8. */
  locale?: string
}

export interface Stage3Info {
  url: string
  filename: string
  sha256: string
  size: number
}

export interface MakeConf {
  cflags: string
  cxxflags: string
  makeOpts: string
  useFlags: string
  videoCards: string
  inputDevices: string
  acceptKeywords: string
  features: string
}

const GENTOO_DISTFILES = 'https://distfiles.gentoo.org'

export class GentooInstaller {
  private exec: ExecFn
  private verbose: boolean
  private config: Required<GentooInstallerConfig>

  constructor(exec: ExecFn, verbose = false, config: GentooInstallerConfig = {}) {
    this.exec = exec
    this.verbose = verbose
    this.config = {
      arch: config.arch ?? 'amd64',
      profile: config.profile ?? 'desktop',
      filesystem: config.filesystem ?? 'ext4',
      desktop: config.desktop ?? 'none',
      kernel: config.kernel ?? 'binary',
      mirror: config.mirror ?? GENTOO_DISTFILES,
      stage3Variant: config.stage3Variant ?? 'openrc',
      useFlags: config.useFlags ?? [],
      cpuArch: config.cpuArch ?? 'native',
      makeJobs: config.makeJobs ?? 0,
      timezone: config.timezone ?? 'UTC',
      locale: config.locale ?? 'en_US.UTF-8',
    }
  }

  /**
   * Fetch the latest Stage3 tarball URL and checksum from the Gentoo mirrors.
   */
  async fetchLatestStage3(): Promise<Stage3Info> {
    const variant = this.config.stage3Variant
    const arch = this.config.arch
    const digestUrl = `${this.config.mirror}/releases/${arch}/autobuilds/latest-stage3-${arch}-${variant}.txt`

    const content = await this.fetchUrl(digestUrl)
    // Format: "# <comment>\n<path> <size>\n"
    const lines = content.split('\n').filter(l => !l.startsWith('#') && l.trim())
    if (!lines.length) throw new Error(`No Stage3 found at ${digestUrl}`)

    const [relPath, size] = lines[0].trim().split(/\s+/)
    const filename = path.basename(relPath)
    const url = `${this.config.mirror}/releases/${arch}/autobuilds/${relPath}`

    // Fetch SHA256 digest
    const sha256Url = `${url}.sha256`
    const sha256Content = await this.fetchUrl(sha256Url).catch(() => '')
    const sha256Match = sha256Content.match(/([0-9a-f]{64})\s+/)
    const sha256 = sha256Match?.[1] ?? ''

    return { url, filename, sha256, size: parseInt(size, 10) || 0 }
  }

  /**
   * Download and verify a Stage3 tarball.
   *
   * @param destDir  Directory to download into
   */
  async downloadStage3(destDir: string): Promise<string> {
    const stage3 = await this.fetchLatestStage3()
    fs.mkdirSync(destDir, { recursive: true })
    const destPath = path.join(destDir, stage3.filename)

    if (fs.existsSync(destPath)) {
      if (this.verbose) console.log(`gentoo: Stage3 already downloaded: ${destPath}`)
    } else {
      const sizeMib = (stage3.size / 1024 / 1024).toFixed(0)
      console.log(`gentoo: downloading Stage3 (${sizeMib} MiB): ${stage3.url}`)
      await this.downloadFile(stage3.url, destPath)
    }

    // Verify checksum
    if (stage3.sha256) {
      const actual = await this.sha256File(destPath)
      if (actual !== stage3.sha256) {
        throw new Error(`Stage3 checksum mismatch!\n  expected: ${stage3.sha256}\n  actual:   ${actual}`)
      }
      if (this.verbose) console.log(`gentoo: Stage3 checksum verified`)
    }

    return destPath
  }

  /**
   * Extract a Stage3 tarball into a target directory.
   */
  async extractStage3(tarPath: string, targetDir: string): Promise<void> {
    fs.mkdirSync(targetDir, { recursive: true })
    console.log(`gentoo: extracting Stage3 to ${targetDir}...`)
    const r = await this.exec(
      `tar xpf "${tarPath}" --xattrs-include='*.*' --numeric-owner -C "${targetDir}"`,
      { echo: this.verbose }
    )
    if (r.code !== 0) throw new Error(`Stage3 extraction failed: ${r.error ?? r.data}`)
  }

  /**
   * Detect GPU type and return the appropriate VIDEO_CARDS value.
   */
  async detectVideoCards(): Promise<string> {
    const r = await this.exec('lspci 2>/dev/null | grep -i "vga\\|3d\\|display"', { capture: true })
    const output = r.data.toLowerCase()

    if (output.includes('nvidia'))  return 'nvidia nouveau'
    if (output.includes('amd') || output.includes('radeon') || output.includes('amdgpu')) return 'amdgpu radeonsi'
    if (output.includes('intel'))   return 'intel i965'
    if (output.includes('vmware'))  return 'vmware'
    if (output.includes('virtio'))  return 'virtio'
    return 'fbdev vesa'
  }

  /**
   * Generate an optimized make.conf for the target system.
   */
  async generateMakeConf(): Promise<MakeConf> {
    const jobs = this.config.makeJobs > 0
      ? this.config.makeJobs
      : await this.exec('nproc', { capture: true }).then(r => parseInt(r.data.trim(), 10) + 1)

    const videoCards = await this.detectVideoCards()

    const useFlags = [
      'X', 'alsa', 'pulseaudio', 'networkmanager',
      ...(this.config.desktop !== 'none' ? ['gtk', 'qt5'] : []),
      ...(this.config.desktop === 'kde' ? ['kde', 'plasma'] : []),
      ...(this.config.desktop === 'gnome' ? ['gnome'] : []),
      ...this.config.useFlags,
    ].join(' ')

    return {
      cflags: `-march=${this.config.cpuArch} -O2 -pipe`,
      cxxflags: '${CFLAGS}',
      makeOpts: `-j${jobs} -l${jobs}`,
      useFlags,
      videoCards,
      inputDevices: 'libinput',
      acceptKeywords: this.config.arch === 'amd64' ? 'amd64' : `~${this.config.arch}`,
      features: 'parallel-fetch parallel-install',
    }
  }

  /**
   * Write make.conf to the target chroot.
   */
  async writeMakeConf(chrootDir: string): Promise<void> {
    const conf = await this.generateMakeConf()
    const makeConfPath = path.join(chrootDir, 'etc', 'portage', 'make.conf')
    fs.mkdirSync(path.dirname(makeConfPath), { recursive: true })

    const content = [
      `# Generated by penguins-eggs gentoo-installer plugin`,
      `COMMON_FLAGS="${conf.cflags}"`,
      `CFLAGS="\${COMMON_FLAGS}"`,
      `CXXFLAGS="${conf.cxxflags}"`,
      `FCFLAGS="\${COMMON_FLAGS}"`,
      `FFLAGS="\${COMMON_FLAGS}"`,
      ``,
      `MAKEOPTS="${conf.makeOpts}"`,
      ``,
      `USE="${conf.useFlags}"`,
      `VIDEO_CARDS="${conf.videoCards}"`,
      `INPUT_DEVICES="${conf.inputDevices}"`,
      ``,
      `ACCEPT_KEYWORDS="${conf.acceptKeywords}"`,
      `FEATURES="${conf.features}"`,
      ``,
      `GENTOO_MIRRORS="${this.config.mirror}"`,
    ].join('\n') + '\n'

    fs.writeFileSync(makeConfPath, content)
    if (this.verbose) console.log(`gentoo: make.conf written: ${makeConfPath}`)
  }

  /**
   * Select a Portage profile in the chroot.
   */
  async selectProfile(chrootDir: string): Promise<void> {
    const arch = this.config.arch
    const profileMap: Record<GentooProfile, string> = {
      'default':         `default/linux/${arch}/17.1`,
      'desktop':         `default/linux/${arch}/17.1/desktop`,
      'desktop/gnome':   `default/linux/${arch}/17.1/desktop/gnome`,
      'desktop/kde':     `default/linux/${arch}/17.1/desktop/plasma`,
      'hardened':        `default/linux/${arch}/17.1/hardened`,
      'musl':            `default/linux/musl/${arch}`,
    }
    const profile = profileMap[this.config.profile] ?? profileMap['desktop']

    const r = await this.exec(
      `chroot "${chrootDir}" eselect profile set "${profile}"`,
      { echo: this.verbose }
    )
    if (r.code !== 0) {
      console.warn(`gentoo: profile selection failed (${profile}), continuing`)
    } else {
      console.log(`gentoo: profile set: ${profile}`)
    }
  }

  /**
   * Install the kernel in the chroot.
   */
  async installKernel(chrootDir: string): Promise<void> {
    console.log(`gentoo: installing kernel (method: ${this.config.kernel})...`)

    if (this.config.kernel === 'binary') {
      // Use gentoo-kernel-bin (pre-compiled binary kernel)
      const r = await this.exec(
        `chroot "${chrootDir}" emerge --quiet gentoo-kernel-bin`,
        { echo: this.verbose }
      )
      if (r.code !== 0) throw new Error(`kernel install failed: ${r.error ?? r.data}`)
    } else if (this.config.kernel === 'genkernel') {
      await this.exec(`chroot "${chrootDir}" emerge --quiet genkernel`, { echo: this.verbose })
      await this.exec(
        `chroot "${chrootDir}" genkernel --menuconfig=no all`,
        { echo: this.verbose }
      )
    } else {
      // Source: emerge gentoo-sources + manual config
      await this.exec(`chroot "${chrootDir}" emerge --quiet gentoo-sources`, { echo: this.verbose })
      console.log(`gentoo: kernel sources installed. Configure manually in ${chrootDir}/usr/src/linux`)
    }
  }

  /**
   * Install a desktop environment in the chroot.
   */
  async installDesktop(chrootDir: string): Promise<void> {
    if (this.config.desktop === 'none') return

    const desktopPackages: Record<GentooDesktop, string[]> = {
      kde:   ['kde-plasma/plasma-meta', 'kde-apps/kde-apps-meta', 'x11-misc/sddm'],
      xfce:  ['xfce-base/xfce4-meta', 'x11-apps/lightdm'],
      mate:  ['mate-base/mate', 'x11-apps/lightdm'],
      gnome: ['gnome-base/gnome', 'gnome-base/gdm'],
      none:  [],
    }

    const pkgs = desktopPackages[this.config.desktop]
    if (!pkgs.length) return

    console.log(`gentoo: installing ${this.config.desktop} desktop...`)
    const r = await this.exec(
      `chroot "${chrootDir}" emerge --quiet ${pkgs.join(' ')}`,
      { echo: this.verbose }
    )
    if (r.code !== 0) throw new Error(`desktop install failed: ${r.error ?? r.data}`)
  }

  /**
   * Full installation pipeline: Stage3 → make.conf → profile → kernel → desktop.
   * Suitable for embedding in eggs' krill installer.
   */
  async install(targetDir: string, stage3CacheDir = '/var/cache/eggs/gentoo'): Promise<void> {
    console.log(`gentoo: starting installation to ${targetDir}`)

    const stage3Path = await this.downloadStage3(stage3CacheDir)
    await this.extractStage3(stage3Path, targetDir)
    await this.writeMakeConf(targetDir)
    await this.selectProfile(targetDir)
    await this.installKernel(targetDir)
    await this.installDesktop(targetDir)

    console.log(`gentoo: installation complete: ${targetDir}`)
  }

  private async fetchUrl(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const request = (u: string) => {
        https.get(u, (res) => {
          if (res.statusCode === 301 || res.statusCode === 302) {
            request(res.headers.location!); return
          }
          let data = ''
          res.on('data', d => { data += d })
          res.on('end', () => resolve(data))
        }).on('error', reject)
      }
      request(url)
    })
  }

  private downloadFile(url: string, dest: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(dest)
      const request = (u: string) => {
        https.get(u, (res) => {
          if (res.statusCode === 301 || res.statusCode === 302) {
            file.close(); request(res.headers.location!); return
          }
          if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode} downloading ${u}`)); return
          }
          res.pipe(file)
          file.on('finish', () => { file.close(); resolve() })
        }).on('error', reject)
      }
      request(url)
    })
  }

  private sha256File(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256')
      const stream = fs.createReadStream(filePath)
      stream.on('data', d => hash.update(d))
      stream.on('end', () => resolve(hash.digest('hex')))
      stream.on('error', reject)
    })
  }
}
