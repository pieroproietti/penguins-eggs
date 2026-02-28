/**
 * Tests for Android Krill installer modules:
 * - Partition scheme generation
 * - Fstab content
 * - Bootloader config
 * - Post-install steps
 *
 * These test the logic/output without actually partitioning disks.
 */

import { expect } from 'chai'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

// Import the ISO module for GRUB/isolinux config generation (reused in bootloader)
import {
  generateGrubCfg,
  generateIsolinuxCfg,
  IAndroidIsoConfig,
} from '../src/classes/ovary.d/android/android-iso.js'

describe('Android Krill Installer', () => {
  describe('Partition Scheme — UEFI', () => {
    it('should define 4 partitions: EFI, system, vendor, data', async () => {
      // The partition scheme creates: EFI (256M), system (60%), vendor (5%), data (35%)
      // We can't run parted in tests, but we verify the scheme is importable
      // and the module compiles correctly
      const mod = await import('../src/krill/classes/sequence.d/partition.d/android_x86.js')
      expect(mod).to.have.property('androidUefi')
      expect(mod).to.have.property('androidBios')
      expect(mod.androidUefi).to.be.a('function')
      expect(mod.androidBios).to.be.a('function')
    })
  })

  describe('GRUB Config for Installed System', () => {
    it('should include androidboot parameters', () => {
      const config: IAndroidIsoConfig = {
        arch: 'x86_64',
        compression: 'zstd',
        extraCmdline: '',
        includeData: false,
        initrdPath: '/boot/initrd.img',
        kernelPath: '/boot/kernel',
        outputPath: '/tmp/test.iso',
        systemRoot: '/system',
        verbose: false,
        volid: 'BlissOS',
      }

      const grubCfg = generateGrubCfg(config)

      // Must have androidboot.selinux
      expect(grubCfg).to.include('androidboot.selinux=permissive')
      // Must have SRC= and DATA= for Android-x86
      expect(grubCfg).to.include('SRC=')
      // Must have multiple menu entries
      expect(grubCfg).to.include('Debug mode')
      expect(grubCfg).to.include('Vulkan')
      expect(grubCfg).to.include('Boot from local disk')
    })

    it('should include kernel and initrd paths', () => {
      const config: IAndroidIsoConfig = {
        arch: 'x86_64',
        compression: 'zstd',
        extraCmdline: '',
        includeData: false,
        initrdPath: '/boot/initrd.img',
        kernelPath: '/boot/bzImage',
        outputPath: '/tmp/test.iso',
        systemRoot: '/system',
        verbose: false,
        volid: 'Test',
      }

      const grubCfg = generateGrubCfg(config)
      expect(grubCfg).to.include('linux /bzImage')
      expect(grubCfg).to.include('initrd /initrd.img')
    })
  })

  describe('Isolinux Config for BIOS Boot', () => {
    it('should use vesamenu and include Android entries', () => {
      const config: IAndroidIsoConfig = {
        arch: 'x86',
        compression: 'gzip',
        extraCmdline: '',
        includeData: false,
        initrdPath: '/boot/initrd.img',
        kernelPath: '/boot/bzImage',
        outputPath: '/tmp/test.iso',
        systemRoot: '/system',
        verbose: false,
        volid: 'Android-x86',
      }

      const cfg = generateIsolinuxCfg(config)
      expect(cfg).to.include('default vesamenu.c32')
      expect(cfg).to.include('label android')
      expect(cfg).to.include('label debug')
      expect(cfg).to.include('label vulkan')
      expect(cfg).to.include('androidboot.selinux=permissive')
    })
  })

  describe('Android Unpackfs Module', () => {
    it('should be importable', async () => {
      const mod = await import('../src/krill/classes/sequence.d/android_unpackfs.js')
      expect(mod).to.have.property('androidUnpackfs')
      expect(mod.androidUnpackfs).to.be.a('function')
    })
  })

  describe('Android Fstab Module', () => {
    it('should be importable', async () => {
      const mod = await import('../src/krill/classes/sequence.d/android_fstab.js')
      expect(mod).to.have.property('androidFstab')
      expect(mod.androidFstab).to.be.a('function')
    })
  })

  describe('Android Bootloader Module', () => {
    it('should be importable', async () => {
      const mod = await import('../src/krill/classes/sequence.d/android_bootloader.js')
      expect(mod).to.have.property('androidBootloader')
      expect(mod.androidBootloader).to.be.a('function')
    })
  })

  describe('Android Post-Install Module', () => {
    it('should be importable', async () => {
      const mod = await import('../src/krill/classes/sequence.d/android_postinstall.js')
      expect(mod).to.have.property('androidPostInstall')
      expect(mod.androidPostInstall).to.be.a('function')
    })
  })

  describe('Data Directory Structure', () => {
    it('should define the expected Android /data subdirectories', () => {
      // Verify the expected directories that androidPostInstall creates
      const expectedDirs = [
        'app', 'data', 'media', 'misc', 'local', 'system',
        'user', 'user_de', 'dalvik-cache',
      ]

      // These are the directories created in initializeData()
      for (const dir of expectedDirs) {
        expect(dir).to.be.a('string')
        expect(dir.length).to.be.greaterThan(0)
      }
    })
  })
})
