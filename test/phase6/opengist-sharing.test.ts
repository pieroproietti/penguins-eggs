/**
 * test/phase6/opengist-sharing.test.ts
 * Tests for the Opengist wardrobe sharing plugin.
 */

import { expect } from 'chai'
import fs from 'node:fs'
import path from 'node:path'

import { createMockExec } from '../helpers/mock-exec.js'
import { createTempDir, cleanTempDir, createMockWardrobe } from '../helpers/mock-fs.js'
import { OpengistSharing } from '../../plugins/distribution/opengist-sharing/opengist-sharing.js'

describe('OpengistSharing', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = createTempDir('gist-test-')
  })

  afterEach(() => {
    cleanTempDir(tempDir)
  })

  describe('share()', () => {
    it('should throw when costume directory does not exist', async () => {
      const mock = createMockExec()
      const sharing = new OpengistSharing(
        mock.exec,
        { serverUrl: 'https://gist.example.com' }
      )

      try {
        await sharing.share('/nonexistent/path')
        expect.fail('Should have thrown')
      } catch (err: any) {
        expect(err.message).to.include('not found')
      }
    })

    it('should throw when costume directory is empty', async () => {
      const emptyDir = path.join(tempDir, 'empty')
      fs.mkdirSync(emptyDir)

      const mock = createMockExec()
      const sharing = new OpengistSharing(
        mock.exec,
        { serverUrl: 'https://gist.example.com' }
      )

      try {
        await sharing.share(emptyDir)
        expect.fail('Should have thrown')
      } catch (err: any) {
        expect(err.message).to.include('No files found')
      }
    })

    it('should POST to opengist API with costume files', async () => {
      const wardrobe = createMockWardrobe(tempDir)
      const costumeDir = path.join(wardrobe, 'costumes', 'colibri')

      const mock = createMockExec(new Map([
        [/api\/v1\/gists/, { code: 0, data: '{"id": "abc123", "html_url": "https://gist.example.com/abc123"}' }],
      ]))
      const sharing = new OpengistSharing(
        mock.exec,
        { serverUrl: 'https://gist.example.com' }
      )

      const result = await sharing.share(costumeDir)

      expect(result.url).to.include('abc123')
      expect(result.files.length).to.be.greaterThan(0)
      expect(mock.wasCalled('api/v1/gists')).to.be.true
    })

    it('should use custom title when provided', async () => {
      const wardrobe = createMockWardrobe(tempDir)
      const costumeDir = path.join(wardrobe, 'costumes', 'colibri')

      const mock = createMockExec(new Map([
        [/api\/v1\/gists/, { code: 0, data: '{"id": "abc"}' }],
      ]))
      const sharing = new OpengistSharing(
        mock.exec,
        { serverUrl: 'https://gist.example.com' }
      )

      const result = await sharing.share(costumeDir, 'My Custom Costume')

      expect(result.title).to.equal('My Custom Costume')
    })

    it('should include auth header when token is provided', async () => {
      const wardrobe = createMockWardrobe(tempDir)
      const costumeDir = path.join(wardrobe, 'costumes', 'colibri')

      const mock = createMockExec(new Map([
        [/api\/v1\/gists/, { code: 0, data: '{"id": "abc"}' }],
      ]))
      const sharing = new OpengistSharing(
        mock.exec,
        { serverUrl: 'https://gist.example.com', token: 'my-secret-token' }
      )

      await sharing.share(costumeDir)

      expect(mock.wasCalled('Authorization: Bearer my-secret-token')).to.be.true
    })
  })

  describe('import()', () => {
    it('should clone gist and restructure files', async () => {
      const destDir = path.join(tempDir, 'imported')
      const mock = createMockExec(new Map<string | RegExp, any>([
        ['git clone', (cmd: string) => {
          // Simulate git clone by creating files in the tmp dir
          const match = cmd.match(/"([^"]+)"\s+"([^"]+)"/)
          if (match) {
            const cloneDir = match[2]
            fs.mkdirSync(cloneDir, { recursive: true })
            fs.writeFileSync(path.join(cloneDir, 'index_yml'), 'name: test\n')
            fs.writeFileSync(path.join(cloneDir, 'config_sh'), '#!/bin/bash\n')
            fs.writeFileSync(path.join(cloneDir, '.git'), '')  // hidden, should be skipped
          }
          return { code: 0, data: '' }
        }],
      ]))
      const sharing = new OpengistSharing(
        mock.exec,
        { serverUrl: 'https://gist.example.com' }
      )

      await sharing.import('https://gist.example.com/abc123', destDir)

      expect(mock.wasCalled('git clone')).to.be.true
      expect(fs.existsSync(destDir)).to.be.true
    })
  })

  describe('list()', () => {
    it('should return gists from API', async () => {
      const response = JSON.stringify([
        { id: '1', title: 'Costume A', html_url: 'https://gist.example.com/1' },
        { id: '2', title: 'Costume B', html_url: 'https://gist.example.com/2' },
      ])

      const mock = createMockExec(new Map([
        [/api\/v1\/gists\?/, { code: 0, data: response }],
      ]))
      const sharing = new OpengistSharing(
        mock.exec,
        { serverUrl: 'https://gist.example.com' }
      )

      const gists = await sharing.list()

      expect(gists).to.have.lengthOf(2)
      expect(gists[0].title).to.equal('Costume A')
      expect(gists[1].id).to.equal('2')
    })

    it('should return empty array on API failure', async () => {
      const mock = createMockExec(new Map([
        [/api\/v1\/gists/, { code: 1, data: '' }],
      ]))
      const sharing = new OpengistSharing(
        mock.exec,
        { serverUrl: 'https://gist.example.com' }
      )

      const gists = await sharing.list()
      expect(gists).to.deep.equal([])
    })
  })

  describe('search()', () => {
    it('should URL-encode search query', async () => {
      const mock = createMockExec(new Map([
        [/api\/v1\/gists\/search/, { code: 0, data: '[]' }],
      ]))
      const sharing = new OpengistSharing(
        mock.exec,
        { serverUrl: 'https://gist.example.com' }
      )

      await sharing.search('eggs costume colibri')

      expect(mock.wasCalled('eggs%20costume%20colibri')).to.be.true
    })
  })
})

describe('Gogs Registry', () => {
  const COMPOSE_PATH = path.resolve('plugins/distribution/gogs-registry/docker-compose.yml')
  const GIFTLESS_PATH = path.resolve('plugins/distribution/gogs-registry/giftless.yaml')

  it('should have docker-compose.yml', () => {
    expect(fs.existsSync(COMPOSE_PATH)).to.be.true
  })

  it('should define gogs, postgres, and giftless services', () => {
    const content = fs.readFileSync(COMPOSE_PATH, 'utf8')
    expect(content).to.include('gogs:')
    expect(content).to.include('postgres:')
    expect(content).to.include('giftless:')
  })

  it('should expose correct ports', () => {
    const content = fs.readFileSync(COMPOSE_PATH, 'utf8')
    expect(content).to.include('3000:3000')  // Gogs web
    expect(content).to.include('5000:5000')  // Giftless LFS
    expect(content).to.include('2222:22')    // Gogs SSH
  })

  it('should have giftless config with local storage', () => {
    const content = fs.readFileSync(GIFTLESS_PATH, 'utf8')
    expect(content).to.include('LocalStorage')
    expect(content).to.include('/lfs-storage')
  })

  it('should have commented S3 and GCS alternatives', () => {
    const content = fs.readFileSync(GIFTLESS_PATH, 'utf8')
    expect(content).to.include('AmazonS3Storage')
    expect(content).to.include('GoogleCloudStorage')
  })
})
