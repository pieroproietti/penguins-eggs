#!/usr/bin/env tsx
/**
 * scripts/ipfs-mirror.ts
 *
 * Adds the repository (or a directory of release assets) to IPFS using Helia.
 * Replaces the previous Kubo-binary approach in .github/workflows/ipfs-mirror.yml.
 *
 * Usage:
 *   tsx scripts/ipfs-mirror.ts [--assets <dir>]
 *
 * Outputs:
 *   REPO_CID=<cid>          — always
 *   ASSETS_CID=<cid>        — only when --assets is passed and the dir is non-empty
 *
 * The CIDs are written to $GITHUB_OUTPUT when running in CI, and printed to
 * stdout otherwise.
 */

import { createHelia } from 'helia'
import { unixfs } from '@helia/unixfs'
import { readdir, readFile, stat } from 'node:fs/promises'
import { join, relative } from 'node:path'
import { appendFile } from 'node:fs/promises'

// ── helpers ──────────────────────────────────────────────────────────────────

async function* walk(dir: string): AsyncGenerator<string> {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      // Skip .git and node_modules to keep the CID stable and small
      if (entry.name === '.git' || entry.name === 'node_modules') continue
      yield* walk(full)
    } else {
      yield full
    }
  }
}

async function addDirectory(fs: ReturnType<typeof unixfs>, root: string): Promise<string> {
  // Collect all files first so we can build the UnixFS directory tree
  const files: Array<{ path: string; content: Uint8Array }> = []

  for await (const absPath of walk(root)) {
    const rel = relative(root, absPath)
    const content = await readFile(absPath)
    files.push({ path: rel, content })
  }

  if (files.length === 0) {
    throw new Error(`No files found in ${root}`)
  }

  let lastCid: import('multiformats').CID | undefined

  for (const file of files) {
    lastCid = await fs.addFile({ path: file.path, content: file.content })
  }

  // Return the CID of the last added entry (the directory root)
  if (!lastCid) throw new Error('No CID produced')
  return lastCid.toString()
}

async function output(key: string, value: string): Promise<void> {
  const ghOutput = process.env['GITHUB_OUTPUT']
  if (ghOutput) {
    await appendFile(ghOutput, `${key}=${value}\n`)
  }
  console.log(`${key}=${value}`)
}

// ── main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const assetsIdx = args.indexOf('--assets')
  const assetsDir = assetsIdx !== -1 ? args[assetsIdx + 1] : undefined

  const helia = await createHelia()
  const fs = unixfs(helia)

  try {
    // Always mirror the repo root
    const repoRoot = new URL('..', import.meta.url).pathname
    console.log(`Adding repository at ${repoRoot} to IPFS…`)
    const repoCid = await addDirectory(fs, repoRoot)
    await output('REPO_CID', repoCid)
    console.log(`Repository CID: ${repoCid}`)
    console.log(`Gateway: https://ipfs.io/ipfs/${repoCid}`)

    // Optionally mirror release assets
    if (assetsDir) {
      const info = await stat(assetsDir).catch(() => null)
      if (info?.isDirectory()) {
        const entries = await readdir(assetsDir)
        if (entries.length > 0) {
          console.log(`Adding release assets at ${assetsDir} to IPFS…`)
          const assetsCid = await addDirectory(fs, assetsDir)
          await output('ASSETS_CID', assetsCid)
          console.log(`Assets CID: ${assetsCid}`)
        } else {
          console.log('No release assets found, skipping.')
        }
      }
    }
  } finally {
    await helia.stop()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
