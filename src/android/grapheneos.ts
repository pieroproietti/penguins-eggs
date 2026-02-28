/**
 * ./src/android/grapheneos.ts
 * penguins-eggs — Android backend
 * license: MIT
 *
 * GrapheneOS-specific hardening detection, SELinux policy validation,
 * hardware attestation awareness, and device bringup support.
 *
 * Integrates patterns from:
 *   - platform_system_sepolicy: SELinux policy structure and validation
 *   - platform_bootable_recovery: Recovery partition handling
 *   - Auditor / platform_external_Auditor: Hardware attestation checks
 *   - AttestationServer: Remote attestation verification
 *   - adevtool: Device bringup, vendor blob extraction, HAL/sepolicy gaps
 *   - vendor_state: Per-device adevtool configuration
 *   - script: Build and release automation patterns
 *   - infrastructure / releases.grapheneos.org: Release channel metadata
 */

import fs from 'node:fs'
import path from 'node:path'

import { exec, shx } from '../lib/utils.js'
import { readBuildProp } from './prop-reader.js'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface IGrapheneOSInfo {
  /** Whether the running system is GrapheneOS */
  isGrapheneOS: boolean
  /** GrapheneOS version string (e.g., "2024030100") */
  version: string
  /** Android version underlying GrapheneOS */
  androidVersion: string
  /** Device codename (e.g., "husky", "shiba", "panther") */
  device: string
  /** Security patch level */
  securityPatch: string
  /** Whether the bootloader is locked */
  bootloaderLocked: boolean
  /** AVB verification state */
  verifiedBootState: 'green' | 'yellow' | 'orange' | 'red' | 'unknown'
  /** Whether Auditor app is installed */
  hasAuditor: boolean
  /** SELinux enforcement status */
  selinuxEnforcing: boolean
  /** Hardening features detected */
  hardening: IHardeningFeatures
}

export interface IHardeningFeatures {
  /** exec-based spawning (no fork) */
  execSpawning: boolean
  /** Hardened memory allocator */
  hardenedMalloc: boolean
  /** Network permission toggle per-app */
  networkPermissionToggle: boolean
  /** Sensor permission toggle per-app */
  sensorPermissionToggle: boolean
  /** Storage scopes */
  storageScopes: boolean
  /** Contact scopes */
  contactScopes: boolean
  /** Scrambled PIN layout */
  scrambledPin: boolean
  /** Auto-reboot timeout configured */
  autoReboot: boolean
  /** USB-C port control */
  usbControl: boolean
  /** Wi-Fi privacy features */
  wifiPrivacy: boolean
}

export interface ISepolicyInfo {
  /** Whether SELinux is present */
  present: boolean
  /** Current mode: enforcing, permissive, disabled */
  mode: 'disabled' | 'enforcing' | 'permissive' | 'unknown'
  /** Policy version */
  policyVersion: number
  /** Whether GrapheneOS-specific policy extensions are detected */
  hasGrapheneOSPolicy: boolean
  /** Number of custom policy rules (approximate) */
  customRuleCount: number
  /** Policy file paths found */
  policyPaths: string[]
}

export interface IRecoveryInfo {
  /** Whether a recovery partition exists */
  hasRecovery: boolean
  /** Recovery type detected */
  type: 'aosp' | 'grapheneos' | 'lineageos' | 'twrp' | 'none' | 'unknown'
  /** Whether recovery supports sideloading */
  supportsSideload: boolean
  /** Recovery partition path */
  partitionPath: string
}

export interface IAdevtoolConfig {
  /** Device codename */
  device: string
  /** Vendor blob list */
  vendorBlobs: string[]
  /** Missing SELinux policies detected */
  missingSepolicies: string[]
  /** Missing HALs detected */
  missingHals: string[]
  /** Missing system properties */
  missingProps: string[]
}

// ---------------------------------------------------------------------------
// Detection
// ---------------------------------------------------------------------------

/**
 * Detect if the running system is GrapheneOS.
 * GrapheneOS sets specific build properties that distinguish it from stock AOSP.
 */
