/**
 * ./src/krill/classes/sequence.d/android_postinstall.ts
 * penguins-eggs — Android backend
 * license: MIT
 *
 * Post-installation steps specific to Android:
 *   1. SELinux context relabeling
 *   2. File permissions fixup
 *   3. build.prop updates for the installed system
 *   4. /data initialization
 *   5. Cache directory setup
 */

import fs from 'node:fs'
import path from 'node:path'

import Utils from '../../../classes/utils.js'
import { exec } from '../../../lib/utils.js'
import Sequence from '../../classes/sequence.js'

/**
 * Run all Android post-install steps.
 */
export async function androidPostInstall(this: Sequence): Promise<void> {
  const installTarget = this.installTarget

  Utils.warning('running Android post-install steps')

  await fixupBuildProp(installTarget, this)
  await initializeData(installTarget, this)
  await setupCache(installTarget, this)
  await fixPermissions(installTarget, this)
  await triggerSelinuxRelabel(installTarget, this)
}

/**
 * Update build.prop for the installed system.
 * Adjusts properties that differ between live and installed modes.
 */
async function fixupBuildProp(installTarget: string, seq: Sequence): Promise<void> {
  const buildPropPaths = [
    path.join(installTarget, 'system', 'build.prop'),
    path.join(installTarget, 'vendor', 'build.prop'),
  ]

  for (const propPath of buildPropPaths) {
    if (!fs.existsSync(propPath)) continue

    try {
      let content = fs.readFileSync(propPath, 'utf8')

      // Mark as installed (not live)
      if (!content.includes('ro.eggs.installed')) {
        content += '\n# penguins-eggs install marker\n'
        content += 'ro.eggs.installed=true\n'
        content += `ro.eggs.install_date=${new Date().toISOString()}\n`
      }

      fs.writeFileSync(propPath, content)
      Utils.warning(`updated ${propPath}`)
    } catch {
      // permission denied — may be read-only
    }
  }
}

/**
 * Initialize the /data partition with required directory structure.
 * Android expects specific directories with specific permissions and
 * SELinux contexts in /data.
 */
async function initializeData(installTarget: string, seq: Sequence): Promise<void> {
  const dataRoot = path.join(installTarget, 'data')
  if (!fs.existsSync(dataRoot)) {
    fs.mkdirSync(dataRoot, { recursive: true })
  }

  Utils.warning('initializing /data directory structure')

  // Core directories Android expects
  const dataDirs: Array<{ path: string; mode: string; owner: string }> = [
    { mode: '0771', owner: 'root:root', path: '' },
    { mode: '0771', owner: 'root:root', path: 'app' },
    { mode: '0700', owner: 'root:root', path: 'dalvik-cache' },
    { mode: '0771', owner: 'root:root', path: 'data' },
    { mode: '0770', owner: 'root:root', path: 'local' },
    { mode: '0775', owner: 'root:root', path: 'media' },
    { mode: '0775', owner: 'root:root', path: 'media/0' },
    { mode: '0771', owner: 'root:root', path: 'misc' },
    { mode: '0700', owner: 'root:root', path: 'misc/vold' },
    { mode: '0700', owner: 'root:root', path: 'misc/wifi' },
    { mode: '0771', owner: 'root:root', path: 'system' },
    { mode: '0700', owner: 'root:root', path: 'system/users' },
    { mode: '0700', owner: 'root:root', path: 'system/users/0' },
    { mode: '0771', owner: 'root:root', path: 'user' },
    { mode: '0771', owner: 'root:root', path: 'user/0' },
    { mode: '0771', owner: 'root:root', path: 'user_de' },
    { mode: '0771', owner: 'root:root', path: 'user_de/0' },
    { mode: '0700', owner: 'root:root', path: 'property' },
    { mode: '0700', owner: 'root:root', path: 'ss' },
    { mode: '0771', owner: 'root:root', path: 'resource-cache' },
  ]

  for (const dir of dataDirs) {
    const fullPath = path.join(dataRoot, dir.path)
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true })
    }

    await exec(`chmod ${dir.mode} ${fullPath}`).catch(() => {})
  }
}

/**
 * Set up /cache directory.
 * Modern Android (10+) uses /data/cache, but some components
 * still expect /cache to exist.
 */
