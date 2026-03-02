/**
 * ./src/classes/ovary.d/cros_flavour.ts
 * penguins-eggs v.26.2.x / ecmascript 2020
 * author: Piero Proietti
 * license: MIT
 *
 * ChromiumOS flavour builder.
 *
 * Manages browser selection for ChromiumOS images. Each "flavour" is a
 * ChromiumOS build bundled with a specific Chromium-based browser.
 *
 * Built-in flavours:
 *   - chromium  (stock Chromium via Portage)
 *   - thorium   (Alex313031/thorium, pre-built binaries)
 *   - brave     (brave/brave-browser, pre-built binaries)
 *
 * Custom flavours:
 *   - Any Chromium fork via --cros-browser-repo <git-url>
 *   - The repo is cloned and built using its own build system
 *
 * Integration:
 *   - Flavours are implemented as wardrobe costumes in conf/wardrobes/chromiumos/
 *   - `eggs produce --cros-flavour thorium` applies the costume before ISO creation
 *   - The ISO is branded with the flavour name (volid, filename)
 */

import fs from 'node:fs'
import path from 'node:path'
import yaml from 'js-yaml'

import { exec } from '../../lib/utils.js'
import Utils from '../utils.js'

/**
 * Known ChromiumOS flavour definitions.
 */
export interface CrosFlavour {
  /** Flavour identifier */
  id: string
  /** Display name */
  name: string
  /** Browser description */
  description: string
  /** GitHub repo URL */
  repo: string
  /** Install method: 'emerge' | 'tarball' | 'custom' */
  installMethod: 'emerge' | 'tarball' | 'crew' | 'custom'
  /** Package name for emerge/crew */
  packageName?: string
  /** GitHub releases API URL for tarball downloads */
  releasesUrl?: string
  /** Glob pattern to match the correct tarball from releases */
  tarballFilter?: string
  /** Install directory for tarball extraction */
  installDir?: string
  /** Binary name for symlink creation */
  binaryName?: string
  /** ISO volume ID prefix */
  volidPrefix: string
  /** ISO filename prefix */
  isoPrefix: string
  /** Whether this is an Android-only project (no Linux desktop builds) */
  androidOnly?: boolean
}

/**
 * Registry of built-in ChromiumOS flavours.
 */
export const BUILTIN_FLAVOURS: Record<string, CrosFlavour> = {
  chromium: {
    id: 'chromium',
    name: 'Chromium',
    description: 'Stock open-source Chromium browser',
    repo: 'https://chromium.googlesource.com/chromium/src',
    installMethod: 'emerge',
    packageName: 'www-client/chromium',
    volidPrefix: 'CHROMIUMOS',
    isoPrefix: 'chromiumos',
  },
  thorium: {
    id: 'thorium',
    name: 'Thorium',
    description: 'Chromium fork with compiler optimizations and extra codecs',
    repo: 'https://github.com/Alex313031/thorium',
    installMethod: 'tarball',
    releasesUrl: 'https://api.github.com/repos/Alex313031/thorium/releases/latest',
    tarballFilter: 'thorium-browser_*_amd64.deb',
    installDir: '/opt/thorium',
    binaryName: 'thorium-browser',
    volidPrefix: 'THORIUMOS',
    isoPrefix: 'thoriumos',
  },
  brave: {
    id: 'brave',
    name: 'Brave',
    description: 'Privacy-focused Chromium fork with built-in ad blocking',
    repo: 'https://github.com/brave/brave-browser',
    installMethod: 'tarball',
    releasesUrl: 'https://api.github.com/repos/brave/brave-browser/releases/latest',
    tarballFilter: 'brave-browser-*-linux-amd64.zip',
    installDir: '/opt/brave',
    binaryName: 'brave-browser',
    volidPrefix: 'BRAVEOS',
    isoPrefix: 'braveos',
  },
  vanadium: {
    id: 'vanadium',
    name: 'Vanadium',
    description: 'GrapheneOS hardened Chromium (Android-only, requires source build for Linux)',
    repo: 'https://github.com/GrapheneOS/Vanadium',
    installMethod: 'custom',
    volidPrefix: 'VANADIUMOS',
    isoPrefix: 'vanadiumos',
    androidOnly: true,
  },
  bromite: {
    id: 'bromite',
    name: 'Bromite',
    description: 'Chromium with ad blocking and privacy (discontinued, see Cromite)',
    repo: 'https://github.com/nicothin/nicothin',
    installMethod: 'custom',
    volidPrefix: 'BROMITEOS',
    isoPrefix: 'bromiteos',
    androidOnly: true,
  },
  cromite: {
    id: 'cromite',
    name: 'Cromite',
    description: 'Fork of Bromite with continued ad blocking and privacy patches',
    repo: 'https://github.com/nicothin/nicothin',
    installMethod: 'custom',
    volidPrefix: 'CROMITEOS',
    isoPrefix: 'cromiteos',
    androidOnly: true,
  },
}

