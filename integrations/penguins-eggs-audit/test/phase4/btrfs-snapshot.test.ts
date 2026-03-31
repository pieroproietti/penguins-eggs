/**
 * test/phase4/btrfs-snapshot.test.ts
 * Tests for the BTRFS snapshot plugin.
 */

import { expect } from 'chai'
import fs from 'node:fs'
import path from 'node:path'

import { createMockExec, COMMON_RESPONSES } from '../helpers/mock-exec.js'
import { createTempDir, cleanTempDir } from '../helpers/mock-fs.js'
import { BtrfsSnapshot } from '../../plugins/build-infra/btrfs-snapshot/btrfs-snapshot.js'

describe('BtrfsSnapshot', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = createTempDir('btrfs-test-')
  })

  afterEach(() => {
    cleanTempDir(tempDir)
  })

  describe('isBtrfs()', () => {
    it('should return true on BTRFS filesystem', async () => {
      const mock = createMockExec(COMMON_RESPONSES.btrfsRoot)
      const snap = new BtrfsSnapshot(mock.exec)

      expect(await snap.isBtrfs()).to.be.true
    })

    it('should return false on ext4 filesystem', async () => {
      const mock = createMockExec(COMMON_RESPONSES.nonBtrfsRoot)
      const snap = new BtrfsSnapshot(mock.exec)

      expect(await snap.isBtrfs()).to.be.false
    })

    it('should check specific mountpoint', async () => {
      const mock = createMockExec(new Map([
        [/stat -f -c %T "\/home"/, { code: 0, data: 'btrfs' }],
      ]))
      const snap = new BtrfsSnapshot(mock.exec)

      expect(await snap.isBtrfs('/home')).to.be.true
      expect(mock.wasCalled('/home')).to.be.true
    })
  })

  describe('isAvailable()', () => {
    it('should return true when btrfs tools are installed', async () => {
      const mock = createMockExec(new Map([
        ['command -v btrfs', { code: 0, data: '/usr/sbin/btrfs' }],
      ]))
      const snap = new BtrfsSnapshot(mock.exec)

      expect(await snap.isAvailable()).to.be.true
    })
  })

  describe('create()', () => {
    it('should throw on non-BTRFS filesystem', async () => {
      const mock = createMockExec(COMMON_RESPONSES.nonBtrfsRoot)
      const snap = new BtrfsSnapshot(mock.exec, false, `${tempDir}/snapshots`)

      try {
        await snap.create('test')
        expect.fail('Should have thrown')
      } catch (err: any) {
        expect(err.message).to.include('not BTRFS')
      }
    })

    it('should create snapshot directory if it does not exist', async () => {
      const snapshotDir = `${tempDir}/snapshots`
      const mock = createMockExec(COMMON_RESPONSES.btrfsRoot)
      const snap = new BtrfsSnapshot(mock.exec, false, snapshotDir)

      await snap.create('test')

      expect(fs.existsSync(snapshotDir)).to.be.true
    })

    it('should call btrfs subvolume snapshot', async () => {
      const mock = createMockExec(COMMON_RESPONSES.btrfsRoot)
      const snap = new BtrfsSnapshot(mock.exec, false, `${tempDir}/snapshots`)

      await snap.create('test')

      expect(mock.wasCalled('btrfs subvolume snapshot -r')).to.be.true
    })

    it('should save metadata JSON', async () => {
      const snapshotDir = `${tempDir}/snapshots`
      const mock = createMockExec(COMMON_RESPONSES.btrfsRoot)
      const snap = new BtrfsSnapshot(mock.exec, false, snapshotDir)

      const result = await snap.create('test', { stage: 'pre-produce' })

      // Find the metadata file
      const metaFiles = fs.readdirSync(snapshotDir).filter(f => f.endsWith('.meta.json'))
      expect(metaFiles).to.have.lengthOf(1)

      const meta = JSON.parse(fs.readFileSync(path.join(snapshotDir, metaFiles[0]), 'utf8'))
      expect(meta.metadata.stage).to.equal('pre-produce')
      expect(meta.timestamp).to.be.a('string')
    })

    it('should include timestamp in snapshot name', async () => {
      const mock = createMockExec(COMMON_RESPONSES.btrfsRoot)
      const snap = new BtrfsSnapshot(mock.exec, false, `${tempDir}/snapshots`)

      const result = await snap.create('test')

      expect(result.name).to.match(/^test_\d{4}-\d{2}-\d{2}/)
    })
  })

  describe('preProduceSnapshot()', () => {
    it('should create snapshot with pre-produce metadata', async () => {
      const mock = createMockExec(new Map<string | RegExp, any>([
        [/stat -f -c %T/, { code: 0, data: 'btrfs' }],
        ['command -v btrfs', { code: 0, data: '/usr/sbin/btrfs' }],
        ['hostname', { code: 0, data: 'test-host' }],
        [/btrfs subvolume/, { code: 0, data: '' }],
      ]))
      const snap = new BtrfsSnapshot(mock.exec, false, `${tempDir}/snapshots`)

      const result = await snap.preProduceSnapshot()

      expect(result.name).to.include('pre-produce')
      expect(result.metadata?.stage).to.equal('pre-produce')
    })
  })

  describe('postProduceSnapshot()', () => {
    it('should include ISO metadata', async () => {
      const mock = createMockExec(COMMON_RESPONSES.btrfsRoot)
      const snap = new BtrfsSnapshot(mock.exec, false, `${tempDir}/snapshots`)

      const result = await snap.postProduceSnapshot('egg-debian.iso', 1024000)

      expect(result.metadata?.iso).to.equal('egg-debian.iso')
      expect(result.metadata?.iso_size).to.equal('1024000')
    })
  })

  describe('list()', () => {
    it('should return empty array when no snapshots exist', async () => {
      const mock = createMockExec()
      const snap = new BtrfsSnapshot(mock.exec, false, `${tempDir}/nonexistent`)

      const snapshots = await snap.list()
      expect(snapshots).to.deep.equal([])
    })

    it('should return snapshots sorted by timestamp', async () => {
      const snapshotDir = `${tempDir}/snapshots`
      fs.mkdirSync(snapshotDir, { recursive: true })

      // Create mock metadata files
      const meta1 = { name: 'snap1', path: `${snapshotDir}/snap1`, timestamp: '2025-01-01T00:00:00Z' }
      const meta2 = { name: 'snap2', path: `${snapshotDir}/snap2`, timestamp: '2025-01-02T00:00:00Z' }

      fs.mkdirSync(`${snapshotDir}/snap1`)
      fs.mkdirSync(`${snapshotDir}/snap2`)
      fs.writeFileSync(`${snapshotDir}/snap1.meta.json`, JSON.stringify(meta1))
      fs.writeFileSync(`${snapshotDir}/snap2.meta.json`, JSON.stringify(meta2))

      const mock = createMockExec()
      const snap = new BtrfsSnapshot(mock.exec, false, snapshotDir)

      const snapshots = await snap.list()
      expect(snapshots).to.have.lengthOf(2)
      expect(snapshots[0].name).to.equal('snap1')
      expect(snapshots[1].name).to.equal('snap2')
    })
  })

  describe('delete()', () => {
    it('should throw when snapshot does not exist', async () => {
      const mock = createMockExec()
      const snap = new BtrfsSnapshot(mock.exec, false, `${tempDir}/snapshots`)

      try {
        await snap.delete('nonexistent')
        expect.fail('Should have thrown')
      } catch (err: any) {
        expect(err.message).to.include('Snapshot not found')
      }
    })

    it('should call btrfs subvolume delete and remove metadata', async () => {
      const snapshotDir = `${tempDir}/snapshots`
      const snapshotPath = `${snapshotDir}/test-snap`
      fs.mkdirSync(snapshotPath, { recursive: true })
      fs.writeFileSync(`${snapshotPath}.meta.json`, '{}')

      const mock = createMockExec()
      const snap = new BtrfsSnapshot(mock.exec, false, snapshotDir)

      await snap.delete('test-snap')

      expect(mock.wasCalled('btrfs subvolume delete')).to.be.true
      expect(fs.existsSync(`${snapshotPath}.meta.json`)).to.be.false
    })
  })
})
