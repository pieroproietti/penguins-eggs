/**
 * test/phase7/vouch-attest.test.ts
 * Tests for the vouch attestation plugin.
 */

import { expect } from 'chai'
import fs from 'node:fs'
import path from 'node:path'

import { createMockExec } from '../helpers/mock-exec.js'
import { createTempDir, cleanTempDir, createMockIso, createFile } from '../helpers/mock-fs.js'
import { VouchAttest } from '../../plugins/security-audit/vouch-attest/vouch-attest.js'

describe('VouchAttest', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = createTempDir('vouch-test-')
  })

  afterEach(() => {
    cleanTempDir(tempDir)
  })

  describe('isAvailable()', () => {
    it('should return true when vouch is on PATH', async () => {
      const mock = createMockExec(new Map([
        ['command -v vouch', { code: 0, data: '/usr/local/bin/vouch' }],
      ]))
      const vouch = new VouchAttest(mock.exec)

      expect(await vouch.isAvailable()).to.be.true
    })

    it('should return false when vouch is not installed', async () => {
      const mock = createMockExec(new Map([
        ['command -v vouch', { code: 1, data: '' }],
      ]))
      const vouch = new VouchAttest(mock.exec)

      expect(await vouch.isAvailable()).to.be.false
    })
  })

  describe('attest()', () => {
    it('should throw when ISO does not exist', async () => {
      const mock = createMockExec()
      const vouch = new VouchAttest(mock.exec)

      try {
        await vouch.attest('/nonexistent/file.iso', {
          keyPath: '/key.pem',
          outputDir: tempDir,
        })
        expect.fail('Should have thrown')
      } catch (err: any) {
        expect(err.message).to.include('ISO not found')
      }
    })

    it('should create outputDir if it does not exist', async () => {
      const isoPath = createMockIso(tempDir)
      const outputDir = path.join(tempDir, 'attestations', 'nested')

      const mock = createMockExec()
      const vouch = new VouchAttest(mock.exec)

      await vouch.attest(isoPath, { keyPath: '/key.pem', outputDir })

      expect(fs.existsSync(outputDir)).to.be.true
    })

    it('should invoke vouch attest with correct arguments', async () => {
      const isoPath = createMockIso(tempDir)
      const keyPath = createFile(tempDir, 'signing.key', 'key-data')
      const outputDir = path.join(tempDir, 'out')

      const mock = createMockExec()
      const vouch = new VouchAttest(mock.exec)

      await vouch.attest(isoPath, { keyPath, outputDir })

      expect(mock.wasCalled('vouch attest')).to.be.true
      expect(mock.wasCalled(keyPath)).to.be.true
      expect(mock.wasCalled(isoPath)).to.be.true
    })

    it('should return bundle path alongside the ISO', async () => {
      const isoPath = createMockIso(tempDir, 'mylinux.iso')
      const outputDir = path.join(tempDir, 'out')

      const mock = createMockExec()
      const vouch = new VouchAttest(mock.exec)

      const result = await vouch.attest(isoPath, { keyPath: '/key.pem', outputDir })

      expect(result.bundlePath).to.include('mylinux.iso.attestation.json')
      expect(result.isoPath).to.equal(isoPath)
      expect(result.success).to.be.true
    })

    it('should return success: false when vouch exits non-zero', async () => {
      const isoPath = createMockIso(tempDir)
      const outputDir = path.join(tempDir, 'out')

      const mock = createMockExec(new Map([
        ['vouch attest', { code: 1, data: '', error: 'signing failed' }],
      ]))
      const vouch = new VouchAttest(mock.exec)

      const result = await vouch.attest(isoPath, { keyPath: '/key.pem', outputDir })

      expect(result.success).to.be.false
    })
  })

  describe('verify()', () => {
    it('should throw when bundle does not exist', async () => {
      const isoPath = createMockIso(tempDir)
      const mock = createMockExec()
      const vouch = new VouchAttest(mock.exec)

      try {
        await vouch.verify(isoPath, '/nonexistent/bundle.json')
        expect.fail('Should have thrown')
      } catch (err: any) {
        expect(err.message).to.include('Attestation bundle not found')
      }
    })

    it('should return true when vouch verify exits zero', async () => {
      const isoPath = createMockIso(tempDir)
      const bundlePath = createFile(tempDir, 'test.iso.attestation.json', '{}')

      const mock = createMockExec(new Map([
        ['vouch verify', { code: 0, data: 'OK' }],
      ]))
      const vouch = new VouchAttest(mock.exec)

      expect(await vouch.verify(isoPath, bundlePath)).to.be.true
    })

    it('should return false when vouch verify exits non-zero', async () => {
      const isoPath = createMockIso(tempDir)
      const bundlePath = createFile(tempDir, 'test.iso.attestation.json', '{}')

      const mock = createMockExec(new Map([
        ['vouch verify', { code: 1, data: '', error: 'signature mismatch' }],
      ]))
      const vouch = new VouchAttest(mock.exec)

      expect(await vouch.verify(isoPath, bundlePath)).to.be.false
    })
  })

  describe('show()', () => {
    it('should throw when bundle does not exist', async () => {
      const mock = createMockExec()
      const vouch = new VouchAttest(mock.exec)

      try {
        await vouch.show('/nonexistent/bundle.json')
        expect.fail('Should have thrown')
      } catch (err: any) {
        expect(err.message).to.include('Attestation bundle not found')
      }
    })

    it('should return vouch show output', async () => {
      const bundlePath = createFile(tempDir, 'bundle.json', '{}')
      const expectedOutput = 'Signed by: test-key\nISO: mylinux.iso'

      const mock = createMockExec(new Map([
        ['vouch show', { code: 0, data: expectedOutput }],
      ]))
      const vouch = new VouchAttest(mock.exec)

      const output = await vouch.show(bundlePath)
      expect(output).to.equal(expectedOutput)
    })
  })
})
