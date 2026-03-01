/**
 * plugins/build-infra/btrfs-snapshot/btrfs-snapshot.ts
 * Git-like BTRFS snapshot management around eggs produce.
 *
 * Inspired by koo5/BtrFsGit. Provides:
 * - Pre-produce snapshot (save point)
 * - Post-produce snapshot (with ISO metadata)
 * - Rollback to any snapshot
 * - List/diff snapshots
 *
 * Only active on BTRFS filesystems; graceful no-op on others.
 */

import fs from 'node:fs'
import path from 'node:path'

type ExecFn = (cmd: string, opts?: { capture?: boolean; echo?: boolean }) => Promise<{ code: number; data: string; error?: string }>

export interface Snapshot {
  name: string
  path: string
  timestamp: string
  metadata?: Record<string, string>
}

export class BtrfsSnapshot {
  private exec: ExecFn
  private verbose: boolean
  private snapshotDir: string

  constructor(exec: ExecFn, verbose = false, snapshotDir = '/.eggs-snapshots') {
    this.exec = exec
    this.verbose = verbose
    this.snapshotDir = snapshotDir
  }

  /**
   * Check if the root filesystem is BTRFS.
   */
  async isBtrfs(mountpoint = '/'): Promise<boolean> {
    const result = await this.exec(
      `stat -f -c %T "${mountpoint}"`,
      { capture: true }
    )
    return result.data.trim() === 'btrfs'
  }

  /**
   * Check if btrfs tools are available.
   */
  async isAvailable(): Promise<boolean> {
    const result = await this.exec('command -v btrfs', { capture: true })
    return result.code === 0
  }

  /**
   * Create a snapshot of the current system state.
   */
  async create(name: string, metadata?: Record<string, string>): Promise<Snapshot> {
    if (!(await this.isBtrfs())) {
      throw new Error('Root filesystem is not BTRFS. Snapshots require BTRFS.')
    }

    if (!(await this.isAvailable())) {
      throw new Error('btrfs-progs not installed')
    }

    // Ensure snapshot directory exists
    if (!fs.existsSync(this.snapshotDir)) {
      fs.mkdirSync(this.snapshotDir, { recursive: true })
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const snapshotName = `${name}_${timestamp}`
    const snapshotPath = path.join(this.snapshotDir, snapshotName)

    // Create read-only snapshot of root subvolume
    await this.exec(
      `btrfs subvolume snapshot -r / "${snapshotPath}"`,
      { echo: this.verbose }
    )

    // Save metadata
    const metadataPath = `${snapshotPath}.meta.json`
    const snapshotMeta: Snapshot = {
      name: snapshotName,
      path: snapshotPath,
      timestamp: new Date().toISOString(),
      metadata,
    }
    fs.writeFileSync(metadataPath, JSON.stringify(snapshotMeta, null, 2))

    if (this.verbose) {
      console.log(`Snapshot created: ${snapshotPath}`)
    }

    return snapshotMeta
  }

  /**
   * Create pre-produce snapshot.
   */
  async preProduceSnapshot(): Promise<Snapshot> {
    return this.create('pre-produce', {
      stage: 'pre-produce',
      hostname: (await this.exec('hostname', { capture: true })).data.trim(),
    })
  }

  /**
   * Create post-produce snapshot with ISO metadata.
   */
  async postProduceSnapshot(isoFilename: string, isoSize: number): Promise<Snapshot> {
    return this.create('post-produce', {
      stage: 'post-produce',
      iso: isoFilename,
      iso_size: String(isoSize),
    })
  }

  /**
   * List all snapshots.
   */
  async list(): Promise<Snapshot[]> {
    if (!fs.existsSync(this.snapshotDir)) return []

    const entries = fs.readdirSync(this.snapshotDir)
    const snapshots: Snapshot[] = []

    for (const entry of entries) {
      const metaPath = path.join(this.snapshotDir, `${entry}.meta.json`)
      if (fs.existsSync(metaPath)) {
        const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'))
        snapshots.push(meta)
      } else if (!entry.endsWith('.meta.json')) {
        // Snapshot without metadata
        snapshots.push({
          name: entry,
          path: path.join(this.snapshotDir, entry),
          timestamp: '',
        })
      }
    }

    return snapshots.sort((a, b) => a.timestamp.localeCompare(b.timestamp))
  }

  /**
   * Rollback to a snapshot.
   * Creates a writable snapshot from the read-only one and swaps root.
   */
  async rollback(snapshotName: string): Promise<void> {
    const snapshotPath = path.join(this.snapshotDir, snapshotName)
    if (!fs.existsSync(snapshotPath)) {
      throw new Error(`Snapshot not found: ${snapshotName}`)
    }

    // Create a writable snapshot from the read-only one
    const rollbackPath = `${snapshotPath}-rollback`
    await this.exec(
      `btrfs subvolume snapshot "${snapshotPath}" "${rollbackPath}"`,
      { echo: this.verbose }
    )

    console.log(`Rollback snapshot created at ${rollbackPath}`)
    console.log('To complete rollback:')
    console.log(`  1. Boot from live media`)
    console.log(`  2. Mount the BTRFS partition`)
    console.log(`  3. Move current root: mv /mnt/@ /mnt/@.old`)
    console.log(`  4. Move rollback: mv /mnt/${path.basename(rollbackPath)} /mnt/@`)
    console.log(`  5. Reboot`)
  }

  /**
   * Delete a snapshot.
   */
  async delete(snapshotName: string): Promise<void> {
    const snapshotPath = path.join(this.snapshotDir, snapshotName)
    if (!fs.existsSync(snapshotPath)) {
      throw new Error(`Snapshot not found: ${snapshotName}`)
    }

    await this.exec(
      `btrfs subvolume delete "${snapshotPath}"`,
      { echo: this.verbose }
    )

    // Remove metadata
    const metaPath = `${snapshotPath}.meta.json`
    if (fs.existsSync(metaPath)) {
      fs.rmSync(metaPath)
    }
  }

  /**
   * Show diff between two snapshots (files changed).
   */
  async diff(snapshot1: string, snapshot2: string): Promise<string> {
    const path1 = path.join(this.snapshotDir, snapshot1)
    const path2 = path.join(this.snapshotDir, snapshot2)

    const result = await this.exec(
      `btrfs send --no-data -p "${path1}" "${path2}" | btrfs receive --dump`,
      { capture: true }
    )

    return result.data
  }
}
