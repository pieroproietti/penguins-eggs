/**
 * plugins/build-infra/verity-squash/verity-squash.ts
 *
 * dm-verity + SquashFS + Secure Boot UKI integration for eggs produce.
 *
 * Wraps verity-squash-root (https://github.com/brandsimon/verity-squash-root)
 * to produce tamper-evident, Secure Boot-signed ISOs from eggs-produced
 * SquashFS images. The chain of trust is:
 *
 *   UEFI firmware → signed UKI (EFI binary) → dm-verity Merkle tree → SquashFS rootfs
 *
 * On boot the UKI verifies the SquashFS via dm-verity before mounting it.
 * An attacker who modifies the rootfs on disk will cause boot to fail.
 *
 * A/B image support: two image slots (A/B) so updates never overwrite the
 * currently booted image. Rollback to the previous known-good image is
 * always available.
 *
 * Supports both tmpfs overlay (volatile — changes discarded on reboot) and
 * persistent overlay (changes saved to disk).
 */

import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

type ExecFn = (cmd: string, opts?: { capture?: boolean; echo?: boolean }) => Promise<{
  code: number
  data: string
  error?: string
}>

export interface VeritySquashOptions {
  /** Path to the EFI partition mount point. Default: /boot/efi */
  efiPartition?: string
  /** Path to the root partition mount point. Default: /mnt/root */
  rootMount?: string
  /** Kernel cmdline. Falls back to /etc/kernel/cmdline if unset. */
  cmdline?: string
  /** Path to the EFI stub (default: auto-detect systemd-stub). */
  efiStub?: string
  /** Command to decrypt Secure Boot keys tarfile. {} = output tar path. */
  decryptKeysCmd?: string
  /** Directories to exclude from the SquashFS image. */
  excludeDirs?: string[]
  /** Ignore warnings (needed when not yet booted into a verified image). */
  ignoreWarnings?: boolean
}

export interface VerityBuildResult {
  /** Path to the A-slot SquashFS image. */
  squashfsA: string
  /** Path to the A-slot dm-verity hash tree. */
  verityA: string
  /** Path to the signed EFI binary for A slot. */
  efiA: string
  /** Root hash of the dm-verity Merkle tree. */
  rootHash: string
  /** SHA-256 of the SquashFS image. */
  squashfsChecksum: string
}

export interface VerityKeyPair {
  privateKey: string
  publicKey: string
  /** Public key tarball for import into UEFI firmware. */
  publicKeysTar: string
}

export class VeritySquash {
  private exec: ExecFn
  private verbose: boolean
  private opts: Required<VeritySquashOptions>

  constructor(exec: ExecFn, verbose = false, opts: VeritySquashOptions = {}) {
    this.exec = exec
    this.verbose = verbose
    this.opts = {
      efiPartition: opts.efiPartition ?? '/boot/efi',
      rootMount: opts.rootMount ?? '/mnt/root',
      cmdline: opts.cmdline ?? '',
      efiStub: opts.efiStub ?? '',
      decryptKeysCmd: opts.decryptKeysCmd ?? '',
      excludeDirs: opts.excludeDirs ?? [],
      ignoreWarnings: opts.ignoreWarnings ?? false,
    }
  }

  /**
   * Check if verity-squash-root is installed.
   */
  async isAvailable(): Promise<boolean> {
    const result = await this.exec('command -v verity-squash-root', { capture: true })
    return result.code === 0
  }

  /**
   * Check if all required dependencies are present.
   * Returns a list of missing tools.
   */
  async checkDependencies(): Promise<string[]> {
    const required = [
      'mksquashfs',
      'veritysetup',
      'objcopy',
      'sbsign',
      'openssl',
    ]
    const missing: string[] = []
    for (const tool of required) {
      const r = await this.exec(`command -v ${tool}`, { capture: true })
      if (r.code !== 0) missing.push(tool)
    }
    return missing
  }

  /**
   * Generate Secure Boot key pair for signing UKIs.
   * Keys are stored encrypted with `age` if available.
   *
   * @param outputDir  Directory to store keys (default: /etc/verity_squash_root)
   */
  async createKeys(outputDir = '/etc/verity_squash_root'): Promise<VerityKeyPair> {
    fs.mkdirSync(outputDir, { recursive: true })

    const warnings = this.opts.ignoreWarnings ? '--ignore-warnings' : ''
    const result = await this.exec(
      `verity-squash-root ${warnings} create-keys`,
      { echo: this.verbose }
    )
    if (result.code !== 0) {
      throw new Error(`verity-squash-root create-keys failed: ${result.error ?? result.data}`)
    }

    return {
      privateKey: path.join(outputDir, 'keys.tar.age'),
      publicKey: path.join(outputDir, 'public_keys.tar'),
      publicKeysTar: path.join(outputDir, 'public_keys.tar'),
    }
  }

