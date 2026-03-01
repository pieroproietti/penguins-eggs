/**
 * test/phase5/gitstream.test.ts
 * Tests for the gitStream PR automation rules.
 * Validates the .cm file structure and rule logic.
 */

import { expect } from 'chai'
import fs from 'node:fs'
import path from 'node:path'

const GITSTREAM_PATH = path.resolve('plugins/dev-workflow/pr-automation/gitstream.cm')

describe('gitStream Rules', () => {
  let content: string

  before(() => {
    content = fs.readFileSync(GITSTREAM_PATH, 'utf8')
  })

  it('should have manifest version', () => {
    expect(content).to.include('manifest:')
    expect(content).to.include('version: 1.0')
  })

  it('should have automations section', () => {
    expect(content).to.include('automations:')
  })

  describe('auto-labeling rules', () => {
    it('should label wardrobe changes', () => {
      expect(content).to.include('label_wardrobe')
      expect(content).to.include('label: "wardrobe"')
    })

    it('should label packaging changes', () => {
      expect(content).to.include('label_packaging')
      expect(content).to.include('label: "packaging"')
    })

    it('should label installer changes', () => {
      expect(content).to.include('label_installer')
      expect(content).to.include('label: "installer"')
    })

    it('should label core changes', () => {
      expect(content).to.include('label_core')
      expect(content).to.include('label: "core"')
    })

    it('should label CLI changes', () => {
      expect(content).to.include('label_cli')
      expect(content).to.include('label: "cli"')
    })

    it('should label documentation changes', () => {
      expect(content).to.include('label_docs')
      expect(content).to.include('label: "docs"')
    })

    it('should label CI changes', () => {
      expect(content).to.include('label_ci')
      expect(content).to.include('label: "ci"')
    })

    it('should label small and large changes', () => {
      expect(content).to.include('label_small_change')
      expect(content).to.include('label_large_change')
    })
  })

  describe('auto-assign rules', () => {
    it('should comment on Debian/Ubuntu changes', () => {
      expect(content).to.include('assign_distro_debian')
      expect(content).to.match(/debian|devuan|ubuntu/)
    })

    it('should comment on Arch/Manjaro changes', () => {
      expect(content).to.include('assign_distro_arch')
      expect(content).to.match(/arch|manjaro/)
    })

    it('should comment on Fedora changes', () => {
      expect(content).to.include('assign_distro_fedora')
      expect(content).to.match(/fedora|alma/)
    })
  })

  describe('auto-merge rules', () => {
    it('should auto-merge docs with approval', () => {
      expect(content).to.include('auto_merge_docs')
      expect(content).to.include('allDocs')
      expect(content).to.include('wait_for_all_checks: true')
    })

    it('should auto-merge small safe changes', () => {
      expect(content).to.include('auto_merge_small_safe')
    })
  })

  describe('extra review rules', () => {
    it('should require 2 approvals for core changes', () => {
      expect(content).to.include('require_extra_review_core')
      expect(content).to.include('approvals: 2')
    })
  })
})
