/**
 * test/phase1/dir-downloader.test.ts
 * Tests for the selective wardrobe directory downloader.
 */

import { expect } from 'chai'
import fs from 'node:fs'
import path from 'node:path'

import { createMockExec } from '../helpers/mock-exec.js'
import { createTempDir, cleanTempDir } from '../helpers/mock-fs.js'
import { DirDownloader } from '../../plugins/packaging/dir-downloader/dir-downloader.js'

describe('DirDownloader', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = createTempDir('dir-dl-test-')
  })

  afterEach(() => {
    cleanTempDir(tempDir)
  })

  describe('parseGitHubUrl()', () => {
    it('should parse full GitHub URL with tree path', () => {
      const result = DirDownloader.parseGitHubUrl(
        'https://github.com/pieroproietti/penguins-wardrobe/tree/main/costumes/colibri'
      )

      expect(result).to.not.be.null
      expect(result!.owner).to.equal('pieroproietti')
      expect(result!.repo).to.equal('penguins-wardrobe')
      expect(result!.branch).to.equal('main')
      expect(result!.dirPath).to.equal('costumes/colibri')
    })

    it('should parse URL without tree path', () => {
      const result = DirDownloader.parseGitHubUrl(
        'https://github.com/pieroproietti/penguins-wardrobe'
      )

      expect(result).to.not.be.null
      expect(result!.owner).to.equal('pieroproietti')
      expect(result!.repo).to.equal('penguins-wardrobe')
      expect(result!.branch).to.equal('main')  // default
      expect(result!.dirPath).to.equal('')
    })

    it('should parse URL with non-main branch', () => {
      const result = DirDownloader.parseGitHubUrl(
        'https://github.com/user/repo/tree/devel/path/to/dir'
      )

      expect(result).to.not.be.null
      expect(result!.branch).to.equal('devel')
      expect(result!.dirPath).to.equal('path/to/dir')
    })

    it('should return null for non-GitHub URLs', () => {
      const result = DirDownloader.parseGitHubUrl('https://gitlab.com/user/repo')
      expect(result).to.be.null
    })

    it('should handle nested directory paths', () => {
      const result = DirDownloader.parseGitHubUrl(
        'https://github.com/user/repo/tree/main/a/b/c/d'
      )

      expect(result).to.not.be.null
      expect(result!.dirPath).to.equal('a/b/c/d')
    })
  })

  describe('download()', () => {
    it('should throw on unsupported URL format', async () => {
      const mock = createMockExec()
      const downloader = new DirDownloader(mock.exec)

      try {
        await downloader.download({
          repoUrl: 'ftp://invalid.example.com/repo',
          dirPath: 'some/path',
          destDir: tempDir,
        })
        expect.fail('Should have thrown')
      } catch (err: any) {
        expect(err.message).to.include('Unsupported URL')
      }
    })

    it('should call GitHub API with correct URL', async () => {
      const mock = createMockExec(new Map([
        [/api\.github\.com/, { code: 0, data: '[]' }],
      ]))
      const downloader = new DirDownloader(mock.exec)

      try {
        await downloader.download({
          repoUrl: 'https://github.com/user/repo',
          dirPath: 'costumes/test',
          destDir: tempDir,
        })
      } catch {
        // May throw because API returns empty array — that's fine
      }

      expect(mock.wasCalled('api.github.com/repos/user/repo/contents/costumes/test')).to.be.true
    })

    it('should throw when directory path is empty', async () => {
      const mock = createMockExec()
      const downloader = new DirDownloader(mock.exec)

      try {
        await downloader.download({
          repoUrl: 'https://github.com/user/repo',
          dirPath: '',
          destDir: tempDir,
        })
        expect.fail('Should have thrown')
      } catch (err: any) {
        expect(err.message).to.include('Directory path is required')
      }
    })
  })

  describe('downloadSparse()', () => {
    it('should use git sparse-checkout', async () => {
      const mock = createMockExec(new Map([
        ['git clone', { code: 0, data: '' }],
        ['sparse-checkout', { code: 0, data: '' }],
        ['git checkout', { code: 1, data: '', error: 'no such path' }],  // Will fail at copy
      ]))
      const downloader = new DirDownloader(mock.exec)

      try {
        await downloader.downloadSparse({
          repoUrl: 'https://github.com/user/repo',
          dirPath: 'costumes/test',
          destDir: tempDir,
        })
      } catch {
        // Expected to fail since we're mocking
      }

      expect(mock.wasCalled('git clone --filter=blob:none')).to.be.true
      expect(mock.wasCalled('sparse-checkout set')).to.be.true
    })
  })
})
