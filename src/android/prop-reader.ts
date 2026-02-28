/**
 * ./src/android/prop-reader.ts
 * penguins-eggs
 * author: Piero Proietti / Android backend
 * license: MIT
 *
 * Parses Android build.prop files into a typed key-value map.
 * build.prop uses Java .properties format: key=value, # comments, blank lines.
 */

import fs from 'node:fs'

export interface IAndroidBuildProp {
  [key: string]: string
  'ro.build.display.id': string
  'ro.build.flavor': string
  'ro.build.type': string
  'ro.build.version.release': string
  'ro.build.version.sdk': string
  'ro.product.brand': string
  'ro.product.cpu.abi': string
  'ro.product.cpu.abilist': string
  'ro.product.cpu.abilist32': string
  'ro.product.cpu.abilist64': string
  'ro.product.device': string
  'ro.product.model': string
}

/**
 * Standard locations for build.prop files, checked in order.
 * The first existing file wins for each property (later files
 * can override if the same key appears).
 */
const BUILD_PROP_PATHS = [
  '/system/build.prop',
  '/system/system/build.prop',
  '/vendor/build.prop',
  '/system/vendor/build.prop',
  '/product/build.prop',
  '/system_ext/build.prop',
  '/var/lib/waydroid/overlay/system/build.prop',
]

/**
 * Parse a single build.prop file into a Record<string, string>.
 * Handles: key=value, # comments, blank lines, values with = in them.
 */
export function parseBuildPropFile(filePath: string): Record<string, string> {
  const props: Record<string, string> = {}

  if (!fs.existsSync(filePath)) {
    return props
  }

  let data: string
  try {
    data = fs.readFileSync(filePath, 'utf8')
  } catch {
    return props
  }

  for (const line of data.split('\n')) {
    const trimmed = line.trim()

    // Skip comments and blank lines
    if (trimmed === '' || trimmed.startsWith('#') || trimmed.startsWith('!')) {
      continue
    }

    const eqIndex = trimmed.indexOf('=')
    if (eqIndex === -1) {
      continue
    }

    const key = trimmed.slice(0, eqIndex).trim()
    const value = trimmed.slice(eqIndex + 1).trim()

    if (key) {
      props[key] = value
    }
  }

  return props
}

/**
 * Read and merge all build.prop files from standard Android locations.
 * Properties from earlier paths take precedence (system > vendor > product).
 */
export function readAllBuildProps(): Partial<IAndroidBuildProp> {
  const merged: Record<string, string> = {}

  for (const propPath of BUILD_PROP_PATHS) {
    const props = parseBuildPropFile(propPath)
    for (const [key, value] of Object.entries(props)) {
      // First occurrence wins (system props override vendor/product)
      if (!(key in merged)) {
        merged[key] = value
      }
    }
  }

  return merged as Partial<IAndroidBuildProp>
}

/**
 * Read a single property by key from all build.prop locations.
 */
export function readBuildProp(key: string): string {
  for (const propPath of BUILD_PROP_PATHS) {
    if (!fs.existsSync(propPath)) {
      continue
    }

    try {
      const data = fs.readFileSync(propPath, 'utf8')
      for (const line of data.split('\n')) {
        const trimmed = line.trim()
        if (trimmed.startsWith(key + '=')) {
          return trimmed.slice(key.length + 1).trim()
        }
      }
    } catch {
      // permission denied or other read error
    }
  }

  return ''
}

/**
 * Parse a build.prop string (not from file) — useful for testing.
 */
export function parseBuildPropString(content: string): Record<string, string> {
  const props: Record<string, string> = {}

  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (trimmed === '' || trimmed.startsWith('#') || trimmed.startsWith('!')) {
      continue
    }

    const eqIndex = trimmed.indexOf('=')
    if (eqIndex === -1) {
      continue
    }

    const key = trimmed.slice(0, eqIndex).trim()
    const value = trimmed.slice(eqIndex + 1).trim()

    if (key) {
      props[key] = value
    }
  }

  return props
}