async function setupCache(installTarget: string, seq: Sequence): Promise<void> {
  const cacheDir = path.join(installTarget, 'cache')
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true })
  }

  await exec(`chmod 0770 ${cacheDir}`).catch(() => {})

  // Create recovery directory in cache (used for OTA updates)
  const recoveryDir = path.join(cacheDir, 'recovery')
  if (!fs.existsSync(recoveryDir)) {
    fs.mkdirSync(recoveryDir, { recursive: true })
  }
}

/**
 * Fix file permissions on the installed system.
 * Android has strict permission requirements.
 */
async function fixPermissions(installTarget: string, seq: Sequence): Promise<void> {
  Utils.warning('fixing Android file permissions')

  const systemDir = path.join(installTarget, 'system')
  if (!fs.existsSync(systemDir)) return

  // System directories should be 0755
  await exec(`chmod 0755 ${systemDir}`).catch(() => {})

  // /system/bin and /system/xbin should be 0755 with executables 0755
  for (const binDir of ['bin', 'xbin']) {
    const fullPath = path.join(systemDir, binDir)
    if (fs.existsSync(fullPath)) {
      await exec(`chmod 0755 ${fullPath}`).catch(() => {})
      await exec(`chmod -R 0755 ${fullPath}/`).catch(() => {})
    }
  }

  // /system/lib and /system/lib64 should be 0755 with .so files 0644
  for (const libDir of ['lib', 'lib64']) {
    const fullPath = path.join(systemDir, libDir)
    if (fs.existsSync(fullPath)) {
      await exec(`find ${fullPath} -type d -exec chmod 0755 {} +`).catch(() => {})
      await exec(`find ${fullPath} -type f -name "*.so" -exec chmod 0644 {} +`).catch(() => {})
    }
  }

  // /system/app and /system/priv-app: dirs 0755, APKs 0644
  for (const appDir of ['app', 'priv-app']) {
    const fullPath = path.join(systemDir, appDir)
    if (fs.existsSync(fullPath)) {
      await exec(`find ${fullPath} -type d -exec chmod 0755 {} +`).catch(() => {})
      await exec(`find ${fullPath} -type f -exec chmod 0644 {} +`).catch(() => {})
    }
  }

  // /system/etc should be 0755
  const etcDir = path.join(systemDir, 'etc')
  if (fs.existsSync(etcDir)) {
    await exec(`find ${etcDir} -type d -exec chmod 0755 {} +`).catch(() => {})
    await exec(`find ${etcDir} -type f -exec chmod 0644 {} +`).catch(() => {})
  }
}

/**
 * Trigger SELinux relabeling on first boot.
 *
 * After copying files, SELinux contexts may be wrong.
 * We create a marker file that tells Android init to run
 * restorecon on first boot.
 *
 * Two approaches:
 *   1. Create /.autorelabel (standard Linux SELinux approach)
 *   2. Run restorecon now if available (preferred)
 */
async function triggerSelinuxRelabel(installTarget: string, seq: Sequence): Promise<void> {
  Utils.warning('setting up SELinux relabeling')

  // Approach 1: Try restorecon now (if available and file_contexts exist)
  const fileContexts = path.join(installTarget, 'system', 'etc', 'selinux', 'plat_file_contexts')
  if (fs.existsSync(fileContexts)) {
    const result = await exec(
      `restorecon -rF ${installTarget}/system 2>/dev/null`,
      Utils.setEcho(false)
    ).catch(() => ({ code: 1 }))

    if (result.code === 0) {
      Utils.warning('SELinux contexts restored successfully')
      return
    }
  }

  // Approach 2: Create autorelabel marker for first boot
  const autorelabelPath = path.join(installTarget, '.autorelabel')
  fs.writeFileSync(autorelabelPath, '')
  Utils.warning('created /.autorelabel — SELinux will relabel on first boot')

  // Also create the Android-specific relabel marker
  const dataRelabel = path.join(installTarget, 'data', '.layout_version')
  if (fs.existsSync(path.join(installTarget, 'data'))) {
    // layout_version = 3 triggers data migration/relabel
    fs.writeFileSync(dataRelabel, '3\n')
  }
}