export function isGrapheneOS(): boolean {
  // Primary: check for GrapheneOS-specific properties
  const displayId = readBuildProp('ro.build.display.id').toLowerCase()
  if (displayId.includes('grapheneos')) return true

  // Check for GrapheneOS fingerprint pattern
  const fingerprint = readBuildProp('ro.build.fingerprint')
  if (fingerprint.includes('GrapheneOS')) return true

  // Check for GrapheneOS-specific system app
  if (fs.existsSync('/system/priv-app/Auditor') ||
      fs.existsSync('/product/priv-app/Auditor')) {
    return true
  }

  // Check for GrapheneOS vanadium browser (replaces Chrome)
  if (fs.existsSync('/system/app/Vanadium') ||
      fs.existsSync('/product/app/Vanadium')) {
    return true
  }

  return false
}

/**
 * Gather full GrapheneOS environment information.
 */
export function detectGrapheneOS(): IGrapheneOSInfo {
  const isGOS = isGrapheneOS()

  const info: IGrapheneOSInfo = {
    androidVersion: readBuildProp('ro.build.version.release') || 'unknown',
    bootloaderLocked: false,
    device: readBuildProp('ro.product.device') || 'unknown',
    hardening: detectHardeningFeatures(),
    hasAuditor: false,
    isGrapheneOS: isGOS,
    securityPatch: readBuildProp('ro.build.version.security_patch') || 'unknown',
    selinuxEnforcing: false,
    verifiedBootState: 'unknown',
    version: '',
  }

  if (!isGOS) return info

  // GrapheneOS version from build ID
  info.version = readBuildProp('ro.build.id') || readBuildProp('ro.build.display.id') || ''

  // Bootloader lock state
  try {
    if (fs.existsSync('/proc/cmdline')) {
      const cmdline = fs.readFileSync('/proc/cmdline', 'utf8')
      info.bootloaderLocked = cmdline.includes('androidboot.vbmeta.device_state=locked')

      const stateMatch = cmdline.match(/androidboot\.verifiedbootstate=(\w+)/)
      if (stateMatch) {
        info.verifiedBootState = stateMatch[1] as IGrapheneOSInfo['verifiedBootState']
      }
    }
  } catch { /* ignore */ }

  // Auditor presence
  info.hasAuditor = fs.existsSync('/system/priv-app/Auditor') ||
    fs.existsSync('/product/priv-app/Auditor') ||
    fs.existsSync('/data/app/app.attestation.auditor')

  // SELinux status
  info.selinuxEnforcing = getSELinuxMode() === 'enforcing'

  return info
}

// ---------------------------------------------------------------------------
// SELinux Policy (platform_system_sepolicy patterns)
// ---------------------------------------------------------------------------

/**
 * Get the current SELinux enforcement mode.
 */
export function getSELinuxMode(): 'disabled' | 'enforcing' | 'permissive' | 'unknown' {
  // Check /sys/fs/selinux/enforce
  try {
    if (fs.existsSync('/sys/fs/selinux/enforce')) {
      const val = fs.readFileSync('/sys/fs/selinux/enforce', 'utf8').trim()
      return val === '1' ? 'enforcing' : 'permissive'
    }
  } catch { /* permission denied */ }

  // Fallback: getenforce command
  const result = shx.exec('getenforce 2>/dev/null', { silent: true })
  if (result.code === 0) {
    const mode = result.stdout.trim().toLowerCase()
    if (mode === 'enforcing') return 'enforcing'
    if (mode === 'permissive') return 'permissive'
    if (mode === 'disabled') return 'disabled'
  }

  // Fallback: check kernel cmdline
  try {
    if (fs.existsSync('/proc/cmdline')) {
      const cmdline = fs.readFileSync('/proc/cmdline', 'utf8')
      if (cmdline.includes('androidboot.selinux=enforcing')) return 'enforcing'
      if (cmdline.includes('androidboot.selinux=permissive')) return 'permissive'
    }
  } catch { /* ignore */ }

  return 'unknown'
}

/**
 * Analyze SELinux policy on the system.
 * Checks for GrapheneOS-specific policy extensions.
 */
