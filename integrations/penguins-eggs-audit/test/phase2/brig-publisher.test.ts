/**
 * test/phase2/brig-publisher.test.ts
 * Tests for the brig IPFS publisher.
 */

import { expect } from 'chai'
import fs from 'node:fs'

import { createMockExec, COMMON_RESPONSES } from '../helpers/mock-exec.js'
import { createTempDir, cleanTempDir, createMockIso } from '../helpers/mock-fs.js'
import { BrigPublisher } from '../../plugins/decentralized/brig-publish/brig-publisher.js'

describe('BrigPublisher', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = createTempDir('brig-test-')
  })

  afterEach(() => {
    cleanTempDir(tempDir)
  })

  describe('isAvailable()', () => {
    it('should return true when brig daemon is running', async () => {
      const mock = createMockExec(COMMON_RESPONSES.brigAvailable)
      const publisher = new BrigPublisher(mock.exec)

      const result = await publisher.isAvailable()
      expect(result).to.be.true
      expect(mock.wasCalled('brig whoami')).to.be.true
    })

    it('should return false when brig daemon is not running', async () => {
      const mock = createMockExec(new Map([
        ['brig whoami', { code: 1, data: '', error: 'daemon not running' }],
      ]))
      const publisher = new BrigPublisher(mock.exec)

      const result = await publisher.isAvailable()
      expect(result).to.be.false
    })
  })

  describe('isInstalled()', () => {
    it('should return true when brig binary exists', async () => {
      const mock = createMockExec(new Map([
        ['command -v brig', { code: 0, data: '/usr/bin/brig' }],
      ]))
      const publisher = new BrigPublisher(mock.exec)

      const result = await publisher.isInstalled()
      expect(result).to.be.true
    })

    it('should return false when brig is not installed', async () => {
      const mock = createMockExec(COMMON_RESPONSES.brigNotAvailable)
      const publisher = new BrigPublisher(mock.exec)

      const result = await publisher.isInstalled()
      expect(result).to.be.false
    })
  })

  describe('publish()', () => {
    it('should throw when brig daemon is not running', async () => {
      const mock = createMockExec(new Map([
        ['brig whoami', { code: 1, data: '' }],
      ]))
      const publisher = new BrigPublisher(mock.exec)
      const isoPath = createMockIso(tempDir)

      try {
        await publisher.publish(isoPath)
        expect.fail('Should have thrown')
      } catch (err: any) {
        expect(err.message).to.include('brig daemon not running')
      }
    })

    it('should stage, commit, and return result when brig is available', async () => {
      const mock = createMockExec(new Map<string | RegExp, any>([
        ['brig whoami', { code: 0, data: 'eggs@local' }],
        ['brig stage', { code: 0, data: '' }],
        ['brig commit', { code: 0, data: '' }],
        [/brig cat/, { code: 0, data: '{"content_hash": "QmTestHash123"}' }],
      ]))
      const publisher = new BrigPublisher(mock.exec)
      const isoPath = createMockIso(tempDir)

      const result = await publisher.publish(isoPath)

      expect(result.cid).to.equal('QmTestHash123')
      expect(result.size).to.be.greaterThan(0)
      expect(mock.wasCalled('brig stage')).to.be.true
      expect(mock.wasCalled('brig commit')).to.be.true
    })
  })

  describe('list()', () => {
    it('should return empty array when no ISOs published', async () => {
      const mock = createMockExec(new Map([
        ['brig ls', { code: 1, data: '' }],
      ]))
      const publisher = new BrigPublisher(mock.exec)

      const files = await publisher.list()
      expect(files).to.deep.equal([])
    })

    it('should return list of published ISOs', async () => {
      const mock = createMockExec(new Map([
        ['brig ls', { code: 0, data: 'egg-debian.iso\negg-ubuntu.iso\n' }],
      ]))
      const publisher = new BrigPublisher(mock.exec)

      const files = await publisher.list()
      expect(files).to.have.lengthOf(2)
      expect(files).to.include('egg-debian.iso')
    })
  })

  describe('history()', () => {
    it('should return version history for a path', async () => {
      const mock = createMockExec(new Map([
        ['brig history', { code: 0, data: 'v1: 2025-01-01\nv2: 2025-01-02\n' }],
      ]))
      const publisher = new BrigPublisher(mock.exec)

      const history = await publisher.history('/isos/test.iso')
      expect(history).to.have.lengthOf(2)
    })
  })
})
