/**
 * Phase 3 tests: vendor detection, partition parser, AVB, OTA.
 * Uses synthetic data and mock files — no real Android system needed.
 */

import { expect } from 'chai'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { hasDynPartTools } from '../src/android/partition-parser.js'
import { hasAvbTools, detectAvbStatus } from '../src/classes/ovary.d/android/avb-signing.js'
import { generateOtaMetadata, IOtaConfig } from '../src/classes/ovary.d/android/android-ota.js'

// We need to export parseLpdumpOutput for testing — but it's private.
// Instead, test readSuperMetadata with a synthetic super.img header.

describe('Android Phase 3 — Partition Parser', () => {
  describe('hasDynPartTools', () => {
    it('should return an object with boolean fields', () => {
      const tools = hasDynPartTools()
      expect(tools).to.have.property('lpdump')
      expect(tools).to.have.property('lpmake')
      expect(tools).to.have.property('lpunpack')
      expect(tools.lpdump).to.be.a('boolean')
      expect(tools.lpmake).to.be.a('boolean')
      expect(tools.lpunpack).to.be.a('boolean')
    })
  })

  describe('LP metadata header detection', () => {
    it('should detect valid LP metadata magic in a synthetic super.img', async () => {
      const { readSuperMetadata } = await import('../src/android/partition-parser.js')

      // Create a synthetic super.img with LP metadata magic at offset 4096
      const tmpFile = path.join(os.tmpdir(), 'eggs-test-super.img')
      const buf = Buffer.alloc(8192, 0)

      // LP_METADATA_GEOMETRY_MAGIC = 0x616c4467 at offset 4096
      buf.writeUInt32LE(0x616c4467, 4096)
      // struct_size at offset 4100
      buf.writeUInt32LE(52, 4100)
      // metadata_max_size at offset 4108
      buf.writeUInt32LE(65536, 4108)
      // metadata_slot_count at offset 4112
      buf.writeUInt32LE(2, 4112)

      fs.writeFileSync(tmpFile, buf)

      const metadata = await readSuperMetadata(tmpFile)
      // If lpdump is not available, it falls back to header reading
      if (!hasDynPartTools().lpdump) {
        expect(metadata.isValid).to.be.true
        expect(metadata.metadataSlotCount).to.equal(2)
      }

      fs.unlinkSync(tmpFile)
    })

    it('should reject invalid super.img', async () => {
      const { readSuperMetadata } = await import('../src/android/partition-parser.js')

      const tmpFile = path.join(os.tmpdir(), 'eggs-test-not-super.img')
      fs.writeFileSync(tmpFile, Buffer.alloc(8192, 0))

      const metadata = await readSuperMetadata(tmpFile)
      expect(metadata.isValid).to.be.false

      fs.unlinkSync(tmpFile)
    })

    it('should handle non-existent file', async () => {
      const { readSuperMetadata } = await import('../src/android/partition-parser.js')
      const metadata = await readSuperMetadata('/nonexistent/super.img')
      expect(metadata.isValid).to.be.false
      expect(metadata.partitions).to.have.lengthOf(0)
    })
  })
})

describe('Android Phase 3 — AVB Signing', () => {
  describe('hasAvbTools', () => {
    it('should return an object with boolean fields', () => {
      const tools = hasAvbTools()
      expect(tools).to.have.property('avbtool')
      expect(tools).to.have.property('avbroot')
      expect(tools.avbtool).to.be.a('boolean')
      expect(tools.avbroot).to.be.a('boolean')
    })
  })

  describe('detectAvbStatus', () => {
    it('should return AVB info structure', () => {
      const status = detectAvbStatus()
      expect(status).to.have.property('enabled')
      expect(status).to.have.property('algorithm')
      expect(status).to.have.property('locked')
      expect(status).to.have.property('state')
      expect(status).to.have.property('version')
      expect(status.enabled).to.be.a('boolean')
      // On a non-Android system, AVB should not be enabled
      expect(status.enabled).to.be.false
    })
  })
})

describe('Android Phase 3 — OTA Package', () => {
  describe('generateOtaMetadata', () => {
    it('should generate valid metadata for LineageOS updater', () => {
      const config: IOtaConfig = {
        device: 'x86_64',
        fingerprint: 'bliss/x86_64/x86_64:13/TQ3A.230901.001/eng:userdebug/test-keys',
        images: {
          boot: '/tmp/boot.img',
          system: '/tmp/system.img',
        },
        outputPath: '/tmp/BlissOS-13-x86_64-ota.zip',
        romName: 'BlissOS',
        romVersion: '16.9.4',
        sdkVersion: '33',
        timestamp: 1709136000,
        useBrotli: false,
        verbose: false,
      }

      const metadata = generateOtaMetadata(config, 1024 * 1024 * 500)

      expect(metadata.datetime).to.equal(1709136000)
      expect(metadata.filename).to.equal('BlissOS-13-x86_64-ota.zip')
      expect(metadata.id).to.be.a('string')
      expect(metadata.id).to.have.lengthOf(32)
      expect(metadata.romtype).to.equal('UNOFFICIAL')
      expect(metadata.size).to.equal(1024 * 1024 * 500)
      expect(metadata.version).to.equal('16.9.4')
    })

    it('should generate unique IDs for different configs', () => {
      const baseConfig: IOtaConfig = {
        device: 'arm64',
        fingerprint: 'lineage/arm64:14/UQ1A',
        images: {},
        outputPath: '/tmp/lineage-ota.zip',
        romName: 'LineageOS',
        romVersion: '21.0',
        sdkVersion: '34',
        timestamp: 1709136000,
        useBrotli: false,
        verbose: false,
      }

      const meta1 = generateOtaMetadata(baseConfig, 100)
      const meta2 = generateOtaMetadata({ ...baseConfig, timestamp: 1709136001 }, 100)

      expect(meta1.id).to.not.equal(meta2.id)
    })

    it('should handle ARM64 LineageOS config', () => {
      const config: IOtaConfig = {
        device: 'generic_arm64',
        fingerprint: 'lineage/generic_arm64/generic_arm64:14/UQ1A.240205.002',
        images: {
          boot: '/tmp/boot.img',
          system: '/tmp/system.img',
          vendor: '/tmp/vendor.img',
          vbmeta: '/tmp/vbmeta.img',
        },
        outputPath: '/home/eggs/lineageos-14-arm64-ota.zip',
        romName: 'LineageOS',
        romVersion: '21.0',
        sdkVersion: '34',
        timestamp: 1709222400,
        useBrotli: true,
        verbose: false,
      }

      const metadata = generateOtaMetadata(config, 2 * 1024 * 1024 * 1024)

      expect(metadata.filename).to.equal('lineageos-14-arm64-ota.zip')
      expect(metadata.version).to.equal('21.0')
      expect(metadata.size).to.equal(2 * 1024 * 1024 * 1024)
    })
  })
})

describe('Android Phase 3 — Vendor Detection', () => {
  describe('detectVendorInfo', () => {
    it('should return vendor info structure even when no vendor exists', async () => {
      const { detectVendorInfo } = await import('../src/classes/ovary.d/android/android-vendor.js')
      const info = detectVendorInfo()

      expect(info).to.have.property('path')
      expect(info).to.have.property('isSeparate')
      expect(info).to.have.property('fingerprint')
      expect(info).to.have.property('hals')
      expect(info).to.have.property('size')
      expect(info.hals).to.be.an('array')
      // On non-Android system, path should be empty
      expect(info.path).to.equal('')
    })
  })
})
