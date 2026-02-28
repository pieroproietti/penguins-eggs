/**
 * ./src/commands/android/status.ts
 * penguins-eggs
 * author: Piero Proietti / Android backend
 * license: MIT
 */

import { Command, Flags } from '@oclif/core'
import chalk from 'chalk'
import fs from 'node:fs'

import { archSupportsISO, archSupportsFastboot, bootloaderForArch, detectAndroidArch, kernelImageName } from '../../android/arch-detect.js'
import {
  analyzeSepolicy,
  detectAttestation,
  detectGrapheneOS,
  detectRecovery,
  isGrapheneOS,
} from '../../android/grapheneos.js'
import { readAllBuildProps, readBuildProp } from '../../android/prop-reader.js'
import Distro from '../../classes/distro.js'
import Utils from '../../classes/utils.js'

export default class AndroidStatus extends Command {
  static description = 'show Android/AOSP environment information'

  static examples = [
    'eggs android status',
    'eggs android status --verbose',
  ]

  static flags = {
    help: Flags.help({ char: 'h' }),
    verbose: Flags.boolean({ char: 'v', description: 'show all build.prop properties' }),
  }

  async run(): Promise<void> {
    const { flags } = await this.parse(AndroidStatus)
    Utils.titles(this.id + ' ' + this.argv)

    // Check if we're in an Android environment
    const isAndroid = Distro.isAndroidEnvironment()

    if (!isAndroid) {
      this.log(chalk.yellow('No Android environment detected.'))
      this.log('')
      this.log('This command works when running on:')
      this.log('  - Android-x86 / BlissOS / Bass OS (native)')
      this.log('  - Waydroid container host')
      this.log('  - System with /system/build.prop present')
      this.log('')
      this.log('Showing detection probe results:')
      this.log('')
      this.printDetectionProbes()
      return
    }

    // Read build properties
    const props = readAllBuildProps()
    const archInfo = detectAndroidArch(props as Record<string, string>)

    // Header
    this.log('')
    this.log(chalk.bold('Android Environment'))
    this.log('─'.repeat(50))

    // Distribution
    const distroId = Distro.detectAndroidDistroId()
    this.log(`  Distribution:    ${chalk.cyan(distroId)}`)
    this.log(`  Android Version: ${chalk.cyan(props['ro.build.version.release'] || 'unknown')}`)
    this.log(`  SDK Level:       ${chalk.cyan(props['ro.build.version.sdk'] || 'unknown')}`)
    this.log(`  Build ID:        ${props['ro.build.display.id'] || 'unknown'}`)
    this.log(`  Build Type:      ${props['ro.build.type'] || 'unknown'}`)
    this.log(`  Brand:           ${props['ro.product.brand'] || 'unknown'}`)
    this.log(`  Model:           ${props['ro.product.model'] || 'unknown'}`)
    this.log(`  Device:          ${props['ro.product.device'] || 'unknown'}`)

    // Architecture
    this.log('')
    this.log(chalk.bold('Architecture'))
    this.log('─'.repeat(50))
    this.log(`  Primary ABI:     ${chalk.cyan(archInfo.primaryAbi)}`)
    if (archInfo.secondaryAbi) {
      this.log(`  Secondary ABI:   ${chalk.cyan(archInfo.secondaryAbi)}`)
    }

    this.log(`  ABI List:        ${archInfo.abiList.join(', ')}`)
    this.log(`  Kernel Arch:     ${archInfo.kernelArch}`)
    this.log(`  64-bit:          ${archInfo.is64Bit ? chalk.green('yes') : chalk.yellow('no')}`)
    this.log(`  Multilib:        ${archInfo.isMultilib ? chalk.green('yes') : chalk.yellow('no')}`)

    // Boot & Output capabilities
    this.log('')
    this.log(chalk.bold('Image Production Capabilities'))
    this.log('─'.repeat(50))
    this.log(`  Bootloader:      ${bootloaderForArch(archInfo.primaryAbi)}`)
    this.log(`  Kernel Image:    ${kernelImageName(archInfo.primaryAbi)}`)
    this.log(`  ISO Support:     ${archSupportsISO(archInfo.primaryAbi) ? chalk.green('yes') : chalk.yellow('no (use raw-img)')}`)
    this.log(`  Fastboot:        ${archSupportsFastboot(archInfo.primaryAbi) ? chalk.green('yes') : chalk.yellow('no')}`)

    // Partition layout detection
    this.log('')
    this.log(chalk.bold('Partition Layout'))
    this.log('─'.repeat(50))
    this.printPartitionInfo()

    // Waydroid detection
    if (fs.existsSync('/var/lib/waydroid/waydroid.cfg')) {
      this.log('')
      this.log(chalk.bold('Waydroid'))
      this.log('─'.repeat(50))
      this.printWaydroidInfo()
    }

    // SELinux policy info
    this.log('')
    this.log(chalk.bold('SELinux Policy'))
    this.log('─'.repeat(50))
    this.printSepolicyInfo()

    // Recovery info
    this.log('')
    this.log(chalk.bold('Recovery'))
    this.log('─'.repeat(50))
    this.printRecoveryInfo()

    // Hardware attestation
    this.log('')
    this.log(chalk.bold('Hardware Attestation'))
    this.log('─'.repeat(50))
    this.printAttestationInfo()

    // GrapheneOS-specific info
    if (isGrapheneOS()) {
      this.log('')
      this.log(chalk.bold('GrapheneOS Hardening'))
      this.log('─'.repeat(50))
      this.printGrapheneOSInfo()
    }

    // Verbose: dump all props
    if (flags.verbose) {
      this.log('')
      this.log(chalk.bold('All Build Properties'))
      this.log('─'.repeat(50))
      const sortedKeys = Object.keys(props).sort()
      for (const key of sortedKeys) {
        this.log(`  ${key}=${props[key]}`)
      }
    }

    this.log('')
  }

