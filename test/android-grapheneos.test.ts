/**
 * Tests for GrapheneOS-specific functionality:
 * - Detection, hardening features, SELinux, recovery, attestation
 * - adevtool-style device config analysis
 * - Release channel metadata generation
 */

import { expect } from 'chai'

import {
  IGrapheneOSInfo,
  ISepolicyInfo,
  IRecoveryInfo,
  IAttestationInfo,
  IAdevtoolConfig,
  isGrapheneOS,
  detectGrapheneOS,
  getSELinuxMode,
  analyzeSepolicy,
  detectRecovery,
  detectAttestation,
  analyzeDeviceConfig,
  getGrapheneOSReleaseInfo,
} from '../src/android/grapheneos.js'

import {
  generateGrapheneOSMetadata,
  generateGrapheneOSOtaMetadataFile,
} from '../src/classes/ovary.d/android/android-ota.js'

describe('GrapheneOS Module', () => {
  describe('isGrapheneOS', () => {
    it('should return false on non-GrapheneOS system', () => {
      // We're running on a dev container, not GrapheneOS
      expect(isGrapheneOS()).to.be.false
    })
  })

  describe('detectGrapheneOS', () => {
    it('should return a complete IGrapheneOSInfo structure', () => {
      const info = detectGrapheneOS()

      expect(info).to.have.property('isGrapheneOS')
      expect(info).to.have.property('version')
      expect(info).to.have.property('androidVersion')
      expect(info).to.have.property('device')
      expect(info).to.have.property('securityPatch')
      expect(info).to.have.property('bootloaderLocked')
      expect(info).to.have.property('verifiedBootState')
      expect(info).to.have.property('hasAuditor')
      expect(info).to.have.property('selinuxEnforcing')
      expect(info).to.have.property('hardening')

      // On non-GrapheneOS, should be false
      expect(info.isGrapheneOS).to.be.false
    })

    it('should return hardening features structure', () => {
      const info = detectGrapheneOS()
      const h = info.hardening

      expect(h).to.have.property('execSpawning')
      expect(h).to.have.property('hardenedMalloc')
      expect(h).to.have.property('networkPermissionToggle')
      expect(h).to.have.property('sensorPermissionToggle')
      expect(h).to.have.property('storageScopes')
      expect(h).to.have.property('contactScopes')
      expect(h).to.have.property('scrambledPin')
      expect(h).to.have.property('autoReboot')
      expect(h).to.have.property('usbControl')
      expect(h).to.have.property('wifiPrivacy')

      // All should be booleans
      for (const key of Object.keys(h)) {
        expect((h as any)[key]).to.be.a('boolean')
      }
    })
  })

  describe('SELinux Analysis', () => {
    it('getSELinuxMode should return a valid mode string', () => {
      const mode = getSELinuxMode()
      expect(['enforcing', 'permissive', 'disabled', 'unknown']).to.include(mode)
    })

    it('analyzeSepolicy should return ISepolicyInfo structure', () => {
      const info = analyzeSepolicy()

      expect(info).to.have.property('present')
      expect(info).to.have.property('mode')
      expect(info).to.have.property('policyVersion')
      expect(info).to.have.property('hasGrapheneOSPolicy')
      expect(info).to.have.property('customRuleCount')
      expect(info).to.have.property('policyPaths')

      expect(info.present).to.be.a('boolean')
      expect(info.policyPaths).to.be.an('array')
      expect(info.customRuleCount).to.be.a('number')
    })
  })

  describe('Recovery Detection', () => {
    it('should return IRecoveryInfo structure', () => {
      const info = detectRecovery()

      expect(info).to.have.property('hasRecovery')
      expect(info).to.have.property('type')
      expect(info).to.have.property('supportsSideload')
      expect(info).to.have.property('partitionPath')

      expect(info.hasRecovery).to.be.a('boolean')
      expect(['aosp', 'grapheneos', 'lineageos', 'twrp', 'none', 'unknown']).to.include(info.type)
    })

    it('should not detect recovery on dev container', () => {
      const info = detectRecovery()
      // No Android recovery on a dev container
      expect(info.type).to.equal('none')
    })
  })

  describe('Attestation Detection', () => {
    it('should return IAttestationInfo structure', () => {
      const info = detectAttestation()

      expect(info).to.have.property('hardwareAttestationSupported')
      expect(info).to.have.property('keymasterVersion')
      expect(info).to.have.property('hasStrongBox')
      expect(info).to.have.property('auditorInstalled')
      expect(info).to.have.property('attestationServerUrl')

      expect(info.hardwareAttestationSupported).to.be.a('boolean')
      expect(info.keymasterVersion).to.be.a('number')
    })

    it('should not detect attestation on dev container', () => {
      const info = detectAttestation()
      expect(info.hardwareAttestationSupported).to.be.false
      expect(info.auditorInstalled).to.be.false
    })
  })

  describe('adevtool-style Device Config Analysis', () => {
    it('should return IAdevtoolConfig structure', () => {
      const config = analyzeDeviceConfig()

      expect(config).to.have.property('device')
      expect(config).to.have.property('vendorBlobs')
      expect(config).to.have.property('missingSepolicies')
      expect(config).to.have.property('missingHals')
      expect(config).to.have.property('missingProps')

      expect(config.vendorBlobs).to.be.an('array')
      expect(config.missingHals).to.be.an('array')
      expect(config.device).to.be.a('string')
    })
  })

  describe('Release Channel Info', () => {
    it('should generate correct release URLs for a device', () => {
      const info = getGrapheneOSReleaseInfo('husky', 'stable')

      expect(info.channel).to.equal('stable')
      expect(info.otaUrl).to.equal('https://releases.grapheneos.org/husky-ota_update-latest.zip')
      expect(info.factoryUrl).to.equal('https://releases.grapheneos.org/husky-factory-latest.zip')
    })

    it('should support different channels', () => {
      const beta = getGrapheneOSReleaseInfo('shiba', 'beta')
      expect(beta.channel).to.equal('beta')
      expect(beta.factoryUrl).to.include('shiba')
    })
  })

  describe('GrapheneOS OTA Metadata', () => {
    it('should generate release metadata', () => {
      const meta = generateGrapheneOSMetadata('husky', '2024030100', 'stable')

      expect(meta.device).to.equal('husky')
      expect(meta.versionCode).to.equal('2024030100')
      expect(meta.channel).to.equal('stable')
      expect(meta.factoryFilename).to.equal('husky-factory-2024030100.zip')
      expect(meta.otaFilename).to.equal('husky-ota_update-2024030100.zip')
      expect(meta.datetime).to.be.a('number')
      expect(meta.datetime).to.be.greaterThan(0)
    })

    it('should generate OTA metadata text file', () => {
      const text = generateGrapheneOSOtaMetadataFile('husky', '2024030100', 'stable')
      expect(text).to.equal('2024030100\n')
    })

    it('should handle different devices and channels', () => {
      const meta = generateGrapheneOSMetadata('panther', '2024060100', 'beta')
      expect(meta.device).to.equal('panther')
      expect(meta.channel).to.equal('beta')
      expect(meta.factoryFilename).to.equal('panther-factory-2024060100.zip')
    })
  })
})