  /**
   * Write a verity-squash-root config file.
   */
  writeConfig(configPath = '/etc/verity_squash_root/config.ini'): void {
    fs.mkdirSync(path.dirname(configPath), { recursive: true })

    const lines: string[] = ['[DEFAULT]']

    if (this.opts.cmdline) {
      lines.push(`CMDLINE = ${this.opts.cmdline}`)
    }
    if (this.opts.efiStub) {
      lines.push(`EFI_STUB = ${this.opts.efiStub}`)
    }
    if (this.opts.decryptKeysCmd) {
      lines.push(`DECRYPT_SECURE_BOOT_KEYS_CMD = ${this.opts.decryptKeysCmd}`)
    }
    if (this.opts.excludeDirs.length > 0) {
      lines.push(`EXCLUDE_DIRS = ${this.opts.excludeDirs.join(' ')}`)
    }
    lines.push(`EFI_PARTITION = ${this.opts.efiPartition}`)
    lines.push(`ROOT_MOUNT = ${this.opts.rootMount}`)

    fs.writeFileSync(configPath, lines.join('\n') + '\n')
    if (this.verbose) console.log(`verity-squash-root config written: ${configPath}`)
  }

  /**
   * Install systemd-boot and create UEFI boot entry.
   */
  async setupBoot(method: 'systemd' | 'uefi' = 'systemd', device?: string, partNum?: number): Promise<void> {
    const warnings = this.opts.ignoreWarnings ? '--ignore-warnings' : ''
    let cmd: string

    if (method === 'systemd') {
      cmd = `verity-squash-root ${warnings} setup systemd`
    } else {
      if (!device || partNum === undefined) {
        throw new Error('device and partNum required for uefi setup')
      }
      cmd = `verity-squash-root ${warnings} setup uefi ${device} ${partNum}`
    }

    const result = await this.exec(cmd, { echo: this.verbose })
    if (result.code !== 0) {
      throw new Error(`verity-squash-root setup failed: ${result.error ?? result.data}`)
    }
  }

  /**
   * Build a new SquashFS image with dm-verity hash tree and signed UKI.
   *
   * This is the main production step. It:
   * 1. Creates a SquashFS image of the rootfs
   * 2. Appends a dm-verity Merkle tree
   * 3. Embeds the root hash into a UKI
   * 4. Signs the UKI with Secure Boot keys
   * 5. Writes the signed EFI binary to the EFI partition
   */
  async build(): Promise<VerityBuildResult> {
    const warnings = this.opts.ignoreWarnings ? '--ignore-warnings' : ''
    const result = await this.exec(
      `verity-squash-root ${warnings} build`,
      { echo: this.verbose }
    )
    if (result.code !== 0) {
      throw new Error(`verity-squash-root build failed: ${result.error ?? result.data}`)
    }

    // Locate the produced artifacts
    const rootMount = this.opts.rootMount
    const squashfsA = path.join(rootMount, 'image_a.squashfs')
    const verityA = path.join(rootMount, 'image_a.squashfs.verity')

    // Extract root hash from verity file
    const rootHash = await this.extractRootHash(squashfsA, verityA)

    // Checksum the squashfs
    const squashfsChecksum = await this.sha256(squashfsA)

    // Find the signed EFI binary on the EFI partition
    const efiA = await this.findEfi('a')

    return { squashfsA, verityA, efiA, rootHash, squashfsChecksum }
  }

  /**
   * List all EFI images that will be created (or are excluded).
   */
  async list(): Promise<string> {
    const result = await this.exec('verity-squash-root list', { capture: true })
    return result.data
  }

  /**
   * Sign extra EFI files (e.g. systemd-boot itself) with the Secure Boot keys.
   */
  async signExtraFiles(): Promise<void> {
    const result = await this.exec('verity-squash-root sign_extra_files', { echo: this.verbose })
    if (result.code !== 0) {
      throw new Error(`sign_extra_files failed: ${result.error ?? result.data}`)
    }
  }

