/**
 * test/phase3/wardrobe-merge.test.ts
 * Tests for the wardrobe repo merge plugin.
 */

import { expect } from 'chai'
import fs from 'node:fs'
import path from 'node:path'

import { createMockExec } from '../helpers/mock-exec.js'
import { createTempDir, cleanTempDir } from '../helpers/mock-fs.js'
import { WardrobeMerge } from '../../plugins/config-management/wardrobe-merge/wardrobe-merge.js'

describe('WardrobeMerge', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = createTempDir('merge-test-')
  })

  afterEach(() => {
    cleanTempDir(tempDir)
  })

  describe('detectBackend()', () => {
    it('should prefer git-merge-repos when available', async () => {
      const mock = createMockExec(new Map([
        ['command -v git-merge-repos', { code: 0, data: '/usr/bin/git-merge-repos' }],
      ]))
      const merger = new WardrobeMerge(mock.exec)

      const backend = await merger.detectBackend()
      expect(backend).to.equal('git-merge-repos')
    })

    it('should fall back to mergeGitRepos.py', async () => {
      const mock = createMockExec(new Map([
        ['command -v git-merge-repos', { code: 1, data: '' }],
        ['command -v mergeGitRepos.py', { code: 0, data: '/usr/bin/mergeGitRepos.py' }],
      ]))
      const merger = new WardrobeMerge(mock.exec)

      const backend = await merger.detectBackend()
      expect(backend).to.equal('mergeGitRepos')
    })

    it('should fall back to native when no tools available', async () => {
      const mock = createMockExec(new Map([
        ['command -v git-merge-repos', { code: 1, data: '' }],
        ['command -v mergeGitRepos.py', { code: 1, data: '' }],
      ]))
      const merger = new WardrobeMerge(mock.exec)

      const backend = await merger.detectBackend()
      expect(backend).to.equal('native')
    })
  })

  describe('merge()', () => {
    it('should throw when no sources provided', async () => {
      const mock = createMockExec()
      const merger = new WardrobeMerge(mock.exec)

      try {
        await merger.merge([], `${tempDir}/merged`)
        expect.fail('Should have thrown')
      } catch (err: any) {
        expect(err.message).to.include('No source repos')
      }
    })

    it('should throw when destination is not empty', async () => {
      const destDir = `${tempDir}/merged`
      fs.mkdirSync(destDir, { recursive: true })
      fs.writeFileSync(path.join(destDir, 'existing.txt'), 'content')

      const mock = createMockExec()
      const merger = new WardrobeMerge(mock.exec)

      try {
        await merger.merge(
          [{ url: 'https://github.com/user/repo1' }],
          destDir
        )
        expect.fail('Should have thrown')
      } catch (err: any) {
        expect(err.message).to.include('not empty')
      }
    })

    it('should use native merge with git subtree strategy', async () => {
      const destDir = `${tempDir}/merged`
      const mock = createMockExec(new Map([
        ['command -v git-merge-repos', { code: 1, data: '' }],
        ['command -v mergeGitRepos.py', { code: 1, data: '' }],
      ]))
      const merger = new WardrobeMerge(mock.exec)

      await merger.merge(
        [
          { url: 'https://github.com/user/wardrobe1' },
          { url: 'https://github.com/user/wardrobe2' },
        ],
        destDir
      )

      // Should init, add remotes, fetch, merge
      expect(mock.wasCalled('init')).to.be.true
      expect(mock.wasCalled('remote add')).to.be.true
      expect(mock.wasCalled('fetch')).to.be.true
      expect(mock.wasCalled('merge')).to.be.true
      expect(mock.wasCalled('read-tree')).to.be.true

      // Should process both repos
      expect(mock.callCount('remote add')).to.equal(2)
    })

    it('should derive subdirectory name from URL', async () => {
      const destDir = `${tempDir}/merged`
      const mock = createMockExec(new Map([
        ['command -v git-merge-repos', { code: 1, data: '' }],
        ['command -v mergeGitRepos.py', { code: 1, data: '' }],
      ]))
      const merger = new WardrobeMerge(mock.exec)

      await merger.merge(
        [{ url: 'https://github.com/user/my-wardrobe.git' }],
        destDir
      )

      expect(mock.wasCalled('source-my-wardrobe')).to.be.true
    })

    it('should use custom name when provided', async () => {
      const destDir = `${tempDir}/merged`
      const mock = createMockExec(new Map([
        ['command -v git-merge-repos', { code: 1, data: '' }],
        ['command -v mergeGitRepos.py', { code: 1, data: '' }],
      ]))
      const merger = new WardrobeMerge(mock.exec)

      await merger.merge(
        [{ url: 'https://github.com/user/repo', name: 'custom-name' }],
        destDir
      )

      expect(mock.wasCalled('source-custom-name')).to.be.true
    })
  })
})