export function analyzeSepolicy(): ISepolicyInfo {
  const info: ISepolicyInfo = {
    customRuleCount: 0,
    hasGrapheneOSPolicy: false,
    mode: getSELinuxMode(),
    policyPaths: [],
    policyVersion: 0,
    present: false,
  }

  // Check for SELinux filesystem
  info.present = fs.existsSync('/sys/fs/selinux')

  // Find policy files
  const policyLocations = [
    '/sys/fs/selinux/policy',
    '/sepolicy',
    '/vendor/etc/selinux',
    '/system/etc/selinux',
    '/product/etc/selinux',
    '/system_ext/etc/selinux',
  ]

  for (const loc of policyLocations) {
    if (fs.existsSync(loc)) {
      info.policyPaths.push(loc)
    }
  }

  // Check for GrapheneOS-specific policy contexts
  // GrapheneOS adds custom types like: exec_spawning, hardened_malloc, etc.
  const grapheneOSContextFiles = [
    '/system/etc/selinux/plat_file_contexts',
    '/vendor/etc/selinux/vendor_file_contexts',
  ]

  for (const ctxFile of grapheneOSContextFiles) {
    if (fs.existsSync(ctxFile)) {
      try {
        const content = fs.readFileSync(ctxFile, 'utf8')
        // GrapheneOS-specific SELinux labels
        if (content.includes('exec_spawning') ||
            content.includes('hardened_malloc') ||
            content.includes('grapheneos')) {
          info.hasGrapheneOSPolicy = true
        }

        // Count custom rules (lines that aren't comments or blank)
        info.customRuleCount += content.split('\n')
          .filter(l => l.trim() && !l.trim().startsWith('#')).length
      } catch { /* permission denied */ }
    }
  }

  // Read policy version from /sys/fs/selinux/policyvers
  try {
    if (fs.existsSync('/sys/fs/selinux/policyvers')) {
      const ver = fs.readFileSync('/sys/fs/selinux/policyvers', 'utf8').trim()
      info.policyVersion = Number.parseInt(ver, 10) || 0
    }
  } catch { /* ignore */ }

  return info
}

/**
 * Validate that SELinux file contexts are properly applied.
 * Checks for common issues that would break a remastered image.
 */
export async function validateSepolicyContexts(systemRoot: string): Promise<string[]> {
  const issues: string[] = []

  // Check that file_contexts exists
  const fileContexts = path.join(systemRoot, 'etc', 'selinux', 'plat_file_contexts')
  if (!fs.existsSync(fileContexts)) {
    issues.push('Missing plat_file_contexts — SELinux labels will be wrong')
  }

  // Check that seapp_contexts exists (maps apps to SELinux domains)
  const seappContexts = path.join(systemRoot, 'etc', 'selinux', 'plat_seapp_contexts')
  if (!fs.existsSync(seappContexts)) {
    issues.push('Missing plat_seapp_contexts — app sandboxing may fail')
  }

  // Check that property_contexts exists
  const propContexts = path.join(systemRoot, 'etc', 'selinux', 'plat_property_contexts')
  if (!fs.existsSync(propContexts)) {
    issues.push('Missing plat_property_contexts — property access control may fail')
  }

  // If restorecon is available, do a dry-run check
  if (shx.exec('which restorecon', { silent: true }).code === 0) {
    const result = shx.exec(`restorecon -nrv ${systemRoot} 2>&1 | head -20`, { silent: true })
    if (result.code === 0 && result.stdout.trim()) {
      const mislabeled = result.stdout.trim().split('\n').length
      if (mislabeled > 0) {
        issues.push(`${mislabeled} files have incorrect SELinux labels (run restorecon)`)
      }
    }
  }

  return issues
}

// ---------------------------------------------------------------------------
// Recovery (platform_bootable_recovery patterns)
// ---------------------------------------------------------------------------

/**
 * Detect recovery partition information.
 */
export function detectRecovery(): IRecoveryInfo {
  const info: IRecoveryInfo = {
    hasRecovery: false,
    partitionPath: '',
    supportsSideload: false,
    type: 'none',
  }

  // Check for recovery partition
  const recoveryPaths = [
    '/dev/block/by-name/recovery',
    '/dev/block/bootdevice/by-name/recovery',
  ]

  for (const rp of recoveryPaths) {
    if (fs.existsSync(rp)) {
      info.hasRecovery = true
      info.partitionPath = rp
      break
    }
  }

  // Detect recovery type from installed recovery binary or props
  if (fs.existsSync('/system/bin/recovery')) {
    info.hasRecovery = true
  }

  // Check for TWRP
  if (fs.existsSync('/sbin/recovery') || fs.existsSync('/twres')) {
    info.type = 'twrp'
    info.supportsSideload = true
  }
  // Check for LineageOS recovery
  else if (readBuildProp('ro.lineage.build.version').length > 0) {
    info.type = 'lineageos'
    info.supportsSideload = true
  }
  // Check for GrapheneOS recovery
  else if (isGrapheneOS()) {
    info.type = 'grapheneos'
    info.supportsSideload = true // GrapheneOS recovery supports ADB sideload
  }
  // Generic AOSP recovery
  else if (info.hasRecovery) {
    info.type = 'aosp'
    info.supportsSideload = true
  }

  return info
}

