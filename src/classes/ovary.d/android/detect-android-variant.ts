/**
 * ./src/classes/ovary.d/android/detect-android-variant.ts
 * penguins-eggs — Android backend
 * license: MIT
 *
 * Detects the Android variant (BlissOS, LineageOS, GrapheneOS, etc.)
 * and gathers full metadata needed for image production.
 */

import fs from 'node:fs'

import { AndroidArch, IAndroidArchInfo, detectAndroidArch } from '../../../android/arch-detect.js'
import {
  IGrapheneOSInfo,
  detectGrapheneOS,
  isGrapheneOS as checkIsGrapheneOS,
} from '../../../android/grapheneos.js'
import { readAllBuildProps, readBuildProp } from '../../../android/prop-reader.js'
import { IAndroidPartitionInfo, detectPartitionLayout } from './android-system-img.js'

export type AndroidVariant =
  | 'aosp'
  | 'bassos'
  | 'blissos'
  | 'cuttlefish'
  | 'custom'
  | 'grapheneos'
  | 'lineageos'
  | 'waydroid'

export type AndroidSourceType =
  | 'build-output'
  | 'live-system'
  | 'waydroid-container'

export interface IAndroidVariantInfo {
  /** Detected variant name */
  variant: AndroidVariant
  /** Human-readable display name */
  displayName: string
  /** Android version (e.g., "13", "14") */
  androidVersion: string
  /** SDK API level (e.g., "33", "34") */
  sdkLevel: string
  /** Build ID (e.g., "TQ3A.230901.001") */
  buildId: string
  /** Build type (user, userdebug, eng) */
  buildType: string
  /** Architecture info */
  arch: IAndroidArchInfo
  /** Partition layout */
  partitions: IAndroidPartitionInfo
  /** How the system was detected (live, waydroid, build output) */
  sourceType: AndroidSourceType
  /** Whether GApps/Play Services are present */
  hasGapps: boolean
  /** Whether Magisk/root is detected */
  hasRoot: boolean
  /** Security patch level */
  securityPatch: string
  /** GrapheneOS-specific info (null if not GrapheneOS) */
  grapheneOS: IGrapheneOSInfo | null
}

/**
 * Detect the Android variant from build.prop properties.
 */
function identifyVariant(props: Record<string, string>): { variant: AndroidVariant; displayName: string } {
  const displayId = (props['ro.build.display.id'] || '').toLowerCase()
  const brand = (props['ro.product.brand'] || '').toLowerCase()
  const flavor = (props['ro.build.flavor'] || '').toLowerCase()
  const model = (props['ro.product.model'] || '').toLowerCase()

  // BlissOS / Bliss ROMs
  if (displayId.includes('bliss') || brand === 'bliss' || flavor.includes('bliss')) {
    return {
      displayName: props['ro.build.display.id'] || 'BlissOS',
      variant: 'blissos',
    }
  }

  // Bass OS
  if (displayId.includes('bass') || brand === 'bass' || flavor.includes('bass')) {
    return {
      displayName: props['ro.build.display.id'] || 'Bass OS',
      variant: 'bassos',
    }
  }

  // LineageOS
  if (displayId.includes('lineage') || brand === 'lineage' || flavor.includes('lineage')) {
    return {
      displayName: props['ro.build.display.id'] || 'LineageOS',
      variant: 'lineageos',
    }
  }

  // GrapheneOS
  if (displayId.includes('graphene') || brand === 'grapheneos') {
    return {
      displayName: props['ro.build.display.id'] || 'GrapheneOS',
      variant: 'grapheneos',
    }
  }

  // Cuttlefish (Google's virtual device)
  if (model.includes('cuttlefish') || props['ro.product.device']?.includes('vsoc')) {
    return {
      displayName: 'Android Cuttlefish',
      variant: 'cuttlefish',
    }
  }

  // Waydroid (detected by environment, not build.prop)
  if (fs.existsSync('/var/lib/waydroid/waydroid.cfg')) {
    return {
      displayName: 'Waydroid',
      variant: 'waydroid',
    }
  }

  // Generic AOSP
  if (brand === 'aosp' || brand === 'android' || brand === 'generic') {
    return {
      displayName: props['ro.build.display.id'] || 'AOSP',
      variant: 'aosp',
    }
  }

  return {
    displayName: props['ro.build.display.id'] || 'Android (custom)',
    variant: 'custom',
  }
}

/**
 * Detect the source type — how the Android system is being accessed.
 */
function detectSourceType(): AndroidSourceType {
  // Waydroid container
  if (fs.existsSync('/var/lib/waydroid/waydroid.cfg')) {
    return 'waydroid-container'
  }

  // AOSP build output directory
  if (fs.existsSync('/out/target/product') || process.env.ANDROID_PRODUCT_OUT) {
    return 'build-output'
  }

  // Running live system
  return 'live-system'
}

/**
 * Check if Google Play Services / GApps are installed.
 */
function detectGapps(): boolean {
  const gappsIndicators = [
    '/system/app/GoogleServicesFramework',
    '/system/priv-app/GmsCore',
    '/system/priv-app/Phonesky',       // Play Store
    '/system/product/app/GoogleServicesFramework',
    '/system/product/priv-app/GmsCore',
    '/product/app/GoogleServicesFramework',
    '/product/priv-app/GmsCore',
  ]

  return gappsIndicators.some((p) => fs.existsSync(p))
}

/**
 * Check if root (Magisk, SuperSU, etc.) is detected.
 */
function detectRoot(): boolean {
  const rootIndicators = [
    '/system/app/Superuser.apk',
    '/system/xbin/su',
    '/system/bin/su',
    '/sbin/su',
    '/data/adb/magisk',
    '/data/adb/modules',
  ]

  return rootIndicators.some((p) => fs.existsSync(p))
}

/**
 * Full variant detection — gathers all metadata about the Android environment.
 */
export function detectAndroidVariant(): IAndroidVariantInfo {
  const props = readAllBuildProps() as Record<string, string>
  const { variant, displayName } = identifyVariant(props)
  const arch = detectAndroidArch(props)
  const partitions = detectPartitionLayout()
  const sourceType = detectSourceType()

  // GrapheneOS-specific detection
  const grapheneOS = variant === 'grapheneos' || checkIsGrapheneOS()
    ? detectGrapheneOS()
    : null

  return {
    androidVersion: props['ro.build.version.release'] || 'unknown',
    arch,
    buildId: props['ro.build.display.id'] || 'unknown',
    buildType: props['ro.build.type'] || 'unknown',
    displayName,
    grapheneOS,
    hasGapps: detectGapps(),
    hasRoot: detectRoot(),
    partitions,
    sdkLevel: props['ro.build.version.sdk'] || 'unknown',
    securityPatch: props['ro.build.version.security_patch'] || 'unknown',
    sourceType,
    variant,
  }
}