/**
 * Get a flavour by ID. Returns undefined if not found.
 */
export function getFlavour(id: string): CrosFlavour | undefined {
  return BUILTIN_FLAVOURS[id.toLowerCase()]
}

/**
 * List all available flavour IDs.
 */
export function listFlavours(): string[] {
  return Object.keys(BUILTIN_FLAVOURS)
}

/**
 * List flavours that have Linux desktop builds available.
 */
export function listDesktopFlavours(): string[] {
  return Object.entries(BUILTIN_FLAVOURS)
    .filter(([_, f]) => !f.androidOnly)
    .map(([id]) => id)
}

/**
 * Create a custom flavour from a git repo URL.
 *
 * @param repoUrl - Git repository URL for the Chromium fork
 * @param name - Optional display name (defaults to repo name)
 * @returns CrosFlavour definition
 */
export function createCustomFlavour(repoUrl: string, name?: string): CrosFlavour {
  // Extract repo name from URL
  const repoName = repoUrl.replace(/\.git$/, '').split('/').pop() || 'custom-browser'
  const displayName = name || repoName

  return {
    id: 'custom',
    name: displayName,
    description: `Custom Chromium fork from ${repoUrl}`,
    repo: repoUrl,
    installMethod: 'custom',
    installDir: `/opt/${repoName}`,
    binaryName: repoName,
    volidPrefix: `${repoName.toUpperCase().slice(0, 8)}OS`,
    isoPrefix: `${repoName.toLowerCase()}os`,
  }
}

/**
 * Get the wardrobe costume path for a flavour.
 */
export function getCostumePath(flavourId: string): string {
  return path.resolve(__dirname, '../../../conf/wardrobes/chromiumos/costumes', flavourId)
}

/**
 * Apply a flavour's branding to the ISO settings.
 *
 * @param flavour - The flavour to apply
 * @returns Object with volid and isoFilename overrides
 */
export function getFlavourBranding(flavour: CrosFlavour): {
  volid: string
  isoPrefix: string
} {
  return {
    volid: flavour.volidPrefix,
    isoPrefix: flavour.isoPrefix,
  }
}

/**
 * Install a browser flavour into the current system.
 * This is called during `eggs produce` to set up the browser before snapshotting.
 *
 * @param flavour - Flavour to install
 * @param customRepo - Git repo URL for custom flavours
 * @param echo - Verbose output
 */
