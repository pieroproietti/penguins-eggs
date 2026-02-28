/**
 * ./src/classes/ovary.d/android/android-iso.ts
 * penguins-eggs — Android backend
 * license: MIT
 *
 * Produces a bootable Android-x86 ISO from a running Android system
 * or from a set of Android partition images.
 *
 * The ISO layout follows the Android-x86 / BlissOS convention:
 *   /
 *   ├── boot/
 *   │   └── grub/
 *   │       ├── grub.cfg
 *   │       └── efi.img          (UEFI boot)
 *   ├── isolinux/
 *   │   ├── isolinux.bin
 *   │   ├── isolinux.cfg
 *   │   └── boot.cat
 *   ├── kernel                   (bzImage / vmlinuz)
 *   ├── initrd.img               (initramfs)
 *   ├── system.sfs               (squashfs of system.img)
 *   ├── data.img                 (optional, user data)
 *   └── .disk/
 *       └── info
 */

import fs from 'node:fs'
import path from 'node:path'

import { AndroidArch, archSupportsISO, bootloaderForArch, kernelImageName } from '../../../android/arch-detect.js'
import { readBuildProp } from '../../../android/prop-reader.js'
import { exec, shx } from '../../../lib/utils.js'
import Utils from '../../utils.js'

export interface IAndroidIsoConfig {
  /** Architecture of the target system */
  arch: AndroidArch
  /** Compression algorithm for system.sfs */
  compression: 'gzip' | 'lz4' | 'xz' | 'zstd'
  /** Include /data partition in the ISO */
  includeData: boolean
  /** Path to initrd image */
  initrdPath: string
  /** Path to kernel image */
  kernelPath: string
  /** Output ISO file path */
  outputPath: string
  /** Path to the Android system root (e.g., /system or directory containing system.img) */
  systemRoot: string
  /** Extra kernel command line parameters */
  extraCmdline: string
  /** Volume ID for the ISO */
  volid: string
  /** Verbose output */
  verbose: boolean
}

/**
 * Locate the Android kernel image.
 * Android-x86 stores it in various locations depending on the build.
 */
export function findAndroidKernel(): string {
  const candidates = [
    '/boot/kernel',
    '/boot/vmlinuz',
    '/boot/bzImage',
    '/boot/vmlinuz-android',
    // BlissOS / Android-x86 locations
    '/system/boot/kernel',
    '/system/boot/bzImage',
    // Mounted ISO live medium
    '/mnt/runtime/kernel',
  ]

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate
    }
  }

  // Fallback: search /boot for any kernel-like file
  if (fs.existsSync('/boot')) {
    try {
      const files = fs.readdirSync('/boot')
      for (const file of files) {
        if (file.startsWith('vmlinuz') || file.startsWith('bzImage') || file === 'kernel') {
          return path.join('/boot', file)
        }
      }
    } catch {
      // permission denied
    }
  }

  return ''
}

/**
 * Locate the Android initrd/initramfs image.
 */
export function findAndroidInitrd(): string {
  const candidates = [
    '/boot/initrd.img',
    '/boot/initramfs.img',
    '/boot/initrd',
    '/boot/ramdisk.img',
    '/system/boot/initrd.img',
    '/mnt/runtime/initrd.img',
  ]

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate
    }
  }

  if (fs.existsSync('/boot')) {
    try {
      const files = fs.readdirSync('/boot')
      for (const file of files) {
        if (file.startsWith('initrd') || file.startsWith('initramfs') || file === 'ramdisk.img') {
          return path.join('/boot', file)
        }
      }
    } catch {
      // permission denied
    }
  }

  return ''
}

/**
 * Create system.sfs — a squashfs image of the Android /system partition.
 *
 * If the system is running live (mounted /system), we squash the
 * mounted filesystem. If we have a system.img file, we squash that.
 */
export async function createSystemSfs(
  systemRoot: string,
  outputDir: string,
  compression: string,
  verbose: boolean
): Promise<string> {
  const sfsPath = path.join(outputDir, 'system.sfs')

  if (fs.existsSync(sfsPath)) {
    fs.unlinkSync(sfsPath)
  }

  // If systemRoot points to a system.img file, mount it first
  let mountedTmp = ''
  let sourceDir = systemRoot

  if (systemRoot.endsWith('.img') && fs.existsSync(systemRoot)) {
    mountedTmp = '/tmp/eggs-android-system-mount'
    await exec(`mkdir -p ${mountedTmp}`)
    await exec(`mount -o ro,loop ${systemRoot} ${mountedTmp}`)
    sourceDir = mountedTmp
  }

  // Verify the source looks like an Android system
  if (!fs.existsSync(path.join(sourceDir, 'build.prop')) &&
      !fs.existsSync(path.join(sourceDir, 'system', 'build.prop')) &&
      !fs.existsSync(path.join(sourceDir, 'framework')) &&
      !fs.existsSync(path.join(sourceDir, 'app'))) {
    if (mountedTmp) {
      await exec(`umount ${mountedTmp}`).catch(() => {})
    }
    throw new Error(`${sourceDir} does not appear to be an Android system root`)
  }

  Utils.warning(`creating system.sfs from ${sourceDir}`)

  const compFlag = `-comp ${compression}`
  const cmd = `mksquashfs ${sourceDir} ${sfsPath} ${compFlag} -no-progress`

  if (verbose) {
    console.log(`  ${cmd}`)
  }

  const result = await exec(cmd, Utils.setEcho(verbose))

  // Cleanup mount if we mounted
  if (mountedTmp) {
    await exec(`umount ${mountedTmp}`).catch(() => {})
    await exec(`rmdir ${mountedTmp}`).catch(() => {})
  }

  if (result.code !== 0) {
    throw new Error('mksquashfs failed')
  }

  return sfsPath
}

