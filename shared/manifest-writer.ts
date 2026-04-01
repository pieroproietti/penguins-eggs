/**
 * shared/manifest-writer.ts
 * penguins-eggs — Android image manifest writer
 * license: MIT
 *
 * Writes waydroid-image-manifest.json after a successful Android image build.
 * waydroid-toolkit reads this file during `wdt install --from-manifest` to
 * know what it is installing without re-detecting the image contents.
 *
 * Schema version is defined in AndroidShared.MANIFEST_SCHEMA_VER.
 */

import fs from 'node:fs'
import path from 'node:path'

import { AndroidShared } from './android-shared.js'

export interface IWaydroidImageManifest {
  /** Schema version — always AndroidShared.MANIFEST_SCHEMA_VER */
  manifestVersion: string
  /** Android ABI (e.g. "x86_64", "arm64-v8a") */
  arch: string
  /** Android variant (e.g. "waydroid", "blissos") */
  variant: string
  /** Android version string (e.g. "13") */
  androidVersion: string
  /** SDK API level (e.g. "33") */
  sdkLevel: string
  /** Build ID from ro.build.id */
  buildId: string
  /** Absolute path to system.img */
  systemImg: string
  /** Absolute path to boot.img (empty string if not applicable) */
  bootImg: string
  /** Absolute path to vendor.img (empty string if not present) */
  vendorImg: string
  /** Whether AVB signing was applied */
  avbSigned: boolean
  /** AVB algorithm used, or empty string */
  avbAlgorithm: string
  /** How the image was produced */
  sourceType: string
  /** ISO 8601 build timestamp */
  builtAt: string
  /** penguins-eggs version that produced this manifest */
  eggsVersion: string
}

/**
 * Write a waydroid-image-manifest.json to outputDir.
 * Returns the path of the written file.
 */
export function writeManifest(
  outputDir: string,
  data: Omit<IWaydroidImageManifest, 'manifestVersion' | 'builtAt'>,
  eggsVersion: string,
): string {
  const manifest: IWaydroidImageManifest = {
    ...data,
    builtAt: new Date().toISOString(),
    eggsVersion,
    manifestVersion: AndroidShared.MANIFEST_SCHEMA_VER,
  }

  const dest = path.join(outputDir, 'waydroid-image-manifest.json')
  fs.writeFileSync(dest, JSON.stringify(manifest, null, 2) + '\n', 'utf8')
  return dest
}

/**
 * Read and validate a waydroid-image-manifest.json.
 * Throws if the file is missing, malformed, or has an unsupported schema version.
 */
export function readManifest(manifestPath: string): IWaydroidImageManifest {
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Manifest not found: ${manifestPath}`)
  }

  let data: unknown
  try {
    data = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  } catch (err) {
    throw new Error(`Failed to parse manifest at ${manifestPath}: ${err}`)
  }

  const m = data as IWaydroidImageManifest
  if (!AndroidShared.isManifestVersionSupported(m.manifestVersion)) {
    throw new Error(
      `Unsupported manifest version "${m.manifestVersion}" in ${manifestPath}. ` +
      `Expected "${AndroidShared.MANIFEST_SCHEMA_VER}".`,
    )
  }

  if (!AndroidShared.isKnownVariant(m.variant)) {
    throw new Error(`Unknown Android variant "${m.variant}" in manifest.`)
  }

  return m
}