  /**
   * Print detection probe results for non-Android environments
   */
  private printDetectionProbes(): void {
    const probes = [
      { label: '/system/build.prop', exists: fs.existsSync('/system/build.prop') },
      { label: '/vendor/build.prop', exists: fs.existsSync('/vendor/build.prop') },
      { label: '/var/lib/waydroid/waydroid.cfg', exists: fs.existsSync('/var/lib/waydroid/waydroid.cfg') },
      { label: '/system/bin/app_process', exists: fs.existsSync('/system/bin/app_process') || fs.existsSync('/system/bin/app_process64') },
    ]

    // Check /proc/cmdline for androidboot
    let hasAndroidBoot = false
    try {
      if (fs.existsSync('/proc/cmdline')) {
        const cmdline = fs.readFileSync('/proc/cmdline', 'utf8')
        hasAndroidBoot = cmdline.includes('androidboot')
      }
    } catch {
      // ignore
    }

    probes.push({ label: '/proc/cmdline contains androidboot', exists: hasAndroidBoot })

    for (const probe of probes) {
      const icon = probe.exists ? chalk.green('✓') : chalk.red('✗')
      this.log(`  ${icon} ${probe.label}`)
    }
  }

  /**
   * Print detected Android partition information
   */
  private printPartitionInfo(): void {
    const partitions = [
      { label: 'system', paths: ['/system', '/system/system'] },
      { label: 'vendor', paths: ['/vendor', '/system/vendor'] },
      { label: 'product', paths: ['/product', '/system/product'] },
      { label: 'system_ext', paths: ['/system_ext', '/system/system_ext'] },
      { label: 'data', paths: ['/data'] },
      { label: 'cache', paths: ['/cache'] },
    ]

    for (const part of partitions) {
      const found = part.paths.find((p) => fs.existsSync(p))
      if (found) {
        this.log(`  ${chalk.green('✓')} ${part.label.padEnd(15)} ${found}`)
      } else {
        this.log(`  ${chalk.red('✗')} ${part.label.padEnd(15)} not found`)
      }
    }

    // Check for super/dynamic partitions
    const hasDynParts = readBuildProp('ro.boot.dynamic_partitions') === 'true'
    this.log(`  Dynamic Parts:   ${hasDynParts ? chalk.green('yes (super.img)') : chalk.yellow('no (legacy)')}`)

    // Check A/B slot
    const slotSuffix = readBuildProp('ro.boot.slot_suffix')
    if (slotSuffix) {
      this.log(`  A/B Slot:        ${chalk.cyan(slotSuffix)}`)
    } else {
      this.log(`  A/B Slot:        ${chalk.yellow('none (legacy)')}`)
    }
  }

