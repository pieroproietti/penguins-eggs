/**
 * test/phase3/wardrobe-read.test.ts
 * Tests for the programmatic wardrobe read API.
 */

import { expect } from 'chai'

import { createMockExec } from '../helpers/mock-exec.js'
import { createTempDir, cleanTempDir } from '../helpers/mock-fs.js'
import { WardrobeRead } from '../../plugins/config-management/wardrobe-read/wardrobe-read.js'

describe('WardrobeRead', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = createTempDir('read-test-')
  })

  afterEach(() => {
    cleanTempDir(tempDir)
  })

  describe('listCostumes()', () => {
    it('should return costume names from GitHub API', async () => {
      const apiResponse = JSON.stringify([
        { name: 'colibri', type: 'dir' },
        { name: 'eagle', type: 'dir' },
        { name: 'README.md', type: 'file' },
      ])

      const mock = createMockExec(new Map([
        [/api\.github\.com/, { code: 0, data: apiResponse }],
      ]))
      const reader = new WardrobeRead(mock.exec)

      const costumes = await reader.listCostumes('https://github.com/pieroproietti/penguins-wardrobe')

      expect(costumes).to.have.lengthOf(2)
      expect(costumes).to.include('colibri')
      expect(costumes).to.include('eagle')
      expect(costumes).to.not.include('README.md')
    })

    it('should return empty array on API failure', async () => {
      const mock = createMockExec(new Map([
        [/api\.github\.com/, { code: 1, data: '', error: 'rate limited' }],
      ]))
      const reader = new WardrobeRead(mock.exec)

      const costumes = await reader.listCostumes('https://github.com/user/repo')
      expect(costumes).to.deep.equal([])
    })

    it('should use correct branch in API URL', async () => {
      const mock = createMockExec(new Map([
        [/api\.github\.com/, { code: 0, data: '[]' }],
      ]))
      const reader = new WardrobeRead(mock.exec)

      await reader.listCostumes('https://github.com/user/repo', 'devel')

      expect(mock.wasCalled('ref=devel')).to.be.true
    })
  })

  describe('readCostume()', () => {
    it('should return costume info with files', async () => {
      const dirResponse = JSON.stringify([
        { name: 'index.yml', path: 'costumes/test/index.yml', type: 'file', size: 100 },
        { name: 'config.sh', path: 'costumes/test/config.sh', type: 'file', size: 50 },
      ])

      const indexContent = 'name: test\ndescription: A test costume\npackages:\n  - git\n  - curl\n'

      const mock = createMockExec(new Map<string | RegExp, any>([
        [/api\.github\.com.*contents\/costumes\/test/, { code: 0, data: dirResponse }],
        [/raw\.githubusercontent\.com.*index\.yml/, { code: 0, data: indexContent }],
      ]))
      const reader = new WardrobeRead(mock.exec)

      const costume = await reader.readCostume('https://github.com/user/wardrobe', 'test')

      expect(costume.name).to.equal('test')
      expect(costume.description).to.equal('A test costume')
      expect(costume.packages).to.deep.equal(['git', 'curl'])
      expect(costume.files).to.have.lengthOf(2)
    })

    it('should handle costume without index.yml', async () => {
      const dirResponse = JSON.stringify([
        { name: 'config.sh', path: 'costumes/test/config.sh', type: 'file', size: 50 },
      ])

      const mock = createMockExec(new Map([
        [/api\.github\.com/, { code: 0, data: dirResponse }],
      ]))
      const reader = new WardrobeRead(mock.exec)

      const costume = await reader.readCostume('https://github.com/user/wardrobe', 'test')

      expect(costume.name).to.equal('test')
      expect(costume.description).to.be.undefined
      expect(costume.packages).to.be.undefined
    })
  })

  describe('listDir()', () => {
    it('should return directory entries', async () => {
      const response = JSON.stringify([
        { name: 'file1.txt', path: 'dir/file1.txt', type: 'file', size: 10, sha: 'abc' },
        { name: 'subdir', path: 'dir/subdir', type: 'dir', sha: 'def' },
      ])

      const mock = createMockExec(new Map([
        [/api\.github\.com/, { code: 0, data: response }],
      ]))
      const reader = new WardrobeRead(mock.exec)

      const entries = await reader.listDir('user', 'repo', 'dir')

      expect(entries).to.have.lengthOf(2)
      expect(entries[0].type).to.equal('file')
      expect(entries[1].type).to.equal('dir')
    })
  })

  describe('diffCostumes()', () => {
    it('should return changes between two refs', async () => {
      const response = JSON.stringify({
        files: [
          { filename: 'costumes/test/index.yml', status: 'modified' },
          { filename: 'costumes/test/new-file.sh', status: 'added' },
          { filename: 'costumes/other/file.txt', status: 'modified' },
        ],
      })

      const mock = createMockExec(new Map([
        [/api\.github\.com.*compare/, { code: 0, data: response }],
      ]))
      const reader = new WardrobeRead(mock.exec)

      const diff = await reader.diffCostumes('https://github.com/user/repo', 'test', 'v1.0', 'v2.0')

      expect(diff).to.include('modified: costumes/test/index.yml')
      expect(diff).to.include('added: costumes/test/new-file.sh')
      expect(diff).to.not.include('costumes/other')  // Filtered to 'test' costume
    })
  })
})
