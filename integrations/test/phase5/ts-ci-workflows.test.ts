/**
 * test/phase5/ts-ci-workflows.test.ts
 * Tests for the TypeScript-defined CI workflow generator.
 */

import { expect } from 'chai'
import fs from 'node:fs'
import path from 'node:path'

import { createTempDir, cleanTempDir } from '../helpers/mock-fs.js'
import {
  generateWorkflows,
  ciWorkflow,
  releaseWorkflow,
  isoTestWorkflow,
} from '../../plugins/dev-workflow/ts-ci/workflows.js'

describe('TypeScript CI Workflows', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = createTempDir('ci-test-')
  })

  afterEach(() => {
    cleanTempDir(tempDir)
  })

  describe('ciWorkflow', () => {
    it('should have correct name', () => {
      expect(ciWorkflow.name).to.equal('CI')
    })

    it('should trigger on push to master and pull requests', () => {
      expect(ciWorkflow.on.push.branches).to.include('master')
      expect(ciWorkflow.on.pull_request.branches).to.include('master')
    })

    it('should have build job with required steps', () => {
      const build = ciWorkflow.jobs.build
      expect(build).to.exist
      expect(build['runs-on']).to.equal('ubuntu-latest')

      const stepNames = build.steps.map(s => s.name)
      expect(stepNames).to.include('Checkout')
      expect(stepNames).to.include('Setup Node.js')
      expect(stepNames).to.include('Install dependencies')
      expect(stepNames).to.include('Build')
      expect(stepNames).to.include('Lint')
      expect(stepNames).to.include('Test')
    })

    it('should have matrix build job', () => {
      const matrix = ciWorkflow.jobs['build-matrix']
      expect(matrix).to.exist
      expect(matrix.strategy?.matrix.os).to.be.an('array')
      expect(matrix.strategy?.matrix.node).to.be.an('array')
      expect(matrix.strategy?.['fail-fast']).to.be.false
    })

    it('should set read-only permissions', () => {
      expect(ciWorkflow.permissions?.contents).to.equal('read')
    })
  })

  describe('releaseWorkflow', () => {
    it('should trigger on version tags', () => {
      expect(releaseWorkflow.on.push.tags).to.include('v*')
    })

    it('should have write permissions for releases', () => {
      expect(releaseWorkflow.permissions?.contents).to.equal('write')
    })

    it('should include deb and appimage build steps', () => {
      const steps = releaseWorkflow.jobs.release.steps
      const stepNames = steps.map(s => s.name)
      expect(stepNames).to.include('Build Debian package')
      expect(stepNames).to.include('Build AppImage')
    })

    it('should create GitHub release', () => {
      const steps = releaseWorkflow.jobs.release.steps
      const releaseStep = steps.find(s => s.name === 'Create GitHub Release')
      expect(releaseStep).to.exist
      expect(releaseStep?.uses).to.include('softprops/action-gh-release')
    })
  })

  describe('isoTestWorkflow', () => {
    it('should have matrix for distros', () => {
      const job = isoTestWorkflow.jobs['produce-iso']
      expect(job.strategy?.matrix.distro).to.be.an('array')
      expect(job.strategy?.matrix.distro.length).to.be.greaterThan(0)
    })

    it('should include eggs produce step', () => {
      const steps = isoTestWorkflow.jobs['produce-iso'].steps
      const produceStep = steps.find(s => s.name === 'Produce ISO')
      expect(produceStep).to.exist
      expect(produceStep?.run).to.include('produce')
    })

    it('should include verification step', () => {
      const steps = isoTestWorkflow.jobs['produce-iso'].steps
      const verifyStep = steps.find(s => s.name === 'Verify ISO')
      expect(verifyStep).to.exist
    })
  })

  describe('generateWorkflows()', () => {
    it('should create output directory', () => {
      const outputDir = path.join(tempDir, 'workflows')
      generateWorkflows(outputDir)

      expect(fs.existsSync(outputDir)).to.be.true
    })

    it('should generate all three workflow files', () => {
      const outputDir = path.join(tempDir, 'workflows')
      generateWorkflows(outputDir)

      expect(fs.existsSync(path.join(outputDir, 'ci.yml'))).to.be.true
      expect(fs.existsSync(path.join(outputDir, 'release.yml'))).to.be.true
      expect(fs.existsSync(path.join(outputDir, 'iso-test.yml'))).to.be.true
    })

    it('should include auto-generated header in output', () => {
      const outputDir = path.join(tempDir, 'workflows')
      generateWorkflows(outputDir)

      const content = fs.readFileSync(path.join(outputDir, 'ci.yml'), 'utf8')
      expect(content).to.include('Auto-generated')
      expect(content).to.include('Do not edit directly')
    })

    it('should produce valid YAML', async () => {
      const yaml = await import('js-yaml')
      const outputDir = path.join(tempDir, 'workflows')
      generateWorkflows(outputDir)

      const files = ['ci.yml', 'release.yml', 'iso-test.yml']
      for (const file of files) {
        const content = fs.readFileSync(path.join(outputDir, file), 'utf8')
        // Strip the comment header before parsing
        const yamlContent = content.replace(/^#.*\n/gm, '')
        const parsed = yaml.load(yamlContent)
        expect(parsed).to.be.an('object')
        expect((parsed as any).name).to.be.a('string')
      }
    })
  })
})