  /**
   * Print SELinux policy information
   */
  private printSepolicyInfo(): void {
    const sepolicy = analyzeSepolicy()
    this.log(`  Present:         ${sepolicy.present ? chalk.green('yes') : chalk.red('no')}`)
    this.log(`  Mode:            ${sepolicy.mode === 'enforcing' ? chalk.green(sepolicy.mode) : chalk.yellow(sepolicy.mode)}`)
    if (sepolicy.policyVersion > 0) {
      this.log(`  Policy Version:  ${sepolicy.policyVersion}`)
    }

    this.log(`  GrapheneOS Policy: ${sepolicy.hasGrapheneOSPolicy ? chalk.green('yes') : 'no'}`)
    if (sepolicy.policyPaths.length > 0) {
      this.log(`  Policy Paths:    ${sepolicy.policyPaths.length} locations`)
    }
  }

  /**
   * Print recovery partition information
   */
  private printRecoveryInfo(): void {
    const recovery = detectRecovery()
    this.log(`  Present:         ${recovery.hasRecovery ? chalk.green('yes') : chalk.yellow('no')}`)
    this.log(`  Type:            ${recovery.type}`)
    this.log(`  Sideload:        ${recovery.supportsSideload ? chalk.green('yes') : 'no'}`)
    if (recovery.partitionPath) {
      this.log(`  Partition:       ${recovery.partitionPath}`)
    }
  }

  /**
   * Print hardware attestation information
   */
  private printAttestationInfo(): void {
    const attestation = detectAttestation()
    this.log(`  HW Attestation:  ${attestation.hardwareAttestationSupported ? chalk.green('supported') : chalk.yellow('not detected')}`)
    if (attestation.keymasterVersion > 0) {
      this.log(`  KeyMint Version: ${attestation.keymasterVersion}`)
    }

    this.log(`  StrongBox:       ${attestation.hasStrongBox ? chalk.green('yes') : 'no'}`)
    this.log(`  Auditor App:     ${attestation.auditorInstalled ? chalk.green('installed') : 'not installed'}`)
    if (attestation.attestationServerUrl) {
      this.log(`  Attest Server:   ${attestation.attestationServerUrl}`)
    }
  }

  /**
   * Print GrapheneOS-specific hardening information
   */
  private printGrapheneOSInfo(): void {
    const gos = detectGrapheneOS()
    if (!gos.isGrapheneOS) return

    this.log(`  Version:         ${chalk.cyan(gos.version)}`)
    this.log(`  Bootloader:      ${gos.bootloaderLocked ? chalk.green('locked') : chalk.red('unlocked')}`)
    this.log(`  Verified Boot:   ${gos.verifiedBootState === 'green' ? chalk.green(gos.verifiedBootState) : chalk.yellow(gos.verifiedBootState)}`)
    this.log(`  SELinux:         ${gos.selinuxEnforcing ? chalk.green('enforcing') : chalk.yellow('not enforcing')}`)
    this.log('')

    const h = gos.hardening
    const feat = (name: string, enabled: boolean) =>
      `  ${enabled ? chalk.green('✓') : chalk.red('✗')} ${name}`

    this.log(feat('Exec-based spawning', h.execSpawning))
    this.log(feat('Hardened malloc', h.hardenedMalloc))
    this.log(feat('Network permission toggle', h.networkPermissionToggle))
    this.log(feat('Sensor permission toggle', h.sensorPermissionToggle))
    this.log(feat('Storage scopes', h.storageScopes))
    this.log(feat('Contact scopes', h.contactScopes))
    this.log(feat('Auto-reboot', h.autoReboot))
    this.log(feat('USB-C control', h.usbControl))
    this.log(feat('Wi-Fi privacy', h.wifiPrivacy))
  }

  /**
   * Print Waydroid-specific information
   */
  private printWaydroidInfo(): void {
    try {
      const cfg = fs.readFileSync('/var/lib/waydroid/waydroid.cfg', 'utf8')
      for (const line of cfg.split('\n')) {
        const trimmed = line.trim()
        if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('[')) {
          this.log(`  ${trimmed}`)
        }
      }
    } catch {
      this.log('  (could not read waydroid.cfg)')
    }

    // Check image locations
    const imagePaths = [
      '/var/lib/waydroid/images/system.img',
      '/var/lib/waydroid/images/vendor.img',
    ]

    this.log('')
    for (const imgPath of imagePaths) {
      if (fs.existsSync(imgPath)) {
        try {
          const stats = fs.statSync(imgPath)
          const sizeMB = (stats.size / (1024 * 1024)).toFixed(1)
          this.log(`  ${chalk.green('✓')} ${imgPath} (${sizeMB} MB)`)
        } catch {
          this.log(`  ${chalk.green('✓')} ${imgPath}`)
        }
      } else {
        this.log(`  ${chalk.red('✗')} ${imgPath}`)
      }
    }
  }
}
