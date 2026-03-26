/**
 * plugins/build-infra/go-dmverity/go-dmverity.ts
 *
 * dm-verity hash tree generation via go-dmverity.
 *
 * go-dmverity (https://github.com/containerd/go-dmverity) is a pure Go
 * implementation of dm-verity from the containerd project. It provides:
 *   - Merkle tree creation and verification
 *   - SHA1, SHA256, SHA512 hash algorithms
 *   - Superblock and legacy (Chrome OS) formats
 *   - Pure Go device-mapper interface
 *   - Interoperability with standard veritysetup
 *
 * This plugin uses the go-dmverity CLI binary as a subprocess. It is
 * preferred over veritysetup when:
 *   - veritysetup is unavailable (e.g. minimal build environments)
 *   - A static Go binary is easier to embed than cryptsetup
 *   - Programmatic root hash extraction is needed
 *
 * Falls back to veritysetup if go-dmverity binary is not found.
 */

import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import https from 'node:https'

type ExecFn = (cmd: string, opts?: { capture?: boolean; echo?: boolean }) => Promise<{
  code: number
  data: string
  error?: string
}>

export type VerityHashAlgo = 'sha256' | 'sha512' | 'sha1'
export type VerityFormat = 'normal' | 'chromeos'

export interface VerityOptions {
  /** Hash algorithm. Default: sha256. */
  hashAlgo?: VerityHashAlgo
  /** Superblock format. Default: normal. */
  format?: VerityFormat
  /** Salt (hex string). Auto-generated if not set. */
  salt?: string
  /** Data block size in bytes. Default: 4096. */
  dataBlockSize?: number
  /** Hash block size in bytes. Default: 4096. */
  hashBlockSize?: number
  /** Path to go-dmverity binary. Auto-downloaded if not found. */
  binPath?: string
  /** Cache directory for downloaded binary. Default: /var/cache/eggs/go-dmverity. */
  binCacheDir?: string
}

export interface VerityResult {
  /** Root hash of the Merkle tree (hex). */
  rootHash: string
  /** Salt used (hex). */
  salt: string
  /** Hash algorithm used. */
  hashAlgo: VerityHashAlgo
  /** Path to the hash tree file. */
  hashTreePath: string
  /** Number of data blocks. */
  dataBlocks: number
  /** SHA-256 of the data image. */
  dataChecksum: string
}

const GO_DMVERITY_VERSION = '0.1.0'
const GO_DMVERITY_BASE_URL = `https://github.com/containerd/go-dmverity/releases/download/v${GO_DMVERITY_VERSION}`

const ARCH_MAP: Record<string, string> = {
  x64: 'linux-amd64',
  arm64: 'linux-arm64',
}

export class GoDmverity {
  private exec: ExecFn
  private verbose: boolean
  private opts: Required<VerityOptions>

  constructor(exec: ExecFn, verbose = false, opts: VerityOptions = {}) {
    this.exec = exec
    this.verbose = verbose
    this.opts = {
      hashAlgo: opts.hashAlgo ?? 'sha256',
      format: opts.format ?? 'normal',
      salt: opts.salt ?? '',
      dataBlockSize: opts.dataBlockSize ?? 4096,
      hashBlockSize: opts.hashBlockSize ?? 4096,
      binPath: opts.binPath ?? 'go-dmverity',
      binCacheDir: opts.binCacheDir ?? '/var/cache/eggs/go-dmverity',
    }
  }

  /**
   * Check if go-dmverity CLI is available on PATH or in cache.
   */
  async isAvailable(): Promise<boolean> {
    const pathCheck = await this.exec('command -v go-dmverity', { capture: true })
    if (pathCheck.code === 0) return true
    return fs.existsSync(path.join(this.opts.binCacheDir, 'go-dmverity'))
  }

  /**
   * Check if veritysetup is available as a fallback.
   */
  async isVeritysetupAvailable(): Promise<boolean> {
    const result = await this.exec('command -v veritysetup', { capture: true })
    return result.code === 0
  }

  /**
   * Resolve the go-dmverity binary, downloading if necessary.
   * Falls back to veritysetup if go-dmverity cannot be obtained.
   */
  async resolveBin(): Promise<{ bin: string; isGoDmverity: boolean }> {
    // Check PATH
    const pathCheck = await this.exec('command -v go-dmverity', { capture: true })
    if (pathCheck.code === 0) return { bin: 'go-dmverity', isGoDmverity: true }

    // Check cache
    const cached = path.join(this.opts.binCacheDir, 'go-dmverity')
    if (fs.existsSync(cached)) return { bin: cached, isGoDmverity: true }

    // Try to download
    try {
      const bin = await this.downloadBinary()
      return { bin, isGoDmverity: true }
    } catch {
      // Fall back to veritysetup
      if (await this.isVeritysetupAvailable()) {
        if (this.verbose) console.log('go-dmverity: falling back to veritysetup')
        return { bin: 'veritysetup', isGoDmverity: false }
      }
      throw new Error(
        'Neither go-dmverity nor veritysetup found.\n' +
        'Install cryptsetup: apt install cryptsetup-bin\n' +
        'Or go-dmverity will be downloaded automatically on next run.'
      )
    }
  }