  /**
   * Produce a verity-squash-root config suitable for embedding in an eggs ISO.
   * The ISO will boot into a dm-verity verified SquashFS rootfs.
   */
  async produceVerifiedIso(
    squashfsPath: string,
    efiPartitionDir: string,
    keyPath: string
  ): Promise<{ rootHash: string; verityPath: string; efiPath: string }> {
    // Step 1: Generate dm-verity hash tree
    const verityPath = `${squashfsPath}.verity`
    const verityResult = await this.exec(
      `veritysetup format "${squashfsPath}" "${verityPath}"`,
      { capture: true }
    )
    if (verityResult.code !== 0) {
      throw new Error(`veritysetup format failed: ${verityResult.error ?? verityResult.data}`)
    }

    // Extract root hash from veritysetup output
    const rootHashMatch = verityResult.data.match(/Root hash:\s+([0-9a-f]+)/i)
    if (!rootHashMatch) {
      throw new Error('Could not extract root hash from veritysetup output')
    }
    const rootHash = rootHashMatch[1]

    if (this.verbose) console.log(`dm-verity root hash: ${rootHash}`)

    // Step 2: Build UKI with root hash embedded in cmdline
    const cmdline = `${this.opts.cmdline} rd.verity.root=${rootHash} rd.verity.data=/dev/disk/by-label/eggs-rootfs rd.verity.hash=/dev/disk/by-label/eggs-verity`
    const efiPath = path.join(efiPartitionDir, 'EFI', 'Linux', 'eggs-verified.efi')
    fs.mkdirSync(path.dirname(efiPath), { recursive: true })

    // Find EFI stub
    const stub = await this.findEfiStub()
    const kernel = await this.findKernel()
    const initrd = await this.findInitrd()

    // Write cmdline to temp file
    const cmdlineFile = `/tmp/eggs-verity-cmdline-${Date.now()}`
    fs.writeFileSync(cmdlineFile, cmdline)

    try {
      // Build UKI via objcopy
      await this.exec(
        `objcopy ` +
        `--add-section .osrel=/etc/os-release --change-section-vma .osrel=0x20000 ` +
        `--add-section .cmdline="${cmdlineFile}" --change-section-vma .cmdline=0x30000 ` +
        `--add-section .initrd="${initrd}" --change-section-vma .initrd=0x3000000 ` +
        `--add-section .linux="${kernel}" --change-section-vma .linux=0x2000000 ` +
        `"${stub}" "${efiPath}"`,
        { echo: this.verbose }
      )

      // Step 3: Sign the UKI
      await this.exec(
        `sbsign --key "${keyPath}" --cert "${keyPath.replace('.key', '.crt')}" ` +
        `--output "${efiPath}" "${efiPath}"`,
        { echo: this.verbose }
      )
    } finally {
      fs.rmSync(cmdlineFile, { force: true })
    }

    return { rootHash, verityPath, efiPath }
  }

  private async extractRootHash(squashfsPath: string, verityPath: string): Promise<string> {
    const result = await this.exec(
      `veritysetup dump "${squashfsPath}" "${verityPath}" 2>/dev/null | grep "Root hash"`,
      { capture: true }
    )
    const match = result.data.match(/Root hash:\s+([0-9a-f]+)/i)
    return match ? match[1] : ''
  }

  private async findEfi(slot: 'a' | 'b'): Promise<string> {
    const result = await this.exec(
      `find "${this.opts.efiPartition}" -name "*_${slot}.efi" | head -1`,
      { capture: true }
    )
    return result.data.trim()
  }

  private async findEfiStub(): Promise<string> {
    if (this.opts.efiStub && fs.existsSync(this.opts.efiStub)) return this.opts.efiStub
    const candidates = [
      '/usr/lib/systemd/boot/efi/linuxx64.efi.stub',
      '/usr/lib/gummiboot/linuxx64.efi.stub',
    ]
    for (const c of candidates) {
      if (fs.existsSync(c)) return c
    }
    throw new Error('EFI stub not found. Install systemd-boot.')
  }

  private async findKernel(): Promise<string> {
    const result = await this.exec(
      `find /boot -maxdepth 1 -name "vmlinuz*" | sort -V | tail -1`,
      { capture: true }
    )
    const k = result.data.trim()
    if (!k || !fs.existsSync(k)) throw new Error('Kernel not found in /boot')
    return k
  }

  private async findInitrd(): Promise<string> {
    const result = await this.exec(
      `find /boot -maxdepth 1 -name "initrd*" -o -name "initramfs*" | sort -V | tail -1`,
      { capture: true }
    )
    const i = result.data.trim()
    if (!i || !fs.existsSync(i)) throw new Error('Initrd not found in /boot')
    return i
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
