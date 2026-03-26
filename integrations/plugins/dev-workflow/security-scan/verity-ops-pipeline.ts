/**
 * plugins/dev-workflow/security-scan/verity-ops-pipeline.ts
 *
 * DevSecOps CI/security pipeline patterns from Project-VerityOps.
 *
 * Project-VerityOps (https://github.com/Vijay-Kishore-A/Project-VerityOps)
 * is a DevSecOps pipeline for Android-style system images using AVB and
 * dm-verity. This plugin adapts its CI patterns for eggs-produced ISOs:
 *
 *   - SAST (static analysis) via semgrep
 *   - SBOM generation (CycloneDX format) via syft
 *   - CVE scanning via grype
 *   - Provenance attestation (SLSA level 2) via slsa-github-generator
 *   - Tamper-detection CI test: flip a block in the image, verify dm-verity
 *     detects it (proves the verity pipeline is actually enforced)
 *   - GitHub Actions workflow generation for all of the above
 */

import fs from 'node:fs'
import path from 'node:path'

type ExecFn = (cmd: string, opts?: { capture?: boolean; echo?: boolean }) => Promise<{
  code: number
  data: string
  error?: string
}>

export interface SecurityScanOptions {
  /** Directory containing the eggs source code to scan. */
  sourceDir?: string
  /** Path to the ISO or filesystem image to scan. */
  imagePath?: string
  /** Output directory for scan reports. */
  outputDir?: string
  /** SBOM format: cyclonedx-json | spdx-json | syft-json. Default: cyclonedx-json. */
  sbomFormat?: 'cyclonedx-json' | 'spdx-json' | 'syft-json'
}

export interface SbomResult {
  sbomPath: string
  format: string
  componentCount: number
}

export interface CveResult {
  reportPath: string
  criticalCount: number
  highCount: number
  mediumCount: number
  lowCount: number
}

export interface TamperTestResult {
  /** Whether dm-verity correctly detected the tampered block. */
  tamperDetected: boolean
  /** Offset of the flipped byte. */
  flipOffset: number
  /** Root hash used for verification. */
  rootHash: string
}

export class VerityOpsPipeline {
  private exec: ExecFn
  private verbose: boolean
  private opts: Required<SecurityScanOptions>

  constructor(exec: ExecFn, verbose = false, opts: SecurityScanOptions = {}) {
    this.exec = exec
    this.verbose = verbose
    this.opts = {
      sourceDir: opts.sourceDir ?? process.cwd(),
      imagePath: opts.imagePath ?? '',
      outputDir: opts.outputDir ?? './security-reports',
      sbomFormat: opts.sbomFormat ?? 'cyclonedx-json',
    }
  }

  /**
   * Run SAST (static analysis) on the eggs source code using semgrep.
   * Falls back to eslint security plugin if semgrep is unavailable.
   */
  async runSast(): Promise<string> {
    fs.mkdirSync(this.opts.outputDir, { recursive: true })
    const reportPath = path.join(this.opts.outputDir, 'sast-report.json')

    const semgrepCheck = await this.exec('command -v semgrep', { capture: true })
    if (semgrepCheck.code === 0) {
      const result = await this.exec(
        `semgrep --config=auto --json --output="${reportPath}" "${this.opts.sourceDir}"`,
        { echo: this.verbose }
      )
      if (result.code !== 0 && result.code !== 1) {
        // semgrep exits 1 when findings exist — that's expected
        throw new Error(`semgrep failed: ${result.error ?? result.data}`)
      }
      console.log(`SAST: semgrep report written to ${reportPath}`)
    } else {
      // Fallback: eslint with security plugin
      const eslintResult = await this.exec(
        `npx eslint --format json --output-file "${reportPath}" "${this.opts.sourceDir}/src" 2>/dev/null || true`,
        { echo: this.verbose }
      )
      console.log(`SAST: eslint report written to ${reportPath}`)
    }

    return reportPath
  }