  private async downloadBinary(): Promise<string> {
    const arch = ARCH_MAP[process.arch]
    if (!arch) throw new Error(`Unsupported arch for go-dmverity download: ${process.arch}`)

    fs.mkdirSync(this.opts.binCacheDir, { recursive: true })
    const binName = `go-dmverity_${GO_DMVERITY_VERSION}_${arch}`
    const url = `${GO_DMVERITY_BASE_URL}/${binName}`
    const dest = path.join(this.opts.binCacheDir, 'go-dmverity')

    if (this.verbose) console.log(`Downloading go-dmverity from ${url}`)
    await this.downloadFile(url, dest)
    fs.chmodSync(dest, 0o755)
    return dest
  }

  private downloadFile(url: string, dest: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(dest)
      const request = (u: string) => {
        https.get(u, (res) => {
          if (res.statusCode === 301 || res.statusCode === 302) {
            file.close()
            request(res.headers.location!)
            return
          }
          if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode} downloading ${u}`))
            return
          }
          res.pipe(file)
          file.on('finish', () => { file.close(); resolve() })
        }).on('error', reject)
      }
      request(url)
    })
  }

  /**
   * Generate a dm-verity hash tree for a data image.
   *
   * @param dataImage   Path to the data image (SquashFS, EROFS, DwarFS, etc.)
   * @param hashTree    Path to write the hash tree (appended or separate file)
   */
  async format(dataImage: string, hashTree: string): Promise<VerityResult> {
    const { bin, isGoDmverity } = await this.resolveBin()

    let rootHash: string
    let salt: string

    if (isGoDmverity) {
      const args = [
        'format',
        '--hash-algo', this.opts.hashAlgo,
        '--data-block-size', String(this.opts.dataBlockSize),
        '--hash-block-size', String(this.opts.hashBlockSize),
        '--format', this.opts.format === 'chromeos' ? '0' : '1',
      ]
      if (this.opts.salt) args.push('--salt', this.opts.salt)
      args.push(dataImage, hashTree)

      const result = await this.exec(`"${bin}" ${args.join(' ')}`, { capture: true })
      if (result.code !== 0) {
        throw new Error(`go-dmverity format failed: ${result.error ?? result.data}`)
      }

      // Parse output: "Root hash: <hex>\nSalt: <hex>"
      const rootMatch = result.data.match(/Root hash:\s+([0-9a-f]+)/i)
      const saltMatch = result.data.match(/Salt:\s+([0-9a-f]+)/i)
      rootHash = rootMatch?.[1] ?? ''
      salt = saltMatch?.[1] ?? ''
    } else {
      // veritysetup fallback
      const args = [
        'format',
        '--hash', this.opts.hashAlgo,
        '--data-block-size', String(this.opts.dataBlockSize),
        '--hash-block-size', String(this.opts.hashBlockSize),
      ]
      if (this.opts.salt) args.push('--salt', this.opts.salt)
      args.push(dataImage, hashTree)

      const result = await this.exec(`veritysetup ${args.join(' ')}`, { capture: true })
      if (result.code !== 0) {
        throw new Error(`veritysetup format failed: ${result.error ?? result.data}`)
      }

      const rootMatch = result.data.match(/Root hash:\s+([0-9a-f]+)/i)
      const saltMatch = result.data.match(/Salt:\s+([0-9a-f]+)/i)
      rootHash = rootMatch?.[1] ?? ''
      salt = saltMatch?.[1] ?? ''
    }

    if (!rootHash) throw new Error('Could not extract root hash from verity output')

    // Count data blocks
    const stat = fs.statSync(dataImage)
    const dataBlocks = Math.ceil(stat.size / this.opts.dataBlockSize)

    const dataChecksum = await this.sha256(dataImage)

    if (this.verbose) {
      console.log(`dm-verity: root hash: ${rootHash}`)
      console.log(`dm-verity: salt: ${salt}`)
      console.log(`dm-verity: data blocks: ${dataBlocks}`)
    }

    return {
      rootHash,
      salt,
      hashAlgo: this.opts.hashAlgo,
      hashTreePath: hashTree,
      dataBlocks,
      dataChecksum,
    }
  }

  /**
   * Verify a data image against its hash tree and root hash.
   */
  async verify(dataImage: string, hashTree: string, rootHash: string): Promise<boolean> {
    const { bin, isGoDmverity } = await this.resolveBin()

    let result: { code: number; data: string }
    if (isGoDmverity) {
      result = await this.exec(
        `"${bin}" verify --root-hash "${rootHash}" "${dataImage}" "${hashTree}"`,
        { capture: true }
      )
    } else {
      result = await this.exec(
        `veritysetup verify "${dataImage}" "${hashTree}" "${rootHash}"`,
        { capture: true }
      )
    }

    return result.code === 0
  }

  /**
   * Dump hash tree metadata.
   */
  async dump(dataImage: string, hashTree: string): Promise<string> {
    const { bin, isGoDmverity } = await this.resolveBin()

    let result: { code: number; data: string; error?: string }
    if (isGoDmverity) {
      result = await this.exec(`"${bin}" dump "${dataImage}" "${hashTree}"`, { capture: true })
    } else {
      result = await this.exec(`veritysetup dump "${dataImage}" "${hashTree}"`, { capture: true })
    }

    if (result.code !== 0) {
      throw new Error(`dump failed: ${result.error ?? result.data}`)
    }
    return result.data
  }

  private sha256(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256')
      const stream = fs.createReadStream(filePath)
      stream.on('data', d => hash.update(d))
      stream.on('end', () => resolve(hash.digest('hex')))
      stream.on('error', reject)
    })
  }
}
