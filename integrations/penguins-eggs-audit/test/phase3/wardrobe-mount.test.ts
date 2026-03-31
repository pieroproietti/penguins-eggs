/**
 * test/phase3/wardrobe-mount.test.ts
 * Tests for the gitfs-based wardrobe mount plugin.
 */

import { expect } from 'chai'
import fs from 'node:fs'

import { createMockExec, COMMON_RESPONSES } from '../helpers/mock-exec.js'
import { createTempDir, cleanTempDir } from '../helpers/mock-fs.js'
import { WardrobeMount } from '../../plugins/config-management/wardrobe-mount/wardrobe-mount.js'

describe('WardrobeMount', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = createTempDir('mount-test-')
  })

  afterEach(() => {
    cleanTempDir(tempDir)
  })

  describe('isInstalled()', () => {
    it('should return true when gitfs is available', async () => {
      const mock = createMockExec(COMMON_RESPONSES.gitfsInstalled)
      const mounter = new WardrobeMount(mock.exec)

      expect(await mounter.isInstalled()).to.be.true
    })

    it('should return false when gitfs is not available', async () => {
      const mock = createMockExec(new Map([
        ['command -v gitfs', { code: 1, data: '' }],
      ]))
      const mounter = new WardrobeMount(mock.exec)

      expect(await mounter.isInstalled()).to.be.false
    })
  })

  describe('mount()', () => {
    it('should throw when gitfs is not installed', async () => {
      const mock = createMockExec(new Map([
        ['command -v gitfs', { code: 1, data: '' }],
      ]))
      const mounter = new WardrobeMount(mock.exec)

      try {
        await mounter.mount({
          repoUrl: 'https://github.com/user/wardrobe',
          mountpoint: `${tempDir}/mnt`,
        })
        expect.fail('Should have thrown')
      } catch (err: any) {
        expect(err.message).to.include('gitfs not installed')
      }
    })

    it('should create mountpoint directory if it does not exist', async () => {
      const mountpoint = `${tempDir}/mnt/wardrobe`
      const mock = createMockExec(COMMON_RESPONSES.gitfsInstalled)
      const mounter = new WardrobeMount(mock.exec)

      await mounter.mount({
        repoUrl: 'https://github.com/user/wardrobe',
        mountpoint,
      })

      expect(fs.existsSync(mountpoint)).to.be.true
    })

    it('should pass branch option to gitfs', async () => {
      const mock = createMockExec(COMMON_RESPONSES.gitfsInstalled)
      const mounter = new WardrobeMount(mock.exec)

      await mounter.mount({
        repoUrl: 'https://github.com/user/wardrobe',
        mountpoint: `${tempDir}/mnt`,
        branch: 'devel',
      })

      expect(mock.wasCalled('branch=devel')).to.be.true
    })

    it('should pass commit interval option', async () => {
      const mock = createMockExec(COMMON_RESPONSES.gitfsInstalled)
      const mounter = new WardrobeMount(mock.exec)

      await mounter.mount({
        repoUrl: 'https://github.com/user/wardrobe',
        mountpoint: `${tempDir}/mnt`,
        commitInterval: 60,
      })

      expect(mock.wasCalled('commit_merge_timeout=60')).to.be.true
    })

    it('should include allow_other and committer info', async () => {
      const mock = createMockExec(COMMON_RESPONSES.gitfsInstalled)
      const mounter = new WardrobeMount(mock.exec)

      await mounter.mount({
        repoUrl: 'https://github.com/user/wardrobe',
        mountpoint: `${tempDir}/mnt`,
      })

      expect(mock.wasCalled('allow_other')).to.be.true
      expect(mock.wasCalled('commiter_name=penguins-eggs')).to.be.true
    })
  })

  describe('unmount()', () => {
    it('should call fusermount -u', async () => {
      const mock = createMockExec()
      const mounter = new WardrobeMount(mock.exec)

      await mounter.unmount('/mnt/wardrobe')

      expect(mock.wasCalled('fusermount -u')).to.be.true
      expect(mock.wasCalled('/mnt/wardrobe')).to.be.true
    })
  })

  describe('listMounts()', () => {
    it('should return empty array when no mounts', async () => {
      const mock = createMockExec(new Map([
        ['mount | grep gitfs', { code: 1, data: '' }],
      ]))
      const mounter = new WardrobeMount(mock.exec)

      const mounts = await mounter.listMounts()
      expect(mounts).to.deep.equal([])
    })

    it('should return active mounts', async () => {
      const mock = createMockExec(new Map([
        ['mount | grep gitfs', { code: 0, data: 'gitfs on /mnt/wardrobe type fuse\n' }],
      ]))
      const mounter = new WardrobeMount(mock.exec)

      const mounts = await mounter.listMounts()
      expect(mounts).to.have.lengthOf(1)
    })
  })
})