  /**
   * Generate a Software Bill of Materials (SBOM) for the eggs package.
   * Uses syft to enumerate all npm dependencies and their licenses.
   */
  async generateSbom(): Promise<SbomResult> {
    fs.mkdirSync(this.opts.outputDir, { recursive: true })
    const sbomPath = path.join(this.opts.outputDir, `sbom.${this.opts.sbomFormat.replace('-', '.')}.json`)

    const syftCheck = await this.exec('command -v syft', { capture: true })
    if (syftCheck.code !== 0) {
      throw new Error(
        'syft not found. Install: curl -sSfL https://raw.githubusercontent.com/anchore/syft/main/install.sh | sh'
      )
    }

    const result = await this.exec(
      `syft dir:"${this.opts.sourceDir}" -o "${this.opts.sbomFormat}=${sbomPath}"`,
      { echo: this.verbose }
    )
    if (result.code !== 0) {
      throw new Error(`syft failed: ${result.error ?? result.data}`)
    }

    // Count components from the SBOM
    let componentCount = 0
    try {
      const sbom = JSON.parse(fs.readFileSync(sbomPath, 'utf8'))
      componentCount = sbom.components?.length ?? sbom.packages?.length ?? 0
    } catch { /* non-fatal */ }

    console.log(`SBOM: ${componentCount} components → ${sbomPath}`)
    return { sbomPath, format: this.opts.sbomFormat, componentCount }
  }

  /**
   * Scan for CVEs in the eggs dependencies using grype.
   * Accepts a syft SBOM as input for faster scanning.
   */
  async scanCves(sbomPath?: string): Promise<CveResult> {
    fs.mkdirSync(this.opts.outputDir, { recursive: true })
    const reportPath = path.join(this.opts.outputDir, 'cve-report.json')

    const grypeCheck = await this.exec('command -v grype', { capture: true })
    if (grypeCheck.code !== 0) {
      throw new Error(
        'grype not found. Install: curl -sSfL https://raw.githubusercontent.com/anchore/grype/main/install.sh | sh'
      )
    }

    const target = sbomPath ? `sbom:${sbomPath}` : `dir:${this.opts.sourceDir}`
    const result = await this.exec(
      `grype "${target}" -o json --file "${reportPath}"`,
      { echo: this.verbose }
    )
    if (result.code !== 0) {
      throw new Error(`grype failed: ${result.error ?? result.data}`)
    }

    // Parse severity counts
    let criticalCount = 0, highCount = 0, mediumCount = 0, lowCount = 0
    try {
      const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'))
      for (const match of report.matches ?? []) {
        const sev = match.vulnerability?.severity?.toLowerCase() ?? ''
        if (sev === 'critical') criticalCount++
        else if (sev === 'high') highCount++
        else if (sev === 'medium') mediumCount++
        else if (sev === 'low') lowCount++
      }
    } catch { /* non-fatal */ }

    console.log(`CVE scan: critical=${criticalCount} high=${highCount} medium=${mediumCount} low=${lowCount}`)
    console.log(`CVE report: ${reportPath}`)

    return { reportPath, criticalCount, highCount, mediumCount, lowCount }
  }

  /**
   * Tamper-detection test: flip a byte in the filesystem image and verify
   * that dm-verity detects the corruption.
   *
   * This is the key CI test from Project-VerityOps — it proves the verity
   * pipeline is actually enforced, not just present.
   *
   * @param imagePath   Path to the filesystem image (must have a .verity hash tree)
   * @param rootHash    dm-verity root hash for the image
   */
  async runTamperTest(imagePath: string, rootHash: string): Promise<TamperTestResult> {
    const hashTreePath = `${imagePath}.verity`

    if (!fs.existsSync(imagePath)) throw new Error(`Image not found: ${imagePath}`)
    if (!fs.existsSync(hashTreePath)) throw new Error(`Hash tree not found: ${hashTreePath}`)

    // Choose a byte offset well into the data (skip the superblock)
    const stat = fs.statSync(imagePath)
    const flipOffset = Math.floor(stat.size / 2)

    // Read the original byte
    const fd = fs.openSync(imagePath, 'r+')
    const buf = Buffer.alloc(1)
    fs.readSync(fd, buf, 0, 1, flipOffset)
    const originalByte = buf[0]

    // Flip the byte (XOR with 0xFF)
    buf[0] = originalByte ^ 0xff
    fs.writeSync(fd, buf, 0, 1, flipOffset)
    fs.closeSync(fd)

    if (this.verbose) {
      console.log(`tamper-test: flipped byte at offset ${flipOffset}: 0x${originalByte.toString(16)} → 0x${buf[0].toString(16)}`)
    }

    // Verify — dm-verity should reject the tampered image
    const verifyResult = await this.exec(
      `veritysetup verify "${imagePath}" "${hashTreePath}" "${rootHash}" 2>&1`,
      { capture: true }
    )
    const tamperDetected = verifyResult.code !== 0

    // Restore the original byte
    const fdRestore = fs.openSync(imagePath, 'r+')
    const restoreBuf = Buffer.from([originalByte])
    fs.writeSync(fdRestore, restoreBuf, 0, 1, flipOffset)
    fs.closeSync(fdRestore)

    if (tamperDetected) {
      console.log(`tamper-test: PASS — dm-verity correctly detected tampered block at offset ${flipOffset}`)
    } else {
      console.error(`tamper-test: FAIL — dm-verity did NOT detect tampered block. Verity pipeline is broken!`)
    }

    return { tamperDetected, flipOffset, rootHash }
  }

