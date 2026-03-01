/**
 * test/phase2/lfs-ipfs-setup.test.ts
 * Tests for the git-lfs-ipfs transfer agent setup.
 */

import { expect } from 'chai'
import fs from 'node:fs'
import path from 'node:path'

import { createMockExec, COMMON_RESPONSES } from '../helpers/mock-exec.js'
import { createTempDir, cleanTempDir, createMockGitDir } from '../helpers/mock-fs.js'
import { LfsIpfsSetup } from '../../plugins/decentralized/lfs-ipfs/lfs-ipfs-setup.js'

describe('LfsIpfsSetup', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = createTempDir('lfs-ipfs-test-')
  })

  afterEach(() => {
    cleanTempDir(tempDir)
  })

  describe('isInstalled()', () => {
    it('should return true when git-lfs-ipfs binary exists', async () => {
      const mock = createMockExec(new Map([
        ['command -v git-lfs-ipfs', { code: 0, data: '/usr/local/bin/git-lfs-ipfs' }],
      ]))
      const setup = new LfsIpfsSetup(mock.exec)

      expect(await setup.isInstalled()).to.be.true
    })

    it('should return false when not installed', async () => {
      const mock = createMockExec(new Map([
        ['command -v git-lfs-ipfs', { code: 1, data: '' }],
        ['pip show ipgit', { code: 1, data: '' }],
      ]))
      const setup = new LfsIpfsSetup(mock.exec)

      expect(await setup.isInstalled()).to.be.false
    })
  })

  describe('isIpfsRunning()', () => {
    it('should return true when IPFS daemon responds', async () => {
      const mock = createMockExec(COMMON_RESPONSES.ipfsRunning)
      const setup = new LfsIpfsSetup(mock.exec)

      expect(await setup.isIpfsRunning()).to.be.true
    })

    it('should return false when IPFS daemon is down', async () => {
      const mock = createMockExec(new Map([
        ['ipfs id', { code: 1, data: '', error: 'connection refused' }],
      ]))
      const setup = new LfsIpfsSetup(mock.exec)

      expect(await setup.isIpfsRunning()).to.be.false
    })
  })

  describe('configure()', () => {
    it('should throw when git-lfs-ipfs is not installed', async () => {
      const mock = createMockExec(new Map([
        ['command -v git-lfs-ipfs', { code: 1, data: '' }],
      ]))
      const setup = new LfsIpfsSetup(mock.exec)

      try {
        await setup.configure(tempDir)
        expect.fail('Should have thrown')
      } catch (err: any) {
        expect(err.message).to.include('git-lfs-ipfs not found')
      }
    })

    it('should throw when IPFS daemon is not running', async () => {
      const mock = createMockExec(new Map([
        ['command -v git-lfs-ipfs', { code: 0, data: '/usr/bin/git-lfs-ipfs' }],
        ['ipfs id', { code: 1, data: '' }],
      ]))
      const setup = new LfsIpfsSetup(mock.exec)

      try {
        await setup.configure(tempDir)
        expect.fail('Should have thrown')
      } catch (err: any) {
        expect(err.message).to.include('IPFS daemon not running')
      }
    })

    it('should set git config for lfs transfer agent', async () => {
      const mock = createMockExec(new Map<string | RegExp, any>([
        ['command -v git-lfs-ipfs', { code: 0, data: '/usr/bin/git-lfs-ipfs' }],
        ['ipfs id', { code: 0, data: '{}' }],
        [/git.*config/, { code: 0, data: '' }],
      ]))
      const setup = new LfsIpfsSetup(mock.exec)

      await setup.configure(tempDir)

      expect(mock.wasCalled('lfs.standalonetransferagent')).to.be.true
      expect(mock.wasCalled('lfs.customtransfer.ipfs.path')).to.be.true
      expect(mock.wasCalled('lfs.customtransfer.ipfs.concurrent')).to.be.true
    })

    it('should create .lfsconfig if it does not exist', async () => {
      const mock = createMockExec(new Map<string | RegExp, any>([
        ['command -v git-lfs-ipfs', { code: 0, data: '/usr/bin/git-lfs-ipfs' }],
        ['ipfs id', { code: 0, data: '{}' }],
        [/git.*config/, { code: 0, data: '' }],
      ]))
      const setup = new LfsIpfsSetup(mock.exec)

      await setup.configure(tempDir)

      const lfsConfigPath = path.join(tempDir, '.lfsconfig')
      expect(fs.existsSync(lfsConfigPath)).to.be.true

      const content = fs.readFileSync(lfsConfigPath, 'utf8')
      expect(content).to.include('standalonetransferagent = ipfs')
    })
  })

  describe('configureGlobal()', () => {
    it('should set global git config', async () => {
      const mock = createMockExec(new Map<string | RegExp, any>([
        ['command -v git-lfs-ipfs', { code: 0, data: '/usr/bin/git-lfs-ipfs' }],
        [/git config --global/, { code: 0, data: '' }],
      ]))
      const setup = new LfsIpfsSetup(mock.exec)

      await setup.configureGlobal()

      expect(mock.callCount(/git config --global/)).to.equal(3)
    })
  })
})
