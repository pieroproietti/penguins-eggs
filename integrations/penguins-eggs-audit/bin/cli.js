#!/usr/bin/env node

/**
 * bin/cli.js
 * Standalone CLI for penguins-eggs-integrations.
 *
 * Usage:
 *   eggs-integrations generate-workflows [output-dir]
 *   eggs-integrations validate
 *   eggs-integrations info
 */

import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(readFileSync(resolve(__dirname, '..', 'package.json'), 'utf8'))

const [,, command, ...args] = process.argv

function printHelp() {
  console.log(`penguins-eggs-integrations v${pkg.version}`)
  console.log('')
  console.log('Commands:')
  console.log('  generate-workflows [dir]  Generate GitHub Actions YAML from TypeScript definitions')
  console.log('  info                      Show plugin inventory')
  console.log('  validate                  Run structural validation')
  console.log('  help                      Show this help')
}

function printInfo() {
  console.log(`penguins-eggs-integrations v${pkg.version}`)
  console.log('')
  console.log('Domains:')
  console.log('  distribution       git-lfs ISO tracking, Gogs registry, Opengist sharing')
  console.log('  decentralized      Brig IPFS publishing, git-lfs-ipfs, ipgit remote')
  console.log('  config-management  Wardrobe mount/browse/merge/read via gitfs')
  console.log('  build-infra        System Transparency output, BTRFS snapshots')
  console.log('  dev-workflow       gitStream PR automation, Frogbot scanning, TS CI')
  console.log('  packaging          GitPack install, release downloader, dir downloader')
  console.log('')
  console.log('Usage as library:')
  console.log("  import { LfsTracker } from 'penguins-eggs-integrations/distribution'")
  console.log("  import { BrigPublisher } from 'penguins-eggs-integrations/decentralized'")
  console.log("  import { WardrobeMount } from 'penguins-eggs-integrations/config-management'")
  console.log("  import { StOutput } from 'penguins-eggs-integrations/build-infra'")
  console.log("  import { generateWorkflows } from 'penguins-eggs-integrations/dev-workflow'")
  console.log("  import { DirDownloader } from 'penguins-eggs-integrations/packaging'")
}

async function generateWorkflows(outputDir) {
  const { generateWorkflows: gen } = await import('../dist/src/dev-workflow/index.js')
  const dir = outputDir || '.github/workflows'
  gen(dir)
  console.log(`Workflows generated in ${dir}`)
}

switch (command) {
  case 'generate-workflows':
    await generateWorkflows(args[0])
    break
  case 'info':
    printInfo()
    break
  case 'validate':
    const { execSync } = await import('node:child_process')
    execSync('bash test/validate.sh', { stdio: 'inherit', cwd: resolve(__dirname, '..') })
    break
  case 'help':
  case '--help':
  case '-h':
  case undefined:
    printHelp()
    break
  default:
    console.error(`Unknown command: ${command}`)
    printHelp()
    process.exit(1)
}
