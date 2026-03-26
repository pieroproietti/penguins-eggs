/**
 * test/phase3/wardrobe-browse.test.ts
 * Tests for the read-only wardrobe revision browser.
 */

import { expect } from 'chai'
import fs from 'node:fs'
import path from 'node:path'

import { createMockExec } from '../helpers/mock-exec.js'
import { createTempDir, cleanTempDir } from '../helpers/mock-fs.js'
import { WardrobeBrowse } from '../../plugins/config-management/wardrobe-browse/wardrobe-browse.js'

describe('WardrobeBrowse', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = createTempDir('browse-test-')
  })

  afterEach(() => {
    cleanTempDir(tempDir)
  })

  describe('detectBackend()', () => {
    it('should return dsxack when gitfs-browse is on PATH', async () => {
      const mock = createMockExec(new Map([
        ['command -v gitfs-browse', { code: 0, data: '/usr/local/bin/gitfs-browse' }],
      ]))
      const browse = new WardrobeBrowse(mock.exec)

      expect(await browse.detectBackend()).to.equal('dsxack')
    })

    it('should return jmillikin when gitfs-rust is on PATH and dsxack is absent', async () => {
      const mock = createMockExec(new Map([
        ['command -v gitfs-browse', { code: 1, data: '' }],
        ['command -v gitfs-rust', { code: 0, data: '/usr/local/bin/gitfs-rust' }],
      ]))
      const browse = new WardrobeBrowse(mock.exec)

      expect(await browse.detectBackend()).to.equal('jmillikin')
    })

    it('should return jgitfs when only jgitfs is available', async () => {
      const mock = createMockExec(new Map([
        ['command -v gitfs-browse', { code: 1, data: '' }],
        ['command -v gitfs-rust', { code: 1, data: '' }],
        ['command -v jgitfs', { code: 0, data: '/usr/local/bin/jgitfs' }],
      ]))
      const browse = new WardrobeBrowse(mock.exec)

      expect(await browse.detectBackend()).to.equal('jgitfs')
    })

    it('should return null when no backend is available', async () => {
      const mock = createMockExec(new Map([
        ['command -v gitfs-browse', { code: 1, data: '' }],
        ['command -v gitfs-rust', { code: 1, data: '' }],
        ['command -v jgitfs', { code: 1, data: '' }],
      ]))
      const browse = new WardrobeBrowse(mock.exec)

      expect(await browse.detectBackend()).to.be.null
    })

    it('should prefer dsxack over jmillikin when both are available', async () => {
      const mock = createMockExec(new Map([
        ['command -v gitfs-browse', { code: 0, data: '/usr/local/bin/gitfs-browse' }],
        ['command -v gitfs-rust', { code: 0, data: '/usr/local/bin/gitfs-rust' }],
      ]))
      const browse = new WardrobeBrowse(mock.exec)

      expect(await browse.detectBackend()).to.equal('dsxack')
    })
  })

  describe('mount()', () => {
    it('should throw when no backend is available and backend is auto', async () => {
      const mock = createMockExec(new Map([
        ['command -v gitfs-browse', { code: 1, data: '' }],
        ['command -v gitfs-rust', { code: 1, data: '' }],
        ['command -v jgitfs', { code: 1, data: '' }],
      ]))
      const browse = new WardrobeBrowse(mock.exec)
      const mountpoint = path.join(tempDir, 'mnt')

      try {
        await browse.mount('/some/repo', mountpoint)
        expect.fail('Should have thrown')
      } catch (err: any) {
        expect(err.message).to.include('No gitfs browse backend found')
      }
    })

    it('should create mountpoint directory if it does not exist', async () => {
      const mountpoint = path.join(tempDir, 'mnt', 'nested')
      const mock = createMockExec(new Map([
        ['command -v gitfs-browse', { code: 0, data: '/usr/local/bin/gitfs-browse' }],
      ]))
      const browse = new WardrobeBrowse(mock.exec)

      await browse.mount('/some/repo', mountpoint, 'dsxack')

      expect(fs.existsSync(mountpoint)).to.be.true
    })

    it('should use dsxack backend when explicitly specified', async () => {
      const mountpoint = path.join(tempDir, 'mnt')
      const mock = createMockExec()
      const browse = new WardrobeBrowse(mock.exec)

      await browse.mount('/some/repo', mountpoint, 'dsxack')

      expect(mock.wasCalled('gitfs-browse mount')).to.be.true
    })

    it('should use jmillikin backend when explicitly specified', async () => {
      const mountpoint = path.join(tempDir, 'mnt')
      const mock = createMockExec()
      const browse = new WardrobeBrowse(mock.exec)

      await browse.mount('/some/repo', mountpoint, 'jmillikin')

      expect(mock.wasCalled('gitfs-rust')).to.be.true
    })

    it('should use jgitfs backend when explicitly specified', async () => {
      const mountpoint = path.join(tempDir, 'mnt')
      const mock = createMockExec()
      const browse = new WardrobeBrowse(mock.exec)

      await browse.mount('/some/repo', mountpoint, 'jgitfs')

      expect(mock.wasCalled('jgitfs')).to.be.true
    })

    it('should clone remote URL before mounting', async () => {
      const mountpoint = path.join(tempDir, 'mnt')
      const mock = createMockExec()
      const browse = new WardrobeBrowse(mock.exec)

      await browse.mount('https://github.com/user/wardrobe', mountpoint, 'dsxack')

      expect(mock.wasCalled('git clone --bare')).to.be.true
      expect(mock.wasCalled('https://github.com/user/wardrobe')).to.be.true
    })

    it('should not clone when given a local path', async () => {
      const mountpoint = path.join(tempDir, 'mnt')
      const mock = createMockExec()
      const browse = new WardrobeBrowse(mock.exec)

      await browse.mount('/local/repo', mountpoint, 'dsxack')

      expect(mock.wasCalled('git clone')).to.be.false
    })

    it('should pass the repo path to the backend mount command', async () => {
      const mountpoint = path.join(tempDir, 'mnt')
      const repoPath = '/local/wardrobe.git'
      const mock = createMockExec()
      const browse = new WardrobeBrowse(mock.exec)

      await browse.mount(repoPath, mountpoint, 'dsxack')

      expect(mock.wasCalled(repoPath)).to.be.true
      expect(mock.wasCalled(mountpoint)).to.be.true
    })
  })

  describe('unmount()', () => {
    it('should call fusermount -u on the mountpoint', async () => {
      const mountpoint = path.join(tempDir, 'mnt')
      const mock = createMockExec()
      const browse = new WardrobeBrowse(mock.exec)

      await browse.unmount(mountpoint)

      expect(mock.wasCalled('fusermount -u')).to.be.true
      expect(mock.wasCalled(mountpoint)).to.be.true
    })
  })
})