/**
 * Generate GRUB configuration for Android-x86 boot.
 */
export function generateGrubCfg(config: IAndroidIsoConfig): string {
  const kernelName = path.basename(config.kernelPath)
  const initrdName = path.basename(config.initrdPath)

  const androidVersion = readBuildProp('ro.build.version.release') || 'unknown'
  const displayId = readBuildProp('ro.build.display.id') || 'Android'

  const baseCmdline = `root=/dev/ram0 androidboot.selinux=permissive SRC= DATA= ${config.extraCmdline}`.trim()

  return `# GRUB configuration for ${displayId}
# Generated by penguins-eggs Android backend

set default=0
set timeout=10
set gfxmode=auto

insmod all_video
insmod gfxterm
insmod png

terminal_output gfxterm

menuentry "${displayId} (Android ${androidVersion})" --class android {
    linux /${kernelName} ${baseCmdline} quiet
    initrd /${initrdName}
}

menuentry "${displayId} (Debug mode)" --class android {
    linux /${kernelName} ${baseCmdline} DEBUG=2
    initrd /${initrdName}
}

menuentry "${displayId} (Vulkan mode)" --class android {
    linux /${kernelName} ${baseCmdline} VULKAN=1 quiet
    initrd /${initrdName}
}

menuentry "Boot from local disk" {
    set root=(hd0)
    chainloader +1
}
`
}

/**
 * Generate isolinux/syslinux configuration for legacy BIOS boot.
 */
export function generateIsolinuxCfg(config: IAndroidIsoConfig): string {
  const kernelName = path.basename(config.kernelPath)
  const initrdName = path.basename(config.initrdPath)

  const androidVersion = readBuildProp('ro.build.version.release') || 'unknown'
  const displayId = readBuildProp('ro.build.display.id') || 'Android'

  const baseCmdline = `root=/dev/ram0 androidboot.selinux=permissive SRC= DATA= ${config.extraCmdline}`.trim()

  return `default vesamenu.c32
timeout 100
prompt 0

menu title ${displayId} (Android ${androidVersion})
menu color title 1;36;44 #ffffffff #00000000 std

label android
    menu label ${displayId}
    menu default
    kernel /${kernelName}
    append initrd=/${initrdName} ${baseCmdline} quiet

label debug
    menu label ${displayId} (Debug mode)
    kernel /${kernelName}
    append initrd=/${initrdName} ${baseCmdline} DEBUG=2

label vulkan
    menu label ${displayId} (Vulkan)
    kernel /${kernelName}
    append initrd=/${initrdName} ${baseCmdline} VULKAN=1 quiet
`
}

/**
 * Create the ISO directory structure for an Android-x86 image.
 */
export async function createIsoStructure(workDir: string, config: IAndroidIsoConfig): Promise<void> {
  const isoDir = path.join(workDir, 'iso')

  // Create directory structure
  const dirs = [
    isoDir,
    path.join(isoDir, 'boot', 'grub', 'x86_64-efi'),
    path.join(isoDir, 'boot', 'grub', 'i386-pc'),
    path.join(isoDir, 'isolinux'),
    path.join(isoDir, '.disk'),
  ]

  for (const dir of dirs) {
    await exec(`mkdir -p ${dir}`)
  }

  // Copy kernel
  if (config.kernelPath && fs.existsSync(config.kernelPath)) {
    Utils.warning(`copying kernel: ${path.basename(config.kernelPath)}`)
    await exec(`cp ${config.kernelPath} ${isoDir}/`)
  } else {
    throw new Error(`Kernel not found at ${config.kernelPath}`)
  }

  // Copy initrd
  if (config.initrdPath && fs.existsSync(config.initrdPath)) {
    Utils.warning(`copying initrd: ${path.basename(config.initrdPath)}`)
    await exec(`cp ${config.initrdPath} ${isoDir}/`)
  } else {
    throw new Error(`Initrd not found at ${config.initrdPath}`)
  }

  // Create system.sfs
  await createSystemSfs(config.systemRoot, isoDir, config.compression, config.verbose)

  // Write GRUB config
  const grubCfg = generateGrubCfg(config)
  fs.writeFileSync(path.join(isoDir, 'boot', 'grub', 'grub.cfg'), grubCfg)

  // Write isolinux config (for legacy BIOS)
  const isolinuxCfg = generateIsolinuxCfg(config)
  fs.writeFileSync(path.join(isoDir, 'isolinux', 'isolinux.cfg'), isolinuxCfg)

  // Write .disk/info
  const displayId = readBuildProp('ro.build.display.id') || 'Android'
  const androidVersion = readBuildProp('ro.build.version.release') || 'unknown'
  fs.writeFileSync(
    path.join(isoDir, '.disk', 'info'),
    `${displayId} - Android ${androidVersion} - Built with penguins-eggs\n`
  )
}