// ---------------------------------------------------------------------------
// Hardening Features Detection
// ---------------------------------------------------------------------------

/**
 * Detect GrapheneOS-specific hardening features.
 * These are identified by system properties, installed apps, and config files.
 */
function detectHardeningFeatures(): IHardeningFeatures {
  const features: IHardeningFeatures = {
    autoReboot: false,
    contactScopes: false,
    execSpawning: false,
    hardenedMalloc: false,
    networkPermissionToggle: false,
    scrambledPin: false,
    sensorPermissionToggle: false,
    storageScopes: false,
    usbControl: false,
    wifiPrivacy: false,
  }

  // exec-based spawning: GrapheneOS replaces fork+exec with exec spawning
  // Detected via system property or SELinux context
  if (readBuildProp('persist.sys.spawn_exec') === 'true' ||
      fs.existsSync('/system/etc/selinux/exec_spawning')) {
    features.execSpawning = true
  }

  // Hardened malloc: GrapheneOS uses hardened_malloc as the system allocator
  if (fs.existsSync('/system/lib64/libhardened_malloc.so') ||
      fs.existsSync('/system/lib/libhardened_malloc.so') ||
      readBuildProp('ro.grapheneos.hardened_malloc') === 'true') {
    features.hardenedMalloc = true
  }

  // Network permission toggle
  if (readBuildProp('ro.grapheneos.network_permission_toggle') === 'true' ||
      fs.existsSync('/system/framework/grapheneos-network.jar')) {
    features.networkPermissionToggle = true
  }

  // Sensor permission toggle
  if (readBuildProp('ro.grapheneos.sensor_permission_toggle') === 'true') {
    features.sensorPermissionToggle = true
  }

  // Storage scopes
  if (readBuildProp('ro.grapheneos.storage_scopes') === 'true') {
    features.storageScopes = true
  }

  // Contact scopes
  if (readBuildProp('ro.grapheneos.contact_scopes') === 'true') {
    features.contactScopes = true
  }

  // Auto-reboot
  const autoRebootTimeout = readBuildProp('persist.sys.auto_reboot_timeout')
  if (autoRebootTimeout && autoRebootTimeout !== '0') {
    features.autoReboot = true
  }

  // USB control
  if (readBuildProp('ro.grapheneos.usb_control') === 'true' ||
      fs.existsSync('/sys/class/usb_role')) {
    features.usbControl = true
  }

  // Wi-Fi privacy (MAC randomization beyond AOSP default)
  if (readBuildProp('ro.grapheneos.wifi_privacy') === 'true') {
    features.wifiPrivacy = true
  }

  return features
}

// ---------------------------------------------------------------------------
// Attestation (Auditor / AttestationServer patterns)
// ---------------------------------------------------------------------------

export interface IAttestationInfo {
  /** Whether hardware attestation is supported */
  hardwareAttestationSupported: boolean
  /** Keymaster/KeyMint version */
  keymasterVersion: number
  /** Whether StrongBox is available */
  hasStrongBox: boolean
  /** Whether Auditor app is installed */
  auditorInstalled: boolean
  /** Attestation server URL (if configured) */
  attestationServerUrl: string
}

/**
 * Detect hardware attestation capabilities.
 * Based on patterns from GrapheneOS Auditor and AttestationServer.
 */
