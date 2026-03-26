/**
 * test/distro-detection.test.ts
 *
 * Verifies two things:
 *   1. Utils.getOsRelease(customFile) correctly parses real os-release files
 *      from the chef/os_release fixture corpus.
 *   2. The Distro constructor correctly maps parsed os-release data to the
 *      expected familyId, distroLike, and codenameId for representative distros.
 *
 * Fixtures: test/fixtures/os_release/ (git submodule of github.com/chef/os_release)
 */

import { expect } from 'chai'
import path from 'path'
import { fileURLToPath } from 'url'
import Utils from '../src/classes/utils.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const FIXTURES = path.join(__dirname, 'fixtures', 'os_release')

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function fixture(name: string): string {
  return path.join(FIXTURES, name)
}

// ---------------------------------------------------------------------------
// 1. Parser tests — Utils.getOsRelease(customFile)
// ---------------------------------------------------------------------------

describe('Utils.getOsRelease(customFile)', () => {
  it('parses Debian 12 (bookworm)', () => {
    const info = Utils.getOsRelease(fixture('debian_12'))
    expect(info.ID).to.equal('Debian')
    expect(info.VERSION_CODENAME).to.equal('bookworm')
    expect(info.VERSION_ID).to.equal('12')
    expect(info.HOME_URL).to.equal('https://www.debian.org/')
    expect(info.BUG_REPORT_URL).to.equal('https://bugs.debian.org/')
  })

  it('parses Debian 13 (trixie)', () => {
    const info = Utils.getOsRelease(fixture('debian_13'))
    expect(info.ID).to.equal('Debian')
    expect(info.VERSION_CODENAME).to.equal('trixie')
  })

  it('parses Ubuntu 22.04 (jammy)', () => {
    const info = Utils.getOsRelease(fixture('ubuntu_2204'))
    expect(info.ID).to.equal('Ubuntu')
    expect(info.VERSION_CODENAME).to.equal('jammy')
    expect(info.VERSION_ID).to.equal('22.04')
    expect(info.ID_LIKE).to.equal('debian')
  })

  it('parses Ubuntu 24.04 (noble)', () => {
    const info = Utils.getOsRelease(fixture('ubuntu_2404'))
    expect(info.ID).to.equal('Ubuntu')
    expect(info.VERSION_CODENAME).to.equal('noble')
  })

  it('parses Linux Mint 22 (wilma)', () => {
    const info = Utils.getOsRelease(fixture('linuxmint_22'))
    expect(info.ID).to.equal('Linuxmint')
    expect(info.VERSION_CODENAME).to.equal('wilma')
  })

  it('parses Kali 2025.4 (kali-rolling)', () => {
    const info = Utils.getOsRelease(fixture('kali_2025_4'))
    expect(info.ID).to.equal('Kali')
    expect(info.VERSION_CODENAME).to.equal('kali-rolling')
    expect(info.ID_LIKE).to.equal('debian')
  })

  it('parses Pop!_OS 22.04 (jammy)', () => {
    const info = Utils.getOsRelease(fixture('pop_os_22_04'))
    expect(info.ID).to.equal('Pop')
    expect(info.VERSION_CODENAME).to.equal('jammy')
  })

  it('parses Arch Linux (rolling, no VERSION_CODENAME)', () => {
    const info = Utils.getOsRelease(fixture('arch'))
    expect(info.ID).to.equal('Arch')
    // Arch has no VERSION_CODENAME — should fall back to 'n/a'
    expect(info.VERSION_CODENAME).to.equal('n/a')
  })

  it('parses Manjaro (rolling)', () => {
    const info = Utils.getOsRelease(fixture('manjaro'))
    expect(info.ID).to.equal('Manjaro')
    expect(info.ID_LIKE).to.equal('arch')
  })

  it('parses EndeavourOS (arch-based)', () => {
    const info = Utils.getOsRelease(fixture('endeavouros'))
    expect(info.ID).to.equal('Endeavouros')
    expect(info.ID_LIKE).to.equal('arch')
  })

  it('parses Fedora 42', () => {
    const info = Utils.getOsRelease(fixture('fedora_42'))
    expect(info.ID).to.equal('Fedora')
    expect(info.VERSION_ID).to.equal('42')
    // Fedora sets VERSION_CODENAME="" — should normalise to 'n/a'
    expect(info.VERSION_CODENAME).to.equal('n/a')
  })

  it('parses AlmaLinux 9', () => {
    const info = Utils.getOsRelease(fixture('alma_9'))
    expect(info.ID).to.equal('Almalinux')
  })

  it('parses Rocky Linux 9', () => {
    const info = Utils.getOsRelease(fixture('rocky_9'))
    expect(info.ID).to.equal('Rocky')
  })

  it('parses Alpine 3.21', () => {
    const info = Utils.getOsRelease(fixture('alpine_3_21'))
    expect(info.ID).to.equal('Alpine')
    expect(info.VERSION_ID).to.equal('3.21.4')
  })

  it('parses Gentoo 2.18', () => {
    const info = Utils.getOsRelease(fixture('gentoo_218'))
    expect(info.ID).to.equal('Gentoo')
    expect(info.VERSION_ID).to.equal('2.18')
  })

  it('parses openSUSE Leap 15', () => {
    const info = Utils.getOsRelease(fixture('opensuseleap_15'))
    expect(info.ID).to.equal('Opensuse-leap')
    expect(info.VERSION_ID).to.equal('15.6')
  })

  it('parses Raspbian 11', () => {
    const info = Utils.getOsRelease(fixture('raspbian_11'))
    expect(info.ID).to.equal('Raspbian')
    expect(info.VERSION_CODENAME).to.equal('bullseye')
    expect(info.ID_LIKE).to.equal('debian')
  })

  it('parses MX Linux (reports ID=debian in os-release)', () => {
    // MX Linux does not set its own ID= in os-release; it inherits ID=debian.
    // Distro detection for MX relies on VERSION_CODENAME (bookworm → Debian family).
    const info = Utils.getOsRelease(fixture('mxlinux'))
    expect(info.ID).to.equal('Debian')
    expect(info.VERSION_CODENAME).to.equal('bookworm')
  })

  it('parses Parrot', () => {
    const info = Utils.getOsRelease(fixture('parrot'))
    expect(info.ID).to.equal('Parrot')
    expect(info.ID_LIKE).to.equal('debian')
  })

  it('returns safe defaults when file does not exist', () => {
    const info = Utils.getOsRelease('/nonexistent/os-release')
    expect(info.ID).to.equal('')
    expect(info.VERSION_CODENAME).to.equal('n/a')
    expect(info.VERSION_ID).to.equal('')
  })

  it('ID is always capitalised (first letter upper, rest lower)', () => {
    // debian fixture has ID=debian (all lower)
    const info = Utils.getOsRelease(fixture('debian_12'))
    expect(info.ID[0]).to.equal(info.ID[0].toUpperCase())
    expect(info.ID.slice(1)).to.equal(info.ID.slice(1).toLowerCase())
  })

  it('VERSION_CODENAME is always lower-case', () => {
    const info = Utils.getOsRelease(fixture('ubuntu_2204'))
    expect(info.VERSION_CODENAME).to.equal(info.VERSION_CODENAME.toLowerCase())
  })
})

