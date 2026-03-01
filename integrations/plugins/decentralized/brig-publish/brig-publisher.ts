/**
 * plugins/decentralized/brig-publish/brig-publisher.ts
 * Publishes eggs ISOs to IPFS via brig (sahib/brig).
 *
 * Brig provides:
 * - Git-like versioning of files on IPFS
 * - Encryption at rest
 * - FUSE mount for local access
 * - HTTP gateway for browser downloads
 * - Deduplication across versions
 */

import fs from 'node:fs'
import path from 'node:path'

import { IIpfsConfig, loadIpfsConfig } from './ipfs-config.js'

type ExecFn = (cmd: string, opts?: { capture?: boolean; echo?: boolean }) => Promise<{ code: number; data: string; error?: string }>

export interface BrigPublishResult {
  cid: string
  size: number
  gatewayUrl?: string
}

export class BrigPublisher {
  private config: IIpfsConfig
  private exec: ExecFn
  private verbose: boolean

  constructor(exec: ExecFn, verbose = false) {
    this.config = loadIpfsConfig()
    this.exec = exec
    this.verbose = verbose
  }

  /**
   * Check if brig daemon is running and accessible.
   */
  async isAvailable(): Promise<boolean> {
    const result = await this.exec('brig whoami', { capture: true })
    return result.code === 0
  }

  /**
   * Check if brig is installed.
   */
  async isInstalled(): Promise<boolean> {
    const result = await this.exec('command -v brig', { capture: true })
    return result.code === 0
  }

  /**
   * Initialize brig repository if not already initialized.
   */
  async init(repoName: string): Promise<void> {
    const whoami = await this.exec('brig whoami', { capture: true })
    if (whoami.code !== 0) {
      await this.exec(`brig init ${repoName}`, { echo: this.verbose })
    }
  }

  /**
   * Publish an ISO to brig.
   * Stages the file, commits with metadata, and optionally pushes to a remote.
   */
  async publish(isoPath: string): Promise<BrigPublishResult> {
    if (!(await this.isAvailable())) {
      throw new Error('brig daemon not running. Start with: brig daemon launch')
    }

    const filename = path.basename(isoPath)
    const stats = fs.statSync(isoPath)

    // Stage the ISO in brig
    const brigPath = `/isos/${filename}`
    await this.exec(`brig stage "${isoPath}" "${brigPath}"`, { echo: this.verbose })

    // Commit with metadata
    const timestamp = new Date().toISOString()
    await this.exec(`brig commit "eggs: ${filename} ${timestamp}"`, { echo: this.verbose })

    // Get the CID
    const catResult = await this.exec(`brig cat --format json "${brigPath}"`, { capture: true })
    let cid = ''
    if (catResult.code === 0) {
      try {
        const info = JSON.parse(catResult.data)
        cid = info.content_hash || info.hash || ''
      } catch {
        // Fall back to getting hash from stat
        const statResult = await this.exec(`brig info "${brigPath}"`, { capture: true })
        cid = statResult.data.trim()
      }
    }

    // Push to remote if configured
    if (this.config.brig_remote) {
      await this.exec(`brig push "${this.config.brig_remote}"`, { echo: this.verbose })
    }

    // Pin to external services
    for (const service of this.config.pin_services) {
      await this.pinToService(cid, service)
    }

    const gatewayUrl = this.config.gateway_port
      ? `http://localhost:${this.config.gateway_port}/get/${brigPath}`
      : undefined

    return {
      cid,
      size: stats.size,
      gatewayUrl,
    }
  }

  /**
   * Retrieve an ISO from brig by path or CID.
   */
  async get(brigPath: string, destPath: string): Promise<void> {
    if (!(await this.isAvailable())) {
      throw new Error('brig daemon not running')
    }

    await this.exec(`brig cat "${brigPath}" > "${destPath}"`, { echo: this.verbose })
  }

  /**
   * List all published ISOs.
   */
  async list(): Promise<string[]> {
    const result = await this.exec('brig ls /isos/', { capture: true })
    if (result.code !== 0) return []
    return result.data.split('\n').filter(Boolean)
  }

  /**
   * Start the brig HTTP gateway for browser-based downloads.
   */
  async startGateway(): Promise<string> {
    const port = this.config.gateway_port
    await this.exec(`brig gateway start --port ${port}`, { echo: this.verbose })
    return `http://localhost:${port}`
  }

  /**
   * Get version history for a published ISO.
   */
  async history(brigPath: string): Promise<string[]> {
    const result = await this.exec(`brig history "${brigPath}"`, { capture: true })
    if (result.code !== 0) return []
    return result.data.split('\n').filter(Boolean)
  }

  /**
   * Pin a CID to an external pinning service.
   */
  private async pinToService(cid: string, service: string): Promise<void> {
    if (!cid) return

    switch (service.toLowerCase()) {
      case 'pinata':
        // Requires PINATA_API_KEY and PINATA_SECRET_KEY env vars
        await this.exec(
          `curl -fsSL -X POST "https://api.pinata.cloud/pinning/pinByHash" ` +
          `-H "pinata_api_key: $PINATA_API_KEY" ` +
          `-H "pinata_secret_api_key: $PINATA_SECRET_KEY" ` +
          `-H "Content-Type: application/json" ` +
          `-d '{"hashToPin": "${cid}"}'`,
          { echo: this.verbose }
        )
        break
      default:
        if (this.verbose) {
          console.log(`Unknown pin service: ${service}`)
        }
    }
  }
}
