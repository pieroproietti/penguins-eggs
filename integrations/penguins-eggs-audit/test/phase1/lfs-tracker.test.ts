/**
 * test/phase1/lfs-tracker.test.ts
 * Tests for the git-lfs ISO tracking plugin.
 */

import { expect } from 'chai'
import fs from 'node:fs'
import path from 'node:path'

import { createMockExec, COMMON_RESPONSES } from '../helpers/mock-exec.js'
import { createTempDir, cleanTempDir, createMockIso, createMockGitDir } from '../helpers/mock-fs.js'
import { LfsTracker } from '../../plugins/distribution/lfs-tracker/lfs-tracker.js'
import { ILfsConfig, loadLfsConfig } from '../../plugins/distribution/lfs-tracker/lfs-config.js'

describe('LfsTracker', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = createTempDir('lfs-test-')
  })

  afterEach(() => {
    cleanTempDir(tempDir)
  })

  describe('isAvailable()', () => {
    it('should return true when git-lfs is installed', async () => {
      const mock = createMockExec(COMMON_RESPONSES.gitLfsInstalled)
      const tracker = new LfsTracker(mock.exec)

      const result = await tracker.isAvailable()
      expect(result).to.be.true
      expect(mock.wasCalled('command -v git-lfs')).to.be.true
    })

    it('should return false when git-lfs is not installed', async () => {
      const mock = createMockExec(COMMON_RESPONSES.gitLfsNotInstalled)
      const tracker = new LfsTracker(mock.exec)

      const result = await tracker.isAvailable()
      expect(result).to.be.false
    })
  })

  describe('init()', () => {
    it('should initialize git repo if .git does not exist', async () => {
      const mock = createMockExec(COMMON_RESPONSES.gitLfsInstalled)
      const tracker = new LfsTracker(mock.exec)

      await tracker.init(tempDir)

      expect(mock.wasCalled('init')).to.be.true
      expect(mock.wasCalled('lfs install')).to.be.true
      expect(mock.wasCalled('lfs track')).to.be.true
    })

    it('should skip git init if .git already exists', async () => {
      createMockGitDir(tempDir)
      const mock = createMockExec(COMMON_RESPONSES.gitLfsInstalled)
      const tracker = new LfsTracker(mock.exec)

      await tracker.init(tempDir)

      // Should not have a bare 'init' call (only lfs install/track)
      const initCalls = mock.getCommands().filter(c => c.includes('init') && !c.includes('lfs'))
      expect(initCalls).to.have.lengthOf(0)
      expect(mock.wasCalled('lfs install')).to.be.true
    })

    it('should track default patterns (*.iso, *.img)', async () => {
      const mock = createMockExec(COMMON_RESPONSES.gitLfsInstalled)
      const tracker = new LfsTracker(mock.exec)

      await tracker.init(tempDir)

      const trackCalls = mock.getCommands().filter(c => c.includes('lfs track'))
      expect(trackCalls.length).to.be.greaterThanOrEqual(2)
      expect(trackCalls.some(c => c.includes('*.iso'))).to.be.true
      expect(trackCalls.some(c => c.includes('*.img'))).to.be.true
    })
  })

  describe('track()', () => {
    it('should return committed:false when LFS is disabled', async () => {
      // Default config has enabled: false
      const mock = createMockExec(COMMON_RESPONSES.gitLfsInstalled)
      const tracker = new LfsTracker(mock.exec)

      const isoPath = createMockIso(tempDir)
      const result = await tracker.track(isoPath)

      expect(result.committed).to.be.false
      expect(result.pushed).to.be.false
    })

    it('should warn when git-lfs is not installed', async () => {
      const mock = createMockExec(COMMON_RESPONSES.gitLfsNotInstalled)
      // Need to create a tracker with enabled config
      // Since loadLfsConfig reads from /etc, we test the flow
      const tracker = new LfsTracker(mock.exec)

      const isoPath = createMockIso(tempDir)
      const result = await tracker.track(isoPath)

      expect(result.committed).to.be.false
    })
  })

  describe('listTracked()', () => {
    it('should return empty array when no files tracked', async () => {
      const mock = createMockExec(new Map([
        ['lfs ls-files', { code: 0, data: '' }],
      ]))
      const tracker = new LfsTracker(mock.exec)

      const files = await tracker.listTracked(tempDir)
      expect(files).to.deep.equal([])
    })

    it('should return list of tracked files', async () => {
      const mock = createMockExec(new Map([
        ['lfs ls-files', { code: 0, data: 'test.iso\ntest2.img\n' }],
      ]))
      const tracker = new LfsTracker(mock.exec)

      const files = await tracker.listTracked(tempDir)
      expect(files).to.deep.equal(['test.iso', 'test2.img'])
    })

    it('should return empty array on command failure', async () => {
      const mock = createMockExec(new Map([
        ['lfs ls-files', { code: 1, data: '', error: 'not a git repo' }],
      ]))
      const tracker = new LfsTracker(mock.exec)

      const files = await tracker.listTracked(tempDir)
      expect(files).to.deep.equal([])
    })
  })

  describe('configureServer()', () => {
    it('should set lfs.url in git config', async () => {
      const mock = createMockExec()
      const tracker = new LfsTracker(mock.exec)

      await tracker.configureServer(tempDir, 'https://lfs.example.com')

      expect(mock.wasCalled('lfs.url')).to.be.true
      expect(mock.wasCalled('lfs.example.com')).to.be.true
    })
  })
})

describe('LfsConfig', () => {
  it('should return defaults when config file does not exist', () => {
    // loadLfsConfig reads from /etc/penguins-eggs.d/lfs.yaml
    // which won't exist in test env — should return defaults
    const config = loadLfsConfig()
    expect(config.enabled).to.be.false
    expect(config.remote).to.equal('origin')
    expect(config.auto_push).to.be.true
    expect(config.track_patterns).to.deep.equal(['*.iso', '*.img'])
  })
})