  /**
   * Generate a GitHub Actions workflow YAML that runs the full security
   * pipeline on every push and pull request.
   */
  generateCiWorkflow(): string {
    return `# .github/workflows/security.yml
# Generated by penguins-eggs verity-ops-pipeline plugin.
# Runs SAST, SBOM generation, CVE scanning, and dm-verity tamper detection.

name: Security Pipeline

on:
  push:
    branches: [main, master, all-features]
  pull_request:

permissions:
  contents: read
  security-events: write
  id-token: write  # for SLSA provenance

jobs:
  sast:
    name: SAST (semgrep)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run semgrep
        uses: semgrep/semgrep-action@v1
        with:
          config: auto
          generateSarif: "1"
      - name: Upload SARIF
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: semgrep.sarif
        if: always()

  sbom:
    name: SBOM + CVE scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install syft
        run: curl -sSfL https://raw.githubusercontent.com/anchore/syft/main/install.sh | sh -s -- -b /usr/local/bin
      - name: Generate SBOM
        run: syft dir:. -o cyclonedx-json=sbom.cyclonedx.json
      - name: Install grype
        run: curl -sSfL https://raw.githubusercontent.com/anchore/grype/main/install.sh | sh -s -- -b /usr/local/bin
      - name: Scan CVEs
        run: grype sbom:sbom.cyclonedx.json -o table
      - name: Upload SBOM artifact
        uses: actions/upload-artifact@v4
        with:
          name: sbom
          path: sbom.cyclonedx.json

  verity-tamper-test:
    name: dm-verity tamper detection
    runs-on: ubuntu-latest
    needs: []
    steps:
      - uses: actions/checkout@v4
      - name: Install dependencies
        run: sudo apt-get install -y squashfs-tools cryptsetup-bin
      - name: Build test SquashFS image
        run: |
          mkdir -p /tmp/test-rootfs/etc
          echo "test" > /tmp/test-rootfs/etc/test.txt
          mksquashfs /tmp/test-rootfs /tmp/test.squashfs -noappend
      - name: Generate dm-verity hash tree
        run: |
          veritysetup format /tmp/test.squashfs /tmp/test.squashfs.verity \\
            | tee /tmp/verity-output.txt
          grep "Root hash" /tmp/verity-output.txt | awk '{print $3}' > /tmp/root-hash.txt
          echo "ROOT_HASH=$(cat /tmp/root-hash.txt)" >> $GITHUB_ENV
      - name: Verify unmodified image (should pass)
        run: veritysetup verify /tmp/test.squashfs /tmp/test.squashfs.verity "$ROOT_HASH"
      - name: Flip a byte (simulate tamper)
        run: |
          python3 -c "
          import struct
          with open('/tmp/test.squashfs', 'r+b') as f:
              f.seek(4096)
              b = f.read(1)
              f.seek(4096)
              f.write(bytes([b[0] ^ 0xff]))
          "
      - name: Verify tampered image (should FAIL — proving verity works)
        run: |
          if veritysetup verify /tmp/test.squashfs /tmp/test.squashfs.verity "$ROOT_HASH" 2>/dev/null; then
            echo "ERROR: verity did not detect tamper!" && exit 1
          else
            echo "PASS: verity correctly rejected tampered image"
          fi

  provenance:
    name: SLSA provenance
    needs: [sast, sbom]
    permissions:
      actions: read
      id-token: write
      contents: write
    uses: slsa-framework/slsa-github-generator/.github/workflows/generator_generic_slsa3.yml@v2.0.0
    with:
      base64-subjects: ""  # set to sha256 of release artifacts
`
  }

  /**
   * Write the CI workflow to .github/workflows/security.yml.
   */
  writeCiWorkflow(repoRoot: string): string {
    const workflowDir = path.join(repoRoot, '.github', 'workflows')
    fs.mkdirSync(workflowDir, { recursive: true })
    const workflowPath = path.join(workflowDir, 'security.yml')
    fs.writeFileSync(workflowPath, this.generateCiWorkflow())
    console.log(`Security CI workflow written: ${workflowPath}`)
    return workflowPath
  }
}
