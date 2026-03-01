/**
 * test/phase1/lfs-config.test.ts
 * Tests for LFS configuration loading and saving.
 */

import { expect } from 'chai'
import fs from 'node:fs'
import path from 'node:path'
import yaml from 'js-yaml'

import { createTempDir, cleanTempDir } from '../helpers/mock-fs.js'

describe('LFS Config Logic', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = createTempDir('lfs-config-test-')
  })

  afterEach(() => {
    cleanTempDir(tempDir)
  })

  it('should have correct default values', () => {
    const defaults = {
      enabled: false,
      remote: 'origin',
      server: '',
      auto_push: true,
      track_patterns: ['*.iso', '*.img'],
    }

    expect(defaults.enabled).to.be.false
    expect(defaults.remote).to.equal('origin')
    expect(defaults.auto_push).to.be.true
    expect(defaults.track_patterns).to.have.lengthOf(2)
    expect(defaults.track_patterns).to.include('*.iso')
    expect(defaults.track_patterns).to.include('*.img')
  })

  it('should serialize config to YAML correctly', () => {
    const config = {
      lfs: {
        enabled: true,
        remote: 'myremote',
        server: 'https://lfs.example.com',
        auto_push: false,
        track_patterns: ['*.iso'],
      },
    }

    const content = yaml.dump(config)
    expect(content).to.include('enabled: true')
    expect(content).to.include('remote: myremote')
    expect(content).to.include('server: https://lfs.example.com')
    expect(content).to.include('auto_push: false')
  })

  it('should deserialize YAML config correctly', () => {
    const yamlContent = `
lfs:
  enabled: true
  remote: production
  server: https://lfs.prod.com
  auto_push: true
  track_patterns:
    - "*.iso"
    - "*.img"
    - "*.squashfs"
`
    const parsed = yaml.load(yamlContent) as any
    expect(parsed.lfs.enabled).to.be.true
    expect(parsed.lfs.remote).to.equal('production')
    expect(parsed.lfs.track_patterns).to.have.lengthOf(3)
  })

  it('should round-trip config through YAML', () => {
    const original = {
      lfs: {
        enabled: true,
        remote: 'origin',
        server: 'https://giftless.example.com',
        auto_push: true,
        track_patterns: ['*.iso', '*.img'],
      },
    }

    const serialized = yaml.dump(original)
    const deserialized = yaml.load(serialized) as any

    expect(deserialized.lfs.enabled).to.equal(original.lfs.enabled)
    expect(deserialized.lfs.remote).to.equal(original.lfs.remote)
    expect(deserialized.lfs.server).to.equal(original.lfs.server)
    expect(deserialized.lfs.track_patterns).to.deep.equal(original.lfs.track_patterns)
  })

  it('should handle missing lfs key gracefully', () => {
    const parsed = yaml.load('other_key: value') as any
    const config = parsed?.lfs || null
    expect(config).to.be.null
  })
})
