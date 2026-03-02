import { expect } from 'chai'

import {
  archSupportsISO,
  archSupportsFastboot,
  bootloaderForArch,
  detectAndroidArch,
  kernelImageName,
} from '../src/android/arch-detect.js'

describe('Android arch-detect', () => {
  describe('detectAndroidArch', () => {
    it('should detect x86_64 with x86 multilib', () => {
      const props = {
        'ro.product.cpu.abi': 'x86_64',
        'ro.product.cpu.abilist': 'x86_64,x86',
        'ro.product.cpu.abilist32': 'x86',
        'ro.product.cpu.abilist64': 'x86_64',
      }

      const arch = detectAndroidArch(props)
      expect(arch.primaryAbi).to.equal('x86_64')
      expect(arch.secondaryAbi).to.equal('x86')
      expect(arch.is64Bit).to.be.true
      expect(arch.isMultilib).to.be.true
      expect(arch.kernelArch).to.equal('x86_64')
      expect(arch.abiList).to.deep.equal(['x86_64', 'x86'])
    })

    it('should detect pure x86 (32-bit only)', () => {
      const props = {
        'ro.product.cpu.abi': 'x86',
        'ro.product.cpu.abilist': 'x86',
        'ro.product.cpu.abilist32': 'x86',
        'ro.product.cpu.abilist64': '',
      }

      const arch = detectAndroidArch(props)
      expect(arch.primaryAbi).to.equal('x86')
      expect(arch.secondaryAbi).to.be.null
      expect(arch.is64Bit).to.be.false
      expect(arch.isMultilib).to.be.false
      expect(arch.kernelArch).to.equal('i686')
    })

    it('should detect ARM64 with ARM32 multilib', () => {
      const props = {
        'ro.product.cpu.abi': 'arm64-v8a',
        'ro.product.cpu.abilist': 'arm64-v8a,armeabi-v7a,armeabi',
        'ro.product.cpu.abilist32': 'armeabi-v7a,armeabi',
        'ro.product.cpu.abilist64': 'arm64-v8a',
      }

      const arch = detectAndroidArch(props)
      expect(arch.primaryAbi).to.equal('arm64-v8a')
      expect(arch.secondaryAbi).to.equal('armeabi-v7a')
      expect(arch.is64Bit).to.be.true
      expect(arch.isMultilib).to.be.true
      expect(arch.kernelArch).to.equal('aarch64')
    })

    it('should detect ARM32 only', () => {
      const props = {
        'ro.product.cpu.abi': 'armeabi-v7a',
        'ro.product.cpu.abilist': 'armeabi-v7a,armeabi',
        'ro.product.cpu.abilist32': 'armeabi-v7a,armeabi',
        'ro.product.cpu.abilist64': '',
      }

      const arch = detectAndroidArch(props)
      expect(arch.primaryAbi).to.equal('armeabi-v7a')
      expect(arch.secondaryAbi).to.be.null
      expect(arch.is64Bit).to.be.false
      expect(arch.isMultilib).to.be.false
      expect(arch.kernelArch).to.equal('armv7l')
    })

    it('should detect RISC-V 64', () => {
      const props = {
        'ro.product.cpu.abi': 'riscv64',
        'ro.product.cpu.abilist': 'riscv64',
        'ro.product.cpu.abilist32': '',
        'ro.product.cpu.abilist64': 'riscv64',
      }

      const arch = detectAndroidArch(props)
      expect(arch.primaryAbi).to.equal('riscv64')
      expect(arch.secondaryAbi).to.be.null
      expect(arch.is64Bit).to.be.true
      expect(arch.isMultilib).to.be.false
      expect(arch.kernelArch).to.equal('riscv64')
    })

    it('should fall back to node arch when no props available', () => {
      const arch = detectAndroidArch({})
      // On the CI/dev machine this will be x86_64
      expect(arch.primaryAbi).to.be.a('string')
      expect(arch.is64Bit).to.be.a('boolean')
    })
  })

  describe('bootloaderForArch', () => {
    it('should return grub for x86_64', () => {
      expect(bootloaderForArch('x86_64')).to.equal('grub')
    })

    it('should return syslinux for x86', () => {
      expect(bootloaderForArch('x86')).to.equal('syslinux')
    })

    it('should return uboot for ARM64', () => {
      expect(bootloaderForArch('arm64-v8a')).to.equal('uboot')
    })

    it('should return uboot for ARM32', () => {
      expect(bootloaderForArch('armeabi-v7a')).to.equal('uboot')
    })

    it('should return opensbi for RISC-V', () => {
      expect(bootloaderForArch('riscv64')).to.equal('opensbi')
    })
  })

  describe('archSupportsISO', () => {
    it('should support ISO for x86_64', () => {
      expect(archSupportsISO('x86_64')).to.be.true
    })

    it('should support ISO for x86', () => {
      expect(archSupportsISO('x86')).to.be.true
    })

    it('should support ISO for RISC-V', () => {
      expect(archSupportsISO('riscv64')).to.be.true
    })

    it('should NOT support ISO for ARM64', () => {
      expect(archSupportsISO('arm64-v8a')).to.be.false
    })

    it('should NOT support ISO for ARM32', () => {
      expect(archSupportsISO('armeabi-v7a')).to.be.false
    })
  })

  describe('archSupportsFastboot', () => {
    it('should support fastboot for x86_64', () => {
      expect(archSupportsFastboot('x86_64')).to.be.true
    })

    it('should support fastboot for ARM64', () => {
      expect(archSupportsFastboot('arm64-v8a')).to.be.true
    })

    it('should NOT support fastboot for RISC-V', () => {
      expect(archSupportsFastboot('riscv64')).to.be.false
    })
  })

  describe('kernelImageName', () => {
    it('should return bzImage for x86_64', () => {
      expect(kernelImageName('x86_64')).to.equal('bzImage')
    })

    it('should return bzImage for x86', () => {
      expect(kernelImageName('x86')).to.equal('bzImage')
    })

    it('should return Image.gz for ARM64', () => {
      expect(kernelImageName('arm64-v8a')).to.equal('Image.gz')
    })

    it('should return zImage for ARM32', () => {
      expect(kernelImageName('armeabi-v7a')).to.equal('zImage')
    })

    it('should return vmlinux for RISC-V', () => {
      expect(kernelImageName('riscv64')).to.equal('vmlinux')
    })
  })
})
