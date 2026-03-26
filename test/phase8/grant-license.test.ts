/**
 * test/phase8/grant-license.test.ts
 * Tests for the grant license compliance plugin.
 */

import { expect } from 'chai'
import fs from 'node:fs'
import path from 'node:path'

import { createMockExec } from '../helpers/mock-exec.js'
import { createTempDir, cleanTempDir, createFile } from '../helpers/mock-fs.js'
import { GrantLicense } from '../../plugins/sbom/grant-license/grant-license.js'

describe('GrantLicense', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = createTempDir('grant-test-')
  })

  afterEach(() => {
    cleanTempDir(tempDir)
  })

  describe('isAvailable()', () => {
    it('should return true when grant is on PATH', async () => {
      const mock = createMockExec(new Map([
        ['command -v grant', { code: 0, data: '/usr/local/bin/grant' }],
      ]))
      const grant = new GrantLicense(mock.exec)

      expect(await grant.isAvailable()).to.be.true
    })

    it('should return false when grant is not installed', async () => {
      const mock = createMockExec(new Map([
        ['command -v grant', { code: 1, data: '' }],
      ]))
      const grant = new GrantLicense(mock.exec)

      expect(await grant.isAvailable()).to.be.false
    })
  })

  describe('check()', () => {
    it('should return passed: true when grant exits zero', async () => {
      const sbomPath = createFile(tempDir, 'test.sbom.json', '{}')
      const mock = createMockExec(new Map([
        ['grant check', { code: 0, data: 'All licenses allowed' }],
      ]))
      const grant = new GrantLicense(mock.exec)

      const result = await grant.check(sbomPath)

      expect(result.passed).to.be.true
      expect(result.output).to.include('All licenses allowed')
      expect(result.target).to.equal(sbomPath)
    })

    it('should throw by default when grant exits non-zero', async () => {
      const sbomPath = createFile(tempDir, 'test.sbom.json', '{}')
      const mock = createMockExec(new Map([
        ['grant check', { code: 1, data: 'GPL-3.0 denied' }],
      ]))
      const grant = new GrantLicense(mock.exec)

      try {
        await grant.check(sbomPath)
        expect.fail('Should have thrown')
      } catch (err: any) {
        expect(err.message).to.include('License policy violation')
        expect(err.message).to.include('GPL-3.0 denied')
      }
    })

    it('should return passed: false without throwing when failOnDeny is false', async () => {
      const sbomPath = createFile(tempDir, 'test.sbom.json', '{}')
      const mock = createMockExec(new Map([
        ['grant check', { code: 1, data: 'GPL-3.0 denied' }],
      ]))
      const grant = new GrantLicense(mock.exec)

      const result = await grant.check(sbomPath, { failOnDeny: false })

      expect(result.passed).to.be.false
      expect(result.output).to.include('GPL-3.0 denied')
    })

    it('should pass --config flag when policyFile is provided', async () => {
      const sbomPath = createFile(tempDir, 'test.sbom.json', '{}')
      const policyFile = createFile(tempDir, '.grant.yaml', 'rules: []')
      const mock = createMockExec()
      const grant = new GrantLicense(mock.exec)

      await grant.check(sbomPath, { policyFile })

      expect(mock.wasCalled('--config')).to.be.true
      expect(mock.wasCalled(policyFile)).to.be.true
    })

    it('should not pass --config flag when no policyFile is given', async () => {
      const sbomPath = createFile(tempDir, 'test.sbom.json', '{}')
      const mock = createMockExec()
      const grant = new GrantLicense(mock.exec)

      await grant.check(sbomPath)

      expect(mock.wasCalled('--config')).to.be.false
    })
  })

  describe('list()', () => {
    it('should invoke grant list and return output', async () => {
      const target = createFile(tempDir, 'test.sbom.json', '{}')
      const expectedOutput = 'MIT\nApache-2.0\nBSD-3-Clause'
      const mock = createMockExec(new Map([
        ['grant list', { code: 0, data: expectedOutput }],
      ]))
      const grant = new GrantLicense(mock.exec)

      const output = await grant.list(target)

      expect(output).to.equal(expectedOutput)
      expect(mock.wasCalled('grant list')).to.be.true
    })
  })

  describe('initPolicy()', () => {
    it('should write a default .grant.yaml when none exists', () => {
      const policyPath = path.join(tempDir, '.grant.yaml')
      const mock = createMockExec()
      const grant = new GrantLicense(mock.exec)

      grant.initPolicy(policyPath)

      expect(fs.existsSync(policyPath)).to.be.true
      const content = fs.readFileSync(policyPath, 'utf8')
      expect(content).to.include('rules:')
      expect(content).to.include('MIT')
      expect(content).to.include('Apache-2.0')
    })

    it('should not overwrite an existing policy file', () => {
      const policyPath = createFile(tempDir, '.grant.yaml', 'rules: []')
      const mock = createMockExec()
      const grant = new GrantLicense(mock.exec)

      grant.initPolicy(policyPath)

      const content = fs.readFileSync(policyPath, 'utf8')
      expect(content).to.equal('rules: []')
    })
  })
})