export async function installFlavour(
  flavour: CrosFlavour,
  customRepo?: string,
  echo?: object
): Promise<void> {
  const verbose = echo || Utils.setEcho(false)

  if (flavour.androidOnly) {
    Utils.warning(`${flavour.name} is Android-only. Linux desktop builds require patching Chromium source.`)
    Utils.warning(`Proceeding with custom build from ${flavour.repo}...`)
  }

  switch (flavour.installMethod) {
    case 'emerge': {
      if (!flavour.packageName) throw new Error(`No package name for ${flavour.id}`)
      Utils.warning(`Installing ${flavour.name} via emerge...`)
      await exec(`emerge --ask=n ${flavour.packageName}`, verbose)
      break
    }

    case 'crew': {
      if (!flavour.packageName) throw new Error(`No package name for ${flavour.id}`)
      Utils.warning(`Installing ${flavour.name} via Chromebrew...`)
      await exec(`crew install ${flavour.packageName}`, verbose)
      break
    }

    case 'tarball': {
      if (!flavour.releasesUrl || !flavour.installDir) {
        throw new Error(`Missing releases URL or install dir for ${flavour.id}`)
      }

      Utils.warning(`Downloading ${flavour.name} from GitHub releases...`)
      fs.mkdirSync(flavour.installDir, { recursive: true })

      // Fetch latest release asset URL
      const result = await exec(
        `curl -s "${flavour.releasesUrl}" | grep -o 'https://[^"]*${flavour.tarballFilter?.replace('*', '[^"]*') || ''}' | head -1`,
        { capture: true }
      ) as any
      const assetUrl = (result.stdout || '').trim()

      if (!assetUrl) {
        throw new Error(`No matching release asset found for ${flavour.name}`)
      }

      const tmpFile = `/tmp/eggs-browser-download`
      await exec(`curl -L -o ${tmpFile} "${assetUrl}"`, verbose)

      // Detect file type and extract
      if (assetUrl.endsWith('.deb')) {
        await exec(`dpkg -x ${tmpFile} /tmp/eggs-browser-extract`, verbose)
        await exec(`cp -r /tmp/eggs-browser-extract/opt/*/* ${flavour.installDir}/`, verbose)
        await exec(`rm -rf /tmp/eggs-browser-extract`, verbose)
      } else if (assetUrl.endsWith('.zip')) {
        await exec(`unzip -o ${tmpFile} -d ${flavour.installDir}`, verbose)
      } else if (assetUrl.endsWith('.tar.bz2') || assetUrl.endsWith('.tar.gz') || assetUrl.endsWith('.tar.xz')) {
        await exec(`tar xf ${tmpFile} -C ${flavour.installDir} --strip-components=1`, verbose)
      }

      await exec(`rm -f ${tmpFile}`, verbose)

      // Create symlink
      if (flavour.binaryName) {
        const binaryPath = path.join(flavour.installDir, flavour.binaryName)
        if (fs.existsSync(binaryPath)) {
          await exec(`ln -sf ${binaryPath} /usr/local/bin/${flavour.binaryName}`, verbose)
        }
      }

      Utils.warning(`${flavour.name} installed to ${flavour.installDir}`)
      break
    }

    case 'custom': {
      const repoUrl = customRepo || flavour.repo
      const installDir = flavour.installDir || '/opt/custom-browser'

      Utils.warning(`Building ${flavour.name} from source: ${repoUrl}`)
      fs.mkdirSync(installDir, { recursive: true })

      await exec(`git clone --depth 1 "${repoUrl}" /tmp/eggs-browser-src`, verbose)

      // Try common build patterns
      const srcDir = '/tmp/eggs-browser-src'
      if (fs.existsSync(path.join(srcDir, 'build.sh'))) {
        await exec(`cd ${srcDir} && bash build.sh`, verbose)
      } else if (fs.existsSync(path.join(srcDir, 'Makefile'))) {
        await exec(`cd ${srcDir} && make && make install DESTDIR=${installDir}`, verbose)
      } else {
        Utils.warning(`No build script found in ${repoUrl}. Place built binaries in ${installDir} manually.`)
      }

      await exec(`rm -rf /tmp/eggs-browser-src`, verbose)
      break
    }
  }
}

/**
 * Load the flavour registry from the YAML config file.
 * Merges built-in flavours with any user-defined ones.
 */
export function loadFlavourRegistry(): Record<string, CrosFlavour> {
  const registryPath = path.resolve(__dirname, '../../../conf/flavours/chromiumos.yaml')
  if (!fs.existsSync(registryPath)) {
    return BUILTIN_FLAVOURS
  }

  try {
    const content = fs.readFileSync(registryPath, 'utf8')
    const registry = yaml.load(content) as any
    if (registry?.flavours) {
      // Merge user-defined flavours with built-ins (user overrides)
      const merged = { ...BUILTIN_FLAVOURS }
      for (const [id, def] of Object.entries(registry.flavours) as any) {
        merged[id] = {
          id,
          name: def.name || id,
          description: def.description || '',
          repo: def.repo || '',
          installMethod: def.install_method || 'custom',
          packageName: def.package_name,
          releasesUrl: def.releases_url,
          tarballFilter: def.tarball_filter,
          installDir: def.install_dir,
          binaryName: def.binary_name,
          volidPrefix: def.branding?.volid_prefix || `${id.toUpperCase()}OS`,
          isoPrefix: def.branding?.iso_prefix || `${id}os`,
          androidOnly: def.notes?.includes('Android-only'),
        }
      }
      return merged
    }
  } catch {
    // Fall back to built-ins
  }

  return BUILTIN_FLAVOURS
}
