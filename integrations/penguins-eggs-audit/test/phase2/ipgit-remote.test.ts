/**
 * test/phase2/ipgit-remote.test.ts
 * Tests for the ipgit IPFS remote.
 */

import { expect } from 'chai'
import fs from 'node:fs'

import { createMockExec } from '../helpers/mock-exec.js'
import { createTempDir, cleanTempDir, createMockGitDir } from '../helpers/mock-fs.js'
import { IpgitRemote } from '../../plugins/decentralized/ipgit-remote/ipgit-remote.js'

describe('IpgitRemote', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = createTempDir('ipgit-test-')
  })

  afterEach(() => {
    cleanTempDir(tempDir)
  })

  describe('isInstalled()', () => {
    it('should return true when ipgit binary exists', async () => {
      const mock = createMockExec(new Map([
        ['command -v ipgit', { code: 0, data: '/usr/bin/ipgit' }],
      ]))
      const remote = new IpgitRemote(mock.exec)

      expect(await remote.isInstalled()).to.be.true
    })

    it('should check pip as fallback', async () => {
      const mock = createMockExec(new Map([
        ['command -v ipgit', { code: 1, data: '' }],
        ['pip show ipgit', { code: 0, data: 'Name: ipgit\nVersion: 0.1.0' }],
      ]))
      const remote = new IpgitRemote(mock.exec)

      expect(await remote.isInstalled()).to.be.true
    })

    it('should return false when neither binary nor pip package exists', async () => {
      const mock = createMockExec(new Map([
        ['command -v ipgit', { code: 1, data: '' }],
        ['pip show ipgit', { code: 1, data: '' }],
      ]))
      const remote = new IpgitRemote(mock.exec)

      expect(await remote.isInstalled()).to.be.false
    })
  })

  describe('addRemote()', () => {
    it('should add a git remote', async () => {
      const mock = createMockExec()
      const remote = new IpgitRemote(mock.exec)

      await remote.addRemote(tempDir, 'ipfs', 'http://localhost:8787')

      expect(mock.wasCalled('remote add')).to.be.true
      expect(mock.wasCalled('localhost:8787')).to.be.true
    })
  })

  describe('push()', () => {
    it('should push to the ipfs remote', async () => {
      const mock = createMockExec(new Map([
        [/push/, { code: 0, data: 'To ipfs://QmTestCid123\n * [new branch] main -> main' }],
      ]))
      const remote = new IpgitRemote(mock.exec)

      const cid = await remote.push(tempDir, 'ipfs')

      expect(mock.wasCalled('push')).to.be.true
      expect(mock.wasCalled('ipfs')).to.be.true
    })
  })

  describe('pushWardrobe()', () => {
    it('should init git repo if .git does not exist', async () => {
      const mock = createMockExec(new Map<string | RegExp, any>([
        [/remote get-url/, { code: 1, data: '' }],
        [/push/, { code: 0, data: '' }],
      ]))
      const remote = new IpgitRemote(mock.exec)

      await remote.pushWardrobe(tempDir)

      expect(mock.wasCalled('init')).to.be.true
      expect(mock.wasCalled('add -A')).to.be.true
      expect(mock.wasCalled('commit')).to.be.true
    })

    it('should skip init if .git exists', async () => {
      createMockGitDir(tempDir)
      const mock = createMockExec(new Map<string | RegExp, any>([
        [/remote get-url/, { code: 0, data: 'http://localhost:8787' }],
        [/push/, { code: 0, data: '' }],
      ]))
      const remote = new IpgitRemote(mock.exec)

      await remote.pushWardrobe(tempDir)

      const initCalls = mock.getCommands().filter(c => c.includes('init') && !c.includes('lfs'))
      expect(initCalls).to.have.lengthOf(0)
    })
  })
})
