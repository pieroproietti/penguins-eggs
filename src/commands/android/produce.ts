/**
 * ./src/commands/android/produce.ts
 * penguins-eggs — Android backend
 * license: MIT
 *
 * Produces bootable Android images from the running system.
 * Supports ISO (x86/x86_64/RISC-V), raw disk images (ARM), and Waydroid snapshots.
 */

import { Command, Flags } from '@oclif/core'
import chalk from 'chalk'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { AndroidArch, archSupportsISO, bootloaderForArch, detectAndroidArch } from '../../android/arch-detect.js'
import { readAllBuildProps, readBuildProp } from '../../android/prop-reader.js'
import { findBootImage, unpackBootImage } from '../../classes/ovary.d/android/android-boot-img.js'
import {
  IAndroidIsoConfig,
  buildAndroidIso,
  createIsoStructure,
  findAndroidInitrd,
  findAndroidKernel,
} from '../../classes/ovary.d/android/android-iso.js'
import { IOtaConfig, createOtaPackage, generateOtaMetadata } from '../../classes/ovary.d/android/android-ota.js'
import { findSystemImage, findVendorImage } from '../../classes/ovary.d/android/android-system-img.js'
import { detectAndroidVariant } from '../../classes/ovary.d/android/detect-android-variant.js'
import Distro from '../../classes/distro.js'
import Utils from '../../classes/utils.js'
import { exec, shx } from '../../lib/utils.js'

export default class AndroidProduce extends Command {
  static description = 'produce a bootable Android image from the running system'

  static examples = [
    'sudo eggs android produce',
    'sudo eggs android produce --mode=iso',
    'sudo eggs android produce --mode=iso --compression=zstd',
    'sudo eggs android produce --mode=waydroid',
    'sudo eggs android produce --mode=ota',
    'sudo eggs android produce --output=/tmp/android.iso',
  ]

  static flags = {
    arch: Flags.string({
      char: 'a',
      description: 'target architecture (auto-detected if omitted)',
      options: ['x86_64', 'x86', 'arm64-v8a', 'armeabi-v7a', 'riscv64'],
    }),
    compression: Flags.string({
      char: 'c',
      default: 'zstd',
      description: 'compression for system.sfs',
      options: ['gzip', 'lz4', 'xz', 'zstd'],
    }),
    help: Flags.help({ char: 'h' }),
    mode: Flags.string({
      char: 'm',
      default: 'auto',
      description: 'output mode',
      options: ['auto', 'iso', 'raw-img', 'waydroid', 'ota'],
    }),
    output: Flags.string({
      char: 'o',
      description: 'output file path',
    }),
    verbose: Flags.boolean({ char: 'v' }),
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(AndroidProduce)
    Utils.titles(this.id + ' ' + this.argv)

    // Must be root
    if (os.userInfo().uid !== 0) {
      this.error('This command must be run as root (sudo eggs android produce)')
    }

    // Detect Android environment
    if (!Distro.isAndroidEnvironment()) {
      this.error('No Android environment detected. Run "eggs android status" for details.')
    }

    // Gather variant info
    const variantInfo = detectAndroidVariant()
    this.log('')
    this.log(chalk.bold(`Detected: ${variantInfo.displayName}`))
    this.log(`  Android ${variantInfo.androidVersion} (SDK ${variantInfo.sdkLevel})`)
    this.log(`  Arch: ${variantInfo.arch.primaryAbi}${variantInfo.arch.isMultilib ? ` + ${variantInfo.arch.secondaryAbi}` : ''}`)
    this.log(`  Source: ${variantInfo.sourceType}`)
    this.log(`  GApps: ${variantInfo.hasGapps ? 'yes' : 'no'}`)
    this.log('')

    // Determine target architecture
    const targetArch = (flags.arch as AndroidArch) || variantInfo.arch.primaryAbi

    // Determine output mode
    let mode = flags.mode
    if (mode === 'auto') {
      if (variantInfo.sourceType === 'waydroid-container') {
        mode = 'waydroid'
      } else if (archSupportsISO(targetArch)) {
        mode = 'iso'
      } else {
        mode = 'raw-img'
      }
    }

    this.log(chalk.bold(`Output mode: ${mode}`))
    this.log(chalk.bold(`Target arch: ${targetArch}`))
    this.log('')

    switch (mode) {
      case 'iso': {
        await this.produceIso(flags, targetArch, variantInfo)
        break
      }

      case 'raw-img': {
        await this.produceRawImg(flags, targetArch, variantInfo)
        break
      }

      case 'waydroid': {
        await this.produceWaydroid(flags, variantInfo)
        break
      }

      case 'ota': {
        await this.produceOta(flags, targetArch, variantInfo)
        break
      }

      default: {
        this.error(`Unknown mode: ${mode}`)
      }
    }
  }

