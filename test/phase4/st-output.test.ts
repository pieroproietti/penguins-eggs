/**
 * test/phase4/st-output.test.ts
 * Tests for the System Transparency output plugin.
 */

import { expect } from 'chai'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

import { createMockExec } from '../helpers/mock-exec.js'
import { createTempDir, cleanTempDir, createFile } from '../helpers/mock-fs.js'
import { StOutput } from '../../plugins/build-infra/st-output/st-output.js'

describe('StOutput', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = createTempDir('st-test-')
  })

  afterEach(() => {
    cleanTempDir(tempDir)
  })

  describe('isAvailable()', () => {
    it('should return true when stmgr is installed', async () => {
      const mock = createMockExec(new Map([
        ['command -v stmgr', { code: 0, data: '/usr/bin/stmgr' }],
      ]))
      const st = new StOutput(mock.exec)

      expect(await st.isAvailable()).to.be.true
    })

    it('should return false when stmgr is not installed', async () => {
      const mock = createMockExec(new Map([
        ['command -v stmgr', { code: 1, data: '' }],
      ]))
      const st = new StOutput(mock.exec)

      expect(await st.isAvailable()).to.be.false
    })
  })

  describe('hashFile()', () => {
    it('should compute correct SHA-256 hash', () => {
      const filePath = createFile(tempDir, 'test.bin', 'hello world')
      const mock = createMockExec()
      const st = new StOutput(mock.exec)

      const hash = st.hashFile(filePath)

      // Known SHA-256 of "hello world"
      const expected = crypto.createHash('sha256').update('hello world').digest('hex')
      expect(hash).to.equal(expected)
    })

    it('should produce different hashes for different content', () => {
      const file1 = createFile(tempDir, 'a.bin', 'content A')
      const file2 = createFile(tempDir, 'b.bin', 'content B')
      const mock = createMockExec()
      const st = new StOutput(mock.exec)

      expect(st.hashFile(file1)).to.not.equal(st.hashFile(file2))
    })
  })

  describe('generateDescriptor()', () => {
    it('should generate valid descriptor with all fields', () => {
      const kernel = createFile(tempDir, 'vmlinuz', 'kernel-data')
      const initramfs = createFile(tempDir, 'initramfs', 'initrd-data')
      const rootfs = createFile(tempDir, 'rootfs.squashfs', 'rootfs-data')

      const mock = createMockExec()
      const st = new StOutput(mock.exec)

      const descriptor = st.generateDescriptor('test-distro', kernel, initramfs, rootfs)

      expect(descriptor.version).to.equal(1)
      expect(descriptor.label).to.equal('test-distro')
      expect(descriptor.kernel).to.equal('vmlinuz')
      expect(descriptor.initramfs).to.equal('initramfs')
      expect(descriptor.root).to.equal('rootfs.squashfs')
      expect(descriptor.kernel_hash).to.be.a('string').with.lengthOf(64)
      expect(descriptor.initramfs_hash).to.be.a('string').with.lengthOf(64)
      expect(descriptor.root_hash).to.be.a('string').with.lengthOf(64)
      expect(descriptor.cmdline).to.equal('console=ttyS0')
      expect(descriptor.timestamp).to.be.a('string')
    })

    it('should use custom cmdline when provided', () => {
      const kernel = createFile(tempDir, 'vmlinuz', 'k')
      const initramfs = createFile(tempDir, 'initramfs', 'i')
      const rootfs = createFile(tempDir, 'rootfs', 'r')

      const mock = createMockExec()
      const st = new StOutput(mock.exec)

      const descriptor = st.generateDescriptor(
        'test', kernel, initramfs, rootfs, 'root=/dev/sda1 quiet'
      )

      expect(descriptor.cmdline).to.equal('root=/dev/sda1 quiet')
    })

    it('should produce consistent hashes for same content', () => {
      const kernel = createFile(tempDir, 'vmlinuz', 'same-content')
      const initramfs = createFile(tempDir, 'initramfs', 'same-content')
      const rootfs = createFile(tempDir, 'rootfs', 'same-content')

      const mock = createMockExec()
      const st = new StOutput(mock.exec)

      const d1 = st.generateDescriptor('test', kernel, initramfs, rootfs)
      const d2 = st.generateDescriptor('test', kernel, initramfs, rootfs)

      expect(d1.kernel_hash).to.equal(d2.kernel_hash)
    })
  })

  describe('generateKey()', () => {
    it('should call openssl to generate Ed25519 key pair', async () => {
      const mock = createMockExec()
      const st = new StOutput(mock.exec)

      const keys = await st.generateKey(tempDir)

      expect(keys.privateKey).to.include('signing-key.pem')
      expect(keys.publicKey).to.include('signing-key.pub')
      expect(mock.wasCalled('openssl genpkey -algorithm Ed25519')).to.be.true
      expect(mock.wasCalled('openssl pkey')).to.be.true
    })
  })

  describe('sign()', () => {
    it('should use stmgr when available', async () => {
      const descriptorPath = createFile(tempDir, 'descriptor.json', '{}')
      const keyPath = createFile(tempDir, 'key.pem', 'key')

      const mock = createMockExec(new Map([
        ['command -v stmgr', { code: 0, data: '/usr/bin/stmgr' }],
      ]))
      const st = new StOutput(mock.exec)

      await st.sign(descriptorPath, keyPath)

      expect(mock.wasCalled('stmgr sign')).to.be.true
    })

    it('should fall back to openssl when stmgr is not available', async () => {
      const descriptorPath = createFile(tempDir, 'descriptor.json', '{}')
      const keyPath = createFile(tempDir, 'key.pem', 'key')

      const mock = createMockExec(new Map([
        ['command -v stmgr', { code: 1, data: '' }],
      ]))
      const st = new StOutput(mock.exec)

      await st.sign(descriptorPath, keyPath)

      expect(mock.wasCalled('openssl pkeyutl -sign')).to.be.true
    })
  })
})
