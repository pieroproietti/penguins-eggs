/**
 * ./src/android/arch-detect.ts
 * penguins-eggs
 * author: Piero Proietti / Android backend
 * license: MIT
 *
 * Detects Android CPU architecture from build.prop or system inspection.
 * Handles multilib (64-bit primary + 32-bit secondary) configurations.
 */

import os from 'node:os'

import { readAllBuildProps, readBuildProp } from './prop-reader.js'

/**
 * Android ABI names as used in ro.product.cpu.abi
 */
export type AndroidArch = 'arm64-v8a' | 'armeabi-v7a' | 'riscv64' | 'x86' | 'x86_64'

export interface IAndroidArchInfo {
  /** Full ABI list from ro.product.cpu.abilist */
  abiList: AndroidArch[]
  /** 64-bit architecture */
  is64Bit: boolean
  /** Has both 32-bit and 64-bit support */
  isMultilib: boolean
  /** Linux kernel arch string (x86_64, aarch64, riscv64, armv7l, i686) */
  kernelArch: string
  /** Primary ABI */
  primaryAbi: AndroidArch
  /** Secondary ABI for multilib (e.g., x86 under x86_64, armeabi-v7a under arm64-v8a) */
  secondaryAbi: AndroidArch | null
}

const KERNEL_ARCH_MAP: Record<AndroidArch, string> = {
  'arm64-v8a': 'aarch64',
  'armeabi-v7a': 'armv7l',
  'riscv64': 'riscv64',
  'x86': 'i686',
  'x86_64': 'x86_64',
}

const ARCH_64BIT: AndroidArch[] = ['arm64-v8a', 'riscv64', 'x86_64']

/**
 * Detect Android architecture from build.prop properties.
 * Falls back to Node.js os.arch() if build.prop is unavailable.
 */
export function detectAndroidArch(props?: Record<string, string>): IAndroidArchInfo {
  const buildProps = props || readAllBuildProps()

  const primaryAbi = (buildProps['ro.product.cpu.abi'] || nodeArchToAndroidAbi()) as AndroidArch
  const abiListStr = buildProps['ro.product.cpu.abilist'] || primaryAbi
  const abi32Str = buildProps['ro.product.cpu.abilist32'] || ''
  const abi64Str = buildProps['ro.product.cpu.abilist64'] || ''

  const abiList = abiListStr.split(',').filter(Boolean) as AndroidArch[]
  const abi32List = abi32Str.split(',').filter(Boolean) as AndroidArch[]
  const abi64List = abi64Str.split(',').filter(Boolean) as AndroidArch[]

  const is64Bit = ARCH_64BIT.includes(primaryAbi)
  const isMultilib = abi32List.length > 0 && abi64List.length > 0

  let secondaryAbi: AndroidArch | null = null
  if (isMultilib && abi32List.length > 0) {
    secondaryAbi = abi32List[0]
  }

  return {
    abiList,
    is64Bit,
    isMultilib,
    kernelArch: KERNEL_ARCH_MAP[primaryAbi] || 'unknown',
    primaryAbi,
    secondaryAbi,
  }
}

/**
 * Map Node.js os.arch() to Android ABI name.
 * Used as fallback when build.prop is not available.
 */
function nodeArchToAndroidAbi(): AndroidArch {
  const arch: string = os.arch()
  switch (arch) {
    case 'x64': {
      return 'x86_64'
    }

    case 'ia32':
    case 'x86': {
      return 'x86'
    }

    case 'arm64': {
      return 'arm64-v8a'
    }

    case 'arm': {
      return 'armeabi-v7a'
    }

    case 'riscv64': {
      return 'riscv64'
    }

    default: {
      return 'x86_64'
    }
  }
}

/**
 * Determine which bootloader type is appropriate for the given architecture.
 */
export function bootloaderForArch(arch: AndroidArch): 'edk2' | 'grub' | 'opensbi' | 'syslinux' | 'uboot' {
  switch (arch) {
    case 'x86_64': {
      return 'grub'
    }

    case 'x86': {
      return 'syslinux'
    }

    case 'arm64-v8a': {
      return 'uboot'
    }

    case 'armeabi-v7a': {
      return 'uboot'
    }

    case 'riscv64': {
      return 'opensbi'
    }

    default: {
      return 'grub'
    }
  }
}

/**
 * Whether the given architecture supports ISO output.
 * ARM architectures use raw disk images instead.
 */
export function archSupportsISO(arch: AndroidArch): boolean {
  switch (arch) {
    case 'x86_64':
    case 'x86':
    case 'riscv64': {
      return true
    }

    case 'arm64-v8a':
    case 'armeabi-v7a': {
      return false
    }

    default: {
      return false
    }
  }
}

/**
 * Whether the given architecture supports fastboot flashing.
 */
export function archSupportsFastboot(arch: AndroidArch): boolean {
  switch (arch) {
    case 'riscv64': {
      return false
    }

    default: {
      return true
    }
  }
}

/**
 * Get the expected kernel image filename pattern for the architecture.
 */
export function kernelImageName(arch: AndroidArch): string {
  switch (arch) {
    case 'x86_64':
    case 'x86': {
      return 'bzImage'
    }

    case 'arm64-v8a': {
      return 'Image.gz'
    }

    case 'armeabi-v7a': {
      return 'zImage'
    }

    case 'riscv64': {
      return 'vmlinux'
    }

    default: {
      return 'vmlinuz'
    }
  }
}