/**
 * Build the final ISO using xorriso.
 * Handles both UEFI and legacy BIOS boot for x86/x86_64.
 */
export async function buildAndroidIso(workDir: string, config: IAndroidIsoConfig): Promise<string> {
  if (!archSupportsISO(config.arch)) {
    throw new Error(`Architecture ${config.arch} does not support ISO output. Use raw-img mode instead.`)
  }

  const isoDir = path.join(workDir, 'iso')

  // Check for xorriso
  if (shx.exec('which xorriso', { silent: true }).code !== 0) {
    throw new Error('xorriso is not installed. Install it with: apt install xorriso')
  }

  // Find isolinux.bin for legacy BIOS boot
  const isolinuxBinPaths = [
    '/usr/lib/ISOLINUX/isolinux.bin',
    '/usr/share/syslinux/isolinux.bin',
    '/usr/lib/syslinux/bios/isolinux.bin',
    path.join(isoDir, 'isolinux', 'isolinux.bin'),
  ]

  let isolinuxBin = ''
  for (const p of isolinuxBinPaths) {
    if (fs.existsSync(p)) {
      isolinuxBin = p
      break
    }
  }

  // Copy isolinux.bin if found
  if (isolinuxBin && isolinuxBin !== path.join(isoDir, 'isolinux', 'isolinux.bin')) {
    await exec(`cp ${isolinuxBin} ${isoDir}/isolinux/`)
  }

  // Copy ldlinux.c32 and other syslinux modules if available
  const syslinuxModDirs = [
    '/usr/lib/syslinux/modules/bios',
    '/usr/share/syslinux',
    '/usr/lib/ISOLINUX',
  ]

  for (const modDir of syslinuxModDirs) {
    if (fs.existsSync(modDir)) {
      const modules = ['ldlinux.c32', 'vesamenu.c32', 'libcom32.c32', 'libutil.c32']
      for (const mod of modules) {
        const modPath = path.join(modDir, mod)
        if (fs.existsSync(modPath)) {
          await exec(`cp ${modPath} ${isoDir}/isolinux/`).catch(() => {})
        }
      }

      break
    }
  }

  // Find isohdpfx.bin for isohybrid MBR
  const isohdpfxPaths = [
    '/usr/lib/ISOLINUX/isohdpfx.bin',
    '/usr/share/syslinux/isohdpfx.bin',
    '/usr/lib/syslinux/bios/isohdpfx.bin',
  ]

  let isohdpfxBin = ''
  for (const p of isohdpfxPaths) {
    if (fs.existsSync(p)) {
      isohdpfxBin = p
      break
    }
  }

  // Build xorriso command
  let cmd = `xorriso -as mkisofs`
  cmd += ` -J -joliet-long -r -l -iso-level 3`
  cmd += ` -V "${config.volid}"`

  // Isohybrid MBR (allows booting from USB)
  if (isohdpfxBin) {
    cmd += ` -isohybrid-mbr ${isohdpfxBin}`
    cmd += ` -partition_offset 16`
  }

  // Legacy BIOS boot via isolinux
  if (fs.existsSync(path.join(isoDir, 'isolinux', 'isolinux.bin'))) {
    cmd += ` -b isolinux/isolinux.bin`
    cmd += ` -c isolinux/boot.cat`
    cmd += ` -no-emul-boot -boot-load-size 4 -boot-info-table`
  }

  // UEFI boot via EFI image (if available)
  const efiImg = path.join(isoDir, 'boot', 'grub', 'efi.img')
  if (fs.existsSync(efiImg)) {
    cmd += ` -eltorito-alt-boot`
    cmd += ` -e boot/grub/efi.img`
    cmd += ` -no-emul-boot`
    cmd += ` -isohybrid-gpt-basdat`
  }

  cmd += ` -o ${config.outputPath}`
  cmd += ` ${isoDir}`

  Utils.warning(`building ISO: ${path.basename(config.outputPath)}`)
  if (config.verbose) {
    console.log(`  ${cmd}`)
  }

  const result = await exec(cmd, Utils.setEcho(config.verbose))
  if (result.code !== 0) {
    throw new Error('xorriso failed to create ISO')
  }

  // Generate checksums
  Utils.warning('creating checksums')
  await exec(`md5sum ${config.outputPath} > ${config.outputPath.replace('.iso', '.md5')}`)
  await exec(`sha256sum ${config.outputPath} > ${config.outputPath.replace('.iso', '.sha256')}`)

  return config.outputPath
}