export function detectAttestation(): IAttestationInfo {
  const info: IAttestationInfo = {
    attestationServerUrl: '',
    auditorInstalled: false,
    hardwareAttestationSupported: false,
    hasStrongBox: false,
    keymasterVersion: 0,
  }

  // Check Keymaster/KeyMint version
  const keymasterVer = readBuildProp('ro.hardware.keystore')
  if (keymasterVer) {
    info.keymasterVersion = Number.parseInt(keymasterVer, 10) || 0
  }

  // Alternative: check VINTF manifest for keymaster HAL version
  const vintfManifest = '/vendor/etc/vintf/manifest.xml'
  if (fs.existsSync(vintfManifest)) {
    try {
      const content = fs.readFileSync(vintfManifest, 'utf8')
      if (content.includes('android.hardware.security.keymint') ||
          content.includes('android.hardware.keymaster')) {
        info.hardwareAttestationSupported = true
      }

      if (content.includes('android.hardware.security.keymint')) {
        // KeyMint (Android 12+) — version from AIDL
        const versionMatch = content.match(/android\.hardware\.security\.keymint.*?<version>(\d+)<\/version>/s)
        if (versionMatch) {
          info.keymasterVersion = Number.parseInt(versionMatch[1], 10)
        }
      }

      // StrongBox
      if (content.includes('strongbox')) {
        info.hasStrongBox = true
      }
    } catch { /* permission denied */ }
  }

  // Check for Auditor app
  info.auditorInstalled = fs.existsSync('/system/priv-app/Auditor') ||
    fs.existsSync('/product/priv-app/Auditor') ||
    fs.existsSync('/data/app/app.attestation.auditor')

  // Check for configured attestation server
  const attestUrl = readBuildProp('persist.sys.attestation_server')
  if (attestUrl) {
    info.attestationServerUrl = attestUrl
  }

  return info
}

// ---------------------------------------------------------------------------
// adevtool Integration (device bringup patterns)
// ---------------------------------------------------------------------------

/**
 * Run adevtool-style analysis on the current system.
 * Detects missing vendor blobs, SELinux policies, HALs, and properties
 * that would be needed to reproduce the image.
 *
 * This doesn't require adevtool itself — it implements the same checks.
 */
export function analyzeDeviceConfig(): IAdevtoolConfig {
  const config: IAdevtoolConfig = {
    device: readBuildProp('ro.product.device') || 'unknown',
    missingHals: [],
    missingProps: [],
    missingSepolicies: [],
    vendorBlobs: [],
  }

  // Scan vendor for blob files (shared libraries, firmware, configs)
  const vendorDirs = ['/vendor/lib64', '/vendor/lib', '/vendor/firmware', '/vendor/etc']
  for (const dir of vendorDirs) {
    if (fs.existsSync(dir)) {
      try {
        scanDirectory(dir, config.vendorBlobs)
      } catch { /* permission denied */ }
    }
  }

  // Check for missing HALs by comparing VINTF manifest against running services
  const vintfManifest = '/vendor/etc/vintf/manifest.xml'
  if (fs.existsSync(vintfManifest)) {
    try {
      const content = fs.readFileSync(vintfManifest, 'utf8')
      const halNames = [...content.matchAll(/<fqname>([^<]+)<\/fqname>/g)]
        .map(m => m[1])

      for (const hal of halNames) {
        // Check if the HAL implementation binary exists
        const halBinary = hal.split('/').pop()?.replace(/@.*/, '') || ''
        if (halBinary && !fs.existsSync(`/vendor/bin/hw/${halBinary}`)) {
          config.missingHals.push(hal)
        }
      }
    } catch { /* ignore */ }
  }

  return config
}

/**
 * Recursively scan a directory and collect file paths.
 */
function scanDirectory(dir: string, files: string[], maxDepth = 3, depth = 0): void {
  if (depth >= maxDepth) return

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isFile()) {
        files.push(fullPath)
      } else if (entry.isDirectory()) {
        scanDirectory(fullPath, files, maxDepth, depth + 1)
      }
    }
  } catch { /* permission denied */ }
}

// ---------------------------------------------------------------------------
// Release Channel (releases.grapheneos.org patterns)
// ---------------------------------------------------------------------------

export interface IGrapheneOSRelease {
  /** Release channel */
  channel: 'alpha' | 'beta' | 'stable'
  /** Version code (e.g., "2024030100") */
  versionCode: string
  /** OTA URL pattern */
  otaUrl: string
  /** Factory image URL pattern */
  factoryUrl: string
}

/**
 * Get GrapheneOS release channel information.
 * Based on the releases.grapheneos.org URL patterns.
 */
export function getGrapheneOSReleaseInfo(device: string, channel = 'stable'): IGrapheneOSRelease {
  const baseUrl = 'https://releases.grapheneos.org'

  return {
    channel: channel as IGrapheneOSRelease['channel'],
    factoryUrl: `${baseUrl}/${device}-factory-latest.zip`,
    otaUrl: `${baseUrl}/${device}-ota_update-latest.zip`,
    versionCode: readBuildProp('ro.build.id') || '',
  }
}