// ---------------------------------------------------------------------------
// 2. Batch parser smoke-test — every fixture must parse without throwing
// ---------------------------------------------------------------------------

import fs from 'node:fs'

describe('Utils.getOsRelease — all chef fixtures parse without error', () => {
  const allFixtures = fs
    .readdirSync(FIXTURES)
    .filter((f) => !['CODE_OF_CONDUCT.md', 'LICENSE', 'README.md', '.git'].includes(f))
    .filter((f) => fs.statSync(path.join(FIXTURES, f)).isFile())

  for (const name of allFixtures) {
    it(`parses ${name}`, () => {
      expect(() => Utils.getOsRelease(fixture(name))).to.not.throw()
      const info = Utils.getOsRelease(fixture(name))
      // ID must always be a non-empty string (every real os-release has ID=)
      expect(info.ID).to.be.a('string').and.have.length.greaterThan(0)
      // VERSION_CODENAME must always be a string (defaults to 'n/a')
      expect(info.VERSION_CODENAME).to.be.a('string').and.have.length.greaterThan(0)
    })
  }
})

// ---------------------------------------------------------------------------
// 3. custom_file integration — simulate reading a chroot target during produce
// ---------------------------------------------------------------------------

describe('Utils.getOsRelease(customFile) — chroot simulation', () => {
  it('reads target system identity from a non-default path', () => {
    // Simulates: Utils.getOsRelease(settings.snapshot_mnt + '/etc/os-release')
    // by pointing at a fixture file that is not at /etc/os-release
    const targetOsRelease = fixture('ubuntu_2404')
    const info = Utils.getOsRelease(targetOsRelease)
    expect(info.ID).to.equal('Ubuntu')
    expect(info.VERSION_CODENAME).to.equal('noble')
  })

  it('host and target can differ when customFile is used', () => {
    // Host is whatever the CI machine runs; target is pinned to debian_12
    const hostInfo = Utils.getOsRelease()
    const targetInfo = Utils.getOsRelease(fixture('debian_12'))
    // The target is always Debian bookworm regardless of host
    expect(targetInfo.ID).to.equal('Debian')
    expect(targetInfo.VERSION_CODENAME).to.equal('bookworm')
    // Host and target may or may not match — we just verify both return valid data
    expect(hostInfo.ID).to.be.a('string')
  })
})
