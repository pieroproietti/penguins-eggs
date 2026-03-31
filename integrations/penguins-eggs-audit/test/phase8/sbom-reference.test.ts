/**
 * test/phase8/sbom-reference.test.ts
 * Tests for the CISA SBOM reference augmentation/enrichment plugin.
 */

import { expect } from 'chai'
import fs from 'node:fs'
import path from 'node:path'

import { createMockExec } from '../helpers/mock-exec.js'
import { createTempDir, cleanTempDir, createFile } from '../helpers/mock-fs.js'
import { SbomReference } from '../../plugins/sbom/sbom-reference/sbom-reference.js'

const MINIMAL_SPDX = JSON.stringify({
  spdxVersion: 'SPDX-2.3',
  dataLicense: 'CC0-1.0',
  SPDXID: 'SPDXRef-DOCUMENT',
  packages: [
    { SPDXID: 'SPDXRef-pkg-bash', name: 'bash', versionInfo: '5.1' },
  ],
})

describe('SbomReference', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = createTempDir('sbom-ref-test-')
  })

  afterEach(() => {
    cleanTempDir(tempDir)
  })

  describe('enrichmentAvailable()', () => {
    it('should return true when sbom_enrichment Python module is importable', async () => {
      const mock = createMockExec(new Map([
        [/python3.*sbom_enrichment/, { code: 0, data: '' }],
      ]))
      const ref = new SbomReference(mock.exec)

      expect(await ref.enrichmentAvailable()).to.be.true
    })

    it('should return false when sbom_enrichment is not installed', async () => {
      const mock = createMockExec(new Map([
        [/python3.*sbom_enrichment/, { code: 1, data: '', error: 'No module named sbom_enrichment' }],
      ]))
      const ref = new SbomReference(mock.exec)

      expect(await ref.enrichmentAvailable()).to.be.false
    })
  })

  describe('augment()', () => {
    it('should throw when SBOM file does not exist', () => {
      const mock = createMockExec()
      const ref = new SbomReference(mock.exec)

      expect(() =>
        ref.augment('/nonexistent/sbom.json', {
          supplier: 'Test Org',
          version: '1.0.0',
          description: 'Test',
        })
      ).to.throw('SBOM not found')
    })

    it('should write an augmented SBOM file', () => {
      const sbomPath = createFile(tempDir, 'test.sbom.json', MINIMAL_SPDX)
      const mock = createMockExec()
      const ref = new SbomReference(mock.exec)

      const result = ref.augment(sbomPath, {
        supplier: 'My Org',
        version: '2.0.0',
        description: 'My Linux distro',
      })

      expect(fs.existsSync(result.outputPath)).to.be.true
      expect(result.outputPath).to.include('.augmented.json')
    })

    it('should populate creationInfo with supplier and description', () => {
      const sbomPath = createFile(tempDir, 'test.sbom.json', MINIMAL_SPDX)
      const mock = createMockExec()
      const ref = new SbomReference(mock.exec)

      const result = ref.augment(sbomPath, {
        supplier: 'Acme Corp',
        version: '1.0.0',
        description: 'Acme Linux',
      })

      const augmented = JSON.parse(fs.readFileSync(result.outputPath, 'utf8'))
      expect(augmented.creationInfo.creators).to.include('Organization: Acme Corp')
      expect(augmented.creationInfo.comment).to.equal('Acme Linux')
    })

    it('should set documentNamespace when not already present', () => {
      const sbomPath = createFile(tempDir, 'test.sbom.json', MINIMAL_SPDX)
      const mock = createMockExec()
      const ref = new SbomReference(mock.exec)

      const result = ref.augment(sbomPath, {
        supplier: 'Test',
        version: '1.0',
        description: 'Test',
      })

      const augmented = JSON.parse(fs.readFileSync(result.outputPath, 'utf8'))
      expect(augmented.documentNamespace).to.be.a('string')
      expect(augmented.documentNamespace).to.include('penguins-eggs.net')
    })

    it('should preserve existing documentNamespace', () => {
      const sbomWithNs = JSON.parse(MINIMAL_SPDX)
      sbomWithNs.documentNamespace = 'https://existing.example.com/sbom/123'
      const sbomPath = createFile(
        tempDir, 'test.sbom.json', JSON.stringify(sbomWithNs)
      )
      const mock = createMockExec()
      const ref = new SbomReference(mock.exec)

      const result = ref.augment(sbomPath, {
        supplier: 'Test',
        version: '1.0',
        description: 'Test',
      })

      const augmented = JSON.parse(fs.readFileSync(result.outputPath, 'utf8'))
      expect(augmented.documentNamespace).to.equal('https://existing.example.com/sbom/123')
    })

    it('should set dataLicense when license is provided in metadata', () => {
      const sbomPath = createFile(tempDir, 'test.sbom.json', MINIMAL_SPDX)
      const mock = createMockExec()
      const ref = new SbomReference(mock.exec)

      const result = ref.augment(sbomPath, {
        supplier: 'Test',
        version: '1.0',
        description: 'Test',
        license: 'MIT',
      })

      const augmented = JSON.parse(fs.readFileSync(result.outputPath, 'utf8'))
      expect(augmented.dataLicense).to.equal('MIT')
    })
  })

  describe('enrich()', () => {
    it('should throw when SBOM file does not exist', async () => {
      const mock = createMockExec()
      const ref = new SbomReference(mock.exec)

      try {
        await ref.enrich('/nonexistent/sbom.augmented.json')
        expect.fail('Should have thrown')
      } catch (err: any) {
        expect(err.message).to.include('SBOM not found')
      }
    })

    it('should call python3 sbom_enrichment when available', async () => {
      const sbomPath = createFile(tempDir, 'test.sbom.augmented.json', MINIMAL_SPDX)
      const mock = createMockExec(new Map([
        [/python3.*sbom_enrichment.*--input/, { code: 0, data: '' }],
        [/python3 -c.*sbom_enrichment/, { code: 0, data: '' }],
      ]))
      const ref = new SbomReference(mock.exec)

      const result = await ref.enrich(sbomPath)

      expect(result.enriched).to.be.true
      expect(result.outputPath).to.include('.enriched.json')
      expect(mock.wasCalled('sbom_enrichment')).to.be.true
    })

    it('should fall back gracefully when enrichment tooling is not available', async () => {
      const sbomPath = createFile(tempDir, 'test.sbom.augmented.json', MINIMAL_SPDX)
      const mock = createMockExec(new Map([
        [/python3 -c.*sbom_enrichment/, { code: 1, data: '' }],
      ]))
      const ref = new SbomReference(mock.exec)

      const result = await ref.enrich(sbomPath)

      expect(result.enriched).to.be.false
      expect(result.warning).to.include('sbom_enrichment not available')
      expect(fs.existsSync(result.outputPath)).to.be.true
    })
  })
})
