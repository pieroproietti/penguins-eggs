/**
 * test/phase8/syft-generate.test.ts
 * Tests for the syft SBOM generation plugin.
 */

import { expect } from 'chai'
import fs from 'node:fs'
import path from 'node:path'

import { createMockExec } from '../helpers/mock-exec.js'
import { createTempDir, cleanTempDir, createMockIso } from '../helpers/mock-fs.js'
import { SyftGenerate } from '../../plugins/sbom/syft-generate/syft-generate.js'

describe('SyftGenerate', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = createTempDir('syft-test-')
  })

  afterEach(() => {
    cleanTempDir(tempDir)
  })

  describe('isAvailable()', () => {
    it('should return true when syft is on PATH', async () => {
      const mock = createMockExec(new Map([
        ['command -v syft', { code: 0, data: '/usr/local/bin/syft' }],
      ]))
      const syft = new SyftGenerate(mock.exec)

      expect(await syft.isAvailable()).to.be.true
    })

    it('should return false when syft is not installed', async () => {
      const mock = createMockExec(new Map([
        ['command -v syft', { code: 1, data: '' }],
      ]))
      const syft = new SyftGenerate(mock.exec)

      expect(await syft.isAvailable()).to.be.false
    })
  })

  describe('generate()', () => {
    it('should throw when ISO does not exist', async () => {
      const mock = createMockExec()
      const syft = new SyftGenerate(mock.exec)

      try {
        await syft.generate('/nonexistent/file.iso', { outputDir: tempDir })
        expect.fail('Should have thrown')
      } catch (err: any) {
        expect(err.message).to.include('ISO not found')
      }
    })

    it('should create outputDir if it does not exist', async () => {
      const isoPath = createMockIso(tempDir)
      const outputDir = path.join(tempDir, 'sbom', 'nested')

      const mock = createMockExec()
      const syft = new SyftGenerate(mock.exec)

      await syft.generate(isoPath, { outputDir })

      expect(fs.existsSync(outputDir)).to.be.true
    })

    it('should mount the ISO before scanning', async () => {
      const isoPath = createMockIso(tempDir)
      const mock = createMockExec()
      const syft = new SyftGenerate(mock.exec)

      await syft.generate(isoPath, { outputDir: tempDir })

      expect(mock.wasCalled('mount')).to.be.true
      expect(mock.wasCalled('loop,ro')).to.be.true
    })

    it('should unmount the ISO after scanning even if syft fails', async () => {
      const isoPath = createMockIso(tempDir)
      const mock = createMockExec(new Map([
        [/syft dir:/, { code: 1, data: '', error: 'syft error' }],
      ]))
      const syft = new SyftGenerate(mock.exec)

      try {
        await syft.generate(isoPath, { outputDir: tempDir })
      } catch {
        // expected
      }

      expect(mock.wasCalled('umount')).to.be.true
    })

    it('should invoke syft with spdx-json format by default', async () => {
      const isoPath = createMockIso(tempDir)
      const mock = createMockExec()
      const syft = new SyftGenerate(mock.exec)

      await syft.generate(isoPath, { outputDir: tempDir })

      expect(mock.wasCalled('syft dir:')).to.be.true
      expect(mock.wasCalled('spdx-json')).to.be.true
    })

    it('should use the requested format', async () => {
      const isoPath = createMockIso(tempDir)
      const mock = createMockExec()
      const syft = new SyftGenerate(mock.exec)

      await syft.generate(isoPath, { outputDir: tempDir, format: 'cyclonedx-json' })

      expect(mock.wasCalled('cyclonedx-json')).to.be.true
    })

    it('should return SbomResult with correct paths', async () => {
      const isoPath = createMockIso(tempDir, 'mylinux.iso')
      const outputDir = path.join(tempDir, 'out')
      const mock = createMockExec()
      const syft = new SyftGenerate(mock.exec)

      const result = await syft.generate(isoPath, { outputDir })

      expect(result.sbomPath).to.include('mylinux.sbom.json')
      expect(result.isoPath).to.equal(isoPath)
      expect(result.format).to.equal('spdx-json')
    })
  })

  describe('generateFromDir()', () => {
    it('should throw when directory does not exist', async () => {
      const mock = createMockExec()
      const syft = new SyftGenerate(mock.exec)

      try {
        await syft.generateFromDir('/nonexistent/dir', { outputDir: tempDir })
        expect.fail('Should have thrown')
      } catch (err: any) {
        expect(err.message).to.include('Directory not found')
      }
    })

    it('should not mount/unmount when scanning a directory', async () => {
      const dirPath = path.join(tempDir, 'chroot')
      fs.mkdirSync(dirPath)
      const mock = createMockExec()
      const syft = new SyftGenerate(mock.exec)

      await syft.generateFromDir(dirPath, { outputDir: tempDir })

      expect(mock.wasCalled('mount')).to.be.false
      expect(mock.wasCalled('umount')).to.be.false
      expect(mock.wasCalled('syft dir:')).to.be.true
    })
  })
})
