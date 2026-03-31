/**
 * test/helpers/mock-fs.ts
 * Filesystem helpers for tests — creates/cleans temp directories.
 */

import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

/**
 * Create a temporary directory for a test.
 */
export function createTempDir(prefix = 'eggs-test-'): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix))
}

/**
 * Clean up a temporary directory.
 */
export function cleanTempDir(dir: string): void {
  if (dir.startsWith(os.tmpdir()) && fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true })
  }
}

/**
 * Create a file with content in a directory.
 */
export function createFile(dir: string, filename: string, content = ''): string {
  const filePath = path.join(dir, filename)
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, content)
  return filePath
}

/**
 * Create a mock eggs config directory structure.
 */
export function createMockConfigDir(baseDir: string): string {
  const configDir = path.join(baseDir, 'etc', 'penguins-eggs.d')
  fs.mkdirSync(configDir, { recursive: true })
  return configDir
}

/**
 * Create a mock wardrobe directory structure.
 */
export function createMockWardrobe(baseDir: string): string {
  const wardrobeDir = path.join(baseDir, 'wardrobe')
  const costumeDirs = ['colibri', 'eagle', 'duck']

  for (const costume of costumeDirs) {
    const costumeDir = path.join(wardrobeDir, 'costumes', costume)
    fs.mkdirSync(costumeDir, { recursive: true })
    fs.writeFileSync(
      path.join(costumeDir, 'index.yml'),
      `name: ${costume}\ndescription: Test costume ${costume}\npackages:\n  - git\n  - curl\n`
    )
    fs.writeFileSync(
      path.join(costumeDir, 'config.sh'),
      `#!/bin/bash\necho "Configuring ${costume}"\n`
    )
  }

  return wardrobeDir
}

/**
 * Create a mock ISO file (just a small file with a header).
 */
export function createMockIso(dir: string, name = 'test.iso'): string {
  const isoPath = path.join(dir, name)
  // Write a small file that simulates an ISO
  const header = Buffer.alloc(64)
  header.write('EGGS-ISO-MOCK', 0)
  fs.writeFileSync(isoPath, header)
  return isoPath
}

/**
 * Create a mock git repo in a directory.
 */
export function createMockGitDir(dir: string): void {
  fs.mkdirSync(path.join(dir, '.git'), { recursive: true })
  fs.writeFileSync(path.join(dir, '.git', 'HEAD'), 'ref: refs/heads/main\n')
  fs.writeFileSync(path.join(dir, '.git', 'config'), '[core]\n\tbare = false\n')
}
