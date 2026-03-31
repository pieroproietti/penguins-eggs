/**
 * plugins/build-infra/st-output/st-output.ts
 * Produces System Transparency compatible boot artifacts.
 *
 * System Transparency (system-transparency/system-transparency) provides
 * verified, reproducible server boot. This plugin generates ST-compatible
 * OS packages from eggs-produced images:
 *
 * - Kernel + initramfs extracted from the ISO
 * - Root filesystem (squashfs or raw)
 * - ST descriptor JSON with hashes
 * - Ed25519 signature
 *
 * The resulting artifact can be served via HTTPS and booted by ST's stboot.
 */

import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

type ExecFn = (cmd: string, opts?: { capture?: boolean; echo?: boolean }) => Promise<{ code: number; data: string; error?: string }>

export interface StDescriptor {
  version: number
  label: string
  kernel: string
  initramfs: string
  root: string
  kernel_hash: string
  initramfs_hash: string
  root_hash: string
  cmdline: string
  timestamp: string
}

export interface StSignResult {
  descriptorPath: string
  signaturePath: string
  bundlePath: string
  descriptor: StDescriptor
}

export class StOutput {
  private exec: ExecFn
  private verbose: boolean

  constructor(exec: ExecFn, verbose = false) {
    this.exec = exec
    this.verbose = verbose
  }

  /**
   * Check if ST tools are available.
   */
  async isAvailable(): Promise<boolean> {
    const stmgr = await this.exec('command -v stmgr', { capture: true })
    return stmgr.code === 0
  }

  /**
   * Extract kernel, initramfs, and root filesystem from an eggs ISO.
   */
  async extractFromIso(isoPath: string, outputDir: string): Promise<{
    kernel: string
    initramfs: string
    rootfs: string
  }> {
    fs.mkdirSync(outputDir, { recursive: true })

    const mountDir = `/tmp/eggs-iso-mount-${Date.now()}`
    fs.mkdirSync(mountDir, { recursive: true })

    try {
      // Mount the ISO
      await this.exec(`mount -o loop,ro "${isoPath}" "${mountDir}"`, { echo: this.verbose })

      // Find kernel
      const kernelResult = await this.exec(
        `find "${mountDir}/live" -name "vmlinuz*" -o -name "vmlinux*" | head -1`,
        { capture: true }
      )
      const kernelSrc = kernelResult.data.trim()

      // Find initramfs
      const initrdResult = await this.exec(
        `find "${mountDir}/live" -name "initrd*" -o -name "initramfs*" | head -1`,
        { capture: true }
      )
      const initrdSrc = initrdResult.data.trim()

      // Find root filesystem
      const rootfsResult = await this.exec(
        `find "${mountDir}/live" -name "filesystem.squashfs" | head -1`,
        { capture: true }
      )
      const rootfsSrc = rootfsResult.data.trim()

      // Copy to output
      const kernel = path.join(outputDir, 'vmlinuz')
      const initramfs = path.join(outputDir, 'initramfs')
      const rootfs = path.join(outputDir, 'rootfs.squashfs')

      if (kernelSrc) fs.copyFileSync(kernelSrc, kernel)
      if (initrdSrc) fs.copyFileSync(initrdSrc, initramfs)
      if (rootfsSrc) fs.copyFileSync(rootfsSrc, rootfs)

      return { kernel, initramfs, rootfs }
    } finally {
      await this.exec(`umount "${mountDir}"`, { capture: true })
      fs.rmSync(mountDir, { recursive: true, force: true })
    }
  }

  /**
   * Compute SHA-256 hash of a file.
   */
  hashFile(filePath: string): string {
    const content = fs.readFileSync(filePath)
    return crypto.createHash('sha256').update(content).digest('hex')
  }

  /**
   * Generate ST descriptor JSON.
   */
  generateDescriptor(
    label: string,
    kernel: string,
    initramfs: string,
    rootfs: string,
    cmdline = 'console=ttyS0'
  ): StDescriptor {
    return {
      version: 1,
      label,
      kernel: path.basename(kernel),
      initramfs: path.basename(initramfs),
      root: path.basename(rootfs),
      kernel_hash: this.hashFile(kernel),
      initramfs_hash: this.hashFile(initramfs),
      root_hash: this.hashFile(rootfs),
      cmdline,
      timestamp: new Date().toISOString(),
    }
  }

  /**
   * Sign the descriptor with an Ed25519 key.
   * Uses stmgr if available, falls back to openssl.
   */
  async sign(descriptorPath: string, keyPath: string): Promise<string> {
    const signaturePath = `${descriptorPath}.sig`

    if (await this.isAvailable()) {
      // Use ST's own signing tool
      await this.exec(
        `stmgr sign -key "${keyPath}" -descriptor "${descriptorPath}" -out "${signaturePath}"`,
        { echo: this.verbose }
      )
    } else {
      // Fallback to openssl Ed25519
      await this.exec(
        `openssl pkeyutl -sign -inkey "${keyPath}" -in "${descriptorPath}" -out "${signaturePath}"`,
        { echo: this.verbose }
      )
    }

    return signaturePath
  }

  /**
   * Generate an Ed25519 key pair for signing.
   */
  async generateKey(outputDir: string): Promise<{ privateKey: string; publicKey: string }> {
    const privateKey = path.join(outputDir, 'signing-key.pem')
    const publicKey = path.join(outputDir, 'signing-key.pub')

    await this.exec(
      `openssl genpkey -algorithm Ed25519 -out "${privateKey}"`,
      { echo: this.verbose }
    )
    await this.exec(
      `openssl pkey -in "${privateKey}" -pubout -out "${publicKey}"`,
      { echo: this.verbose }
    )

    return { privateKey, publicKey }
  }

  /**
   * Create a complete ST-compatible OS package from an eggs ISO.
   */
  async createPackage(
    isoPath: string,
    outputDir: string,
    label: string,
    keyPath?: string
  ): Promise<StSignResult> {
    fs.mkdirSync(outputDir, { recursive: true })

    // Extract components
    const { kernel, initramfs, rootfs } = await this.extractFromIso(isoPath, outputDir)

    // Generate descriptor
    const descriptor = this.generateDescriptor(label, kernel, initramfs, rootfs)
    const descriptorPath = path.join(outputDir, 'descriptor.json')
    fs.writeFileSync(descriptorPath, JSON.stringify(descriptor, null, 2))

    // Sign if key provided
    let signaturePath = ''
    if (keyPath) {
      signaturePath = await this.sign(descriptorPath, keyPath)
    }

    // Create bundle (tar archive of all components)
    const bundlePath = path.join(outputDir, `${label}.stboot`)
    await this.exec(
      `tar -cf "${bundlePath}" -C "${outputDir}" ` +
      `${path.basename(kernel)} ${path.basename(initramfs)} ${path.basename(rootfs)} ` +
      `descriptor.json${signaturePath ? ' descriptor.json.sig' : ''}`,
      { echo: this.verbose }
    )

    return {
      descriptorPath,
      signaturePath,
      bundlePath,
      descriptor,
    }
  }
}