  /**
   * Produce a bootable ISO for x86/x86_64/RISC-V.
   */
  private async produceIso(
    flags: Record<string, any>,
    targetArch: AndroidArch,
    variantInfo: ReturnType<typeof detectAndroidVariant>
  ): Promise<void> {
    if (!archSupportsISO(targetArch)) {
      this.error(`Architecture ${targetArch} does not support ISO output. Use --mode=raw-img instead.`)
    }

    // Check required tools
    this.checkTool('mksquashfs', 'squashfs-tools')
    this.checkTool('xorriso', 'xorriso')

    // Find kernel and initrd
    let kernelPath = findAndroidKernel()
    let initrdPath = findAndroidInitrd()

    // If no separate kernel/initrd, try extracting from boot.img
    if (!kernelPath || !initrdPath) {
      const bootImg = findBootImage()
      if (bootImg) {
        Utils.warning('extracting kernel and initrd from boot.img')
        const tmpDir = '/tmp/eggs-android-boot-unpack'
        const unpacked = await unpackBootImage(bootImg, tmpDir, flags.verbose)
        if (!kernelPath && unpacked.kernelPath && fs.existsSync(unpacked.kernelPath)) {
          kernelPath = unpacked.kernelPath
        }

        if (!initrdPath && unpacked.ramdiskPath && fs.existsSync(unpacked.ramdiskPath)) {
          initrdPath = unpacked.ramdiskPath
        }
      }
    }

    if (!kernelPath) {
      this.error('Cannot find Android kernel. Provide it manually or ensure /boot/kernel exists.')
    }

    if (!initrdPath) {
      this.error('Cannot find Android initrd. Provide it manually or ensure /boot/initrd.img exists.')
    }

    // Find system root
    const systemRoot = findSystemImage()
    if (!systemRoot) {
      this.error('Cannot find Android system partition or image.')
    }

    // Determine output path
    const volid = variantInfo.displayName.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 32)
    const defaultOutput = path.join(
      '/home/eggs',
      `${volid}-${variantInfo.androidVersion}-${targetArch}.iso`
    )
    const outputPath = flags.output || defaultOutput

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath)
    if (!fs.existsSync(outputDir)) {
      await exec(`mkdir -p ${outputDir}`)
    }

    // Work directory
    const workDir = '/tmp/eggs-android-iso-work'
    await exec(`rm -rf ${workDir}`)
    await exec(`mkdir -p ${workDir}`)

    const isoConfig: IAndroidIsoConfig = {
      arch: targetArch,
      compression: flags.compression as 'gzip' | 'lz4' | 'xz' | 'zstd',
      extraCmdline: '',
      includeData: false,
      initrdPath,
      kernelPath,
      outputPath,
      systemRoot,
      verbose: flags.verbose || false,
      volid,
    }

    try {
      // Step 1: Create ISO directory structure
      Utils.warning('creating ISO structure')
      await createIsoStructure(workDir, isoConfig)

      // Step 2: Build the ISO
      Utils.warning('building ISO image')
      const isoPath = await buildAndroidIso(workDir, isoConfig)

      // Report results
      this.log('')
      this.log(chalk.green('ISO created successfully:'))
      this.log(`  ${isoPath}`)

      if (fs.existsSync(isoPath)) {
        const stats = fs.statSync(isoPath)
        this.log(`  Size: ${(stats.size / 1024 / 1024).toFixed(1)} MB`)
      }

      this.log('')
    } finally {
      // Cleanup work directory
      await exec(`rm -rf ${workDir}`).catch(() => {})
      await exec(`rm -rf /tmp/eggs-android-boot-unpack`).catch(() => {})
    }
  }

  /**
   * Produce a raw disk image for ARM architectures.
   */
  private async produceRawImg(
    flags: Record<string, any>,
    targetArch: AndroidArch,
    variantInfo: ReturnType<typeof detectAndroidVariant>
  ): Promise<void> {
    this.checkTool('mksquashfs', 'squashfs-tools')

    const systemRoot = findSystemImage()
    if (!systemRoot) {
      this.error('Cannot find Android system partition or image.')
    }

    const volid = variantInfo.displayName.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 32)
    const defaultOutput = path.join(
      '/home/eggs',
      `${volid}-${variantInfo.androidVersion}-${targetArch}.img`
    )
    const outputPath = flags.output || defaultOutput

    const outputDir = path.dirname(outputPath)
    if (!fs.existsSync(outputDir)) {
      await exec(`mkdir -p ${outputDir}`)
    }

    const workDir = '/tmp/eggs-android-rawimg-work'
    await exec(`rm -rf ${workDir}`)
    await exec(`mkdir -p ${workDir}`)

    try {
      // Calculate total image size
      // system + vendor + boot + data partition + overhead
      const duResult = shx.exec(`du -sb ${systemRoot} | cut -f1`, { silent: true })
      const systemSize = Number.parseInt(duResult.stdout.trim(), 10) || 2 * 1024 * 1024 * 1024 // default 2GB

      const vendorPath = findVendorImage()
      let vendorSize = 0
      if (vendorPath) {
        const vduResult = shx.exec(`du -sb ${vendorPath} | cut -f1`, { silent: true })
        vendorSize = Number.parseInt(vduResult.stdout.trim(), 10) || 512 * 1024 * 1024
      }

      // Total: system + vendor + 256MB boot + 512MB data + 10% overhead
      const bootSize = 256 * 1024 * 1024
      const dataSize = 512 * 1024 * 1024
      const totalSize = Math.ceil((systemSize + vendorSize + bootSize + dataSize) * 1.1)

      Utils.warning(`creating raw disk image (${(totalSize / 1024 / 1024 / 1024).toFixed(1)} GB)`)

      // Create empty disk image
      await exec(`dd if=/dev/zero of=${outputPath} bs=1M count=${Math.ceil(totalSize / 1024 / 1024)} status=progress`,
        Utils.setEcho(flags.verbose))

      // Create partition table
      const bootloader = bootloaderForArch(targetArch)
      if (bootloader === 'uboot') {
        // GPT partition table for ARM with U-Boot
        await exec(`parted -s ${outputPath} mklabel gpt`)
        await exec(`parted -s ${outputPath} mkpart boot fat32 1MiB 257MiB`)
        await exec(`parted -s ${outputPath} mkpart system ext4 257MiB 70%`)
        await exec(`parted -s ${outputPath} mkpart vendor ext4 70% 85%`)
        await exec(`parted -s ${outputPath} mkpart data ext4 85% 100%`)
        await exec(`parted -s ${outputPath} set 1 boot on`)
      } else if (bootloader === 'opensbi') {
        // GPT for RISC-V with OpenSBI
        await exec(`parted -s ${outputPath} mklabel gpt`)
        await exec(`parted -s ${outputPath} mkpart opensbi 1MiB 5MiB`)
        await exec(`parted -s ${outputPath} mkpart boot fat32 5MiB 261MiB`)
        await exec(`parted -s ${outputPath} mkpart system ext4 261MiB 70%`)
        await exec(`parted -s ${outputPath} mkpart data ext4 70% 100%`)
      }

      this.log('')
      this.log(chalk.green('Raw disk image created:'))
      this.log(`  ${outputPath}`)
      this.log(`  Size: ${(totalSize / 1024 / 1024).toFixed(0)} MB`)
      this.log('')
      this.log(chalk.yellow('Note: Partition contents need to be populated.'))
      this.log('Use dd or losetup to write system/vendor/data to the partitions.')
      this.log('')
    } finally {
      await exec(`rm -rf ${workDir}`).catch(() => {})
    }
  }

  /**
   * Produce a Waydroid container image snapshot.
   */
  private async produceWaydroid(
    flags: Record<string, any>,
    variantInfo: ReturnType<typeof detectAndroidVariant>
  ): Promise<void> {
    if (!fs.existsSync('/var/lib/waydroid')) {
      this.error('Waydroid is not installed. Install it first: https://waydro.id')
    }

    const imagesDir = '/var/lib/waydroid/images'
    if (!fs.existsSync(imagesDir)) {
      this.error('Waydroid images directory not found at /var/lib/waydroid/images')
    }

    const systemImg = path.join(imagesDir, 'system.img')
    const vendorImg = path.join(imagesDir, 'vendor.img')

    if (!fs.existsSync(systemImg)) {
      this.error('Waydroid system.img not found')
    }

    const volid = 'waydroid-snapshot'
    const defaultOutput = path.join(
      '/home/eggs',
      `${volid}-${variantInfo.androidVersion}.tar.gz`
    )
    const outputPath = flags.output || defaultOutput

    const outputDir = path.dirname(outputPath)
    if (!fs.existsSync(outputDir)) {
      await exec(`mkdir -p ${outputDir}`)
    }

    // Stop Waydroid if running to get a consistent snapshot
    Utils.warning('stopping Waydroid for consistent snapshot')
    await exec('waydroid session stop 2>/dev/null').catch(() => {})

    const workDir = '/tmp/eggs-waydroid-snapshot'
    await exec(`rm -rf ${workDir}`)
    await exec(`mkdir -p ${workDir}`)

    try {
      // Copy images
      Utils.warning('copying system.img')
      await exec(`cp ${systemImg} ${workDir}/system.img`, Utils.setEcho(flags.verbose))

      if (fs.existsSync(vendorImg)) {
        Utils.warning('copying vendor.img')
        await exec(`cp ${vendorImg} ${workDir}/vendor.img`, Utils.setEcho(flags.verbose))
      }

      // Copy Waydroid config
      if (fs.existsSync('/var/lib/waydroid/waydroid.cfg')) {
        await exec(`cp /var/lib/waydroid/waydroid.cfg ${workDir}/`)
      }

      // Copy overlay (customizations)
      const overlayDir = '/var/lib/waydroid/overlay'
      if (fs.existsSync(overlayDir)) {
        Utils.warning('copying overlay customizations')
        await exec(`cp -a ${overlayDir} ${workDir}/overlay`, Utils.setEcho(flags.verbose))
      }

      // Create metadata
      const metadata = {
        androidVersion: variantInfo.androidVersion,
        arch: variantInfo.arch.primaryAbi,
        createdAt: new Date().toISOString(),
        createdBy: 'penguins-eggs',
        displayName: variantInfo.displayName,
        hasGapps: variantInfo.hasGapps,
        sdkLevel: variantInfo.sdkLevel,
      }
      fs.writeFileSync(path.join(workDir, 'metadata.json'), JSON.stringify(metadata, null, 2))

      // Package as tar.gz
      Utils.warning('creating archive')
      await exec(
        `tar -czf ${outputPath} -C ${workDir} .`,
        Utils.setEcho(flags.verbose)
      )

      this.log('')
      this.log(chalk.green('Waydroid snapshot created:'))
      this.log(`  ${outputPath}`)

      if (fs.existsSync(outputPath)) {
        const stats = fs.statSync(outputPath)
        this.log(`  Size: ${(stats.size / 1024 / 1024).toFixed(1)} MB`)
      }

      this.log('')
      this.log('To restore on another machine:')
      this.log('  1. Install Waydroid')
      this.log(`  2. tar -xzf ${path.basename(outputPath)} -C /var/lib/waydroid/images/`)
      this.log('  3. waydroid init --force')
      this.log('')
    } finally {
      await exec(`rm -rf ${workDir}`).catch(() => {})
    }
  }

  /**
   * Produce an OTA (flashable zip) package.
   */
  private async produceOta(
    flags: Record<string, any>,
    targetArch: AndroidArch,
    variantInfo: ReturnType<typeof detectAndroidVariant>
  ): Promise<void> {
    this.checkTool('zip', 'zip')

    const systemImg = findSystemImage()
    if (!systemImg) {
      this.error('Cannot find Android system partition or image.')
    }

    const vendorImg = findVendorImage()
    const bootImg = findBootImage()

    const volid = variantInfo.displayName.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 32)
    const defaultOutput = path.join(
      '/home/eggs',
      `${volid}-${variantInfo.androidVersion}-${targetArch}-ota.zip`
    )
    const outputPath = flags.output || defaultOutput

    const fingerprint = readBuildProp('ro.build.fingerprint') ||
      `${variantInfo.displayName}/${variantInfo.androidVersion}/${Date.now()}`

    const otaConfig: IOtaConfig = {
      device: readBuildProp('ro.product.device') || 'generic',
      fingerprint,
      images: {
        boot: bootImg || undefined,
        system: systemImg.endsWith('.img') ? systemImg : undefined,
        vendor: vendorImg && vendorImg.endsWith('.img') ? vendorImg : undefined,
      },
      outputPath,
      romName: variantInfo.displayName,
      romVersion: variantInfo.androidVersion,
      sdkVersion: variantInfo.sdkLevel,
      timestamp: Math.floor(Date.now() / 1000),
      useBrotli: shx.exec('which brotli', { silent: true }).code === 0,
      verbose: flags.verbose || false,
    }

    try {
      const otaPath = await createOtaPackage(otaConfig)

      this.log('')
      this.log(chalk.green('OTA package created:'))
      this.log(`  ${otaPath}`)

      if (fs.existsSync(otaPath)) {
        const stats = fs.statSync(otaPath)
        this.log(`  Size: ${(stats.size / 1024 / 1024).toFixed(1)} MB`)
      }

      // Generate updater metadata
      const metadata = generateOtaMetadata(otaConfig, fs.existsSync(otaPath) ? fs.statSync(otaPath).size : 0)
      const metadataPath = otaPath.replace('.zip', '.json')
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2))
      this.log(`  Metadata: ${metadataPath}`)

      this.log('')
      this.log('To flash:')
      this.log('  1. Copy to device or SD card')
      this.log('  2. Boot into recovery (TWRP recommended)')
      this.log('  3. Install zip from storage')
      this.log('')
    } catch (error: any) {
      this.error(`OTA creation failed: ${error.message}`)
    }
  }

  /**
   * Check if a required tool is available, error with install hint if not.
   */
  private checkTool(binary: string, packageName: string): void {
    if (shx.exec(`which ${binary}`, { silent: true }).code !== 0) {
      this.error(`${binary} is not installed. Install it with: apt install ${packageName}`)
    }
  }
}
