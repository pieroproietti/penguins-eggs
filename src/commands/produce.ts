/**
 * ./src/commands/produce.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import { Command, Flags } from '@oclif/core'
import chalk from 'chalk'
import fs from 'node:fs'
import path from 'node:path'

import Compressors from '../classes/compressors.js'
import Distro from '../classes/distro.js'
import Ovary from '../classes/ovary.js'
import Utils from '../classes/utils.js'
import { IAddons, IExcludes } from '../interfaces/index.js'
import { exec } from '../lib/utils.js'
import { runPlugins } from '../lib/plugin-loader.js'
import Config from './config.js'

// _dirname
const __dirname = path.dirname(new URL(import.meta.url).pathname)

export default class Produce extends Command {
  static description = 'produce a live image from your system'
  static examples = [
    'sudo eggs produce                    # zstd fast compression',
    'sudo eggs produce --pendrive         # zstd compression optimized pendrive',
    'sudo eggs produce --clone            # clear clone (unencrypted)',
    'sudo eggs produce --homecrypt      # clone crypted home (all inside /home is cypted)',
    'sudo eggs produce --fullcrypt      # clone crypted full (entire system is crypted)',
    'sudo eggs produce --basename=colibri',
    'sudo eggs produce --recovery         # add recovery tools',
    'sudo eggs produce --recovery --recovery-gui=minimal  # with GUI',
    'sudo eggs produce --recovery --recovery-rescapp      # with rescapp',
    'sudo eggs produce --cros-flavour=thorium   # ChromiumOS with Thorium browser',
    'sudo eggs produce --cros-flavour=brave     # ChromiumOS with Brave browser',
    'sudo eggs produce --cros-flavour=custom --cros-browser-repo=https://github.com/user/fork  # custom browser',
    'sudo eggs produce --sbom                # generate SBOM for the produced ISO (requires syft)',
    'sudo eggs produce --distrobuilder       # export to Incus/LXC image via distrobuilder (default: incus)',
    'sudo eggs produce --distrobuilder --distrobuilder-type=lxc   # export as LXC image',
    'sudo eggs produce --distrobuilder --distrobuilder-type=both  # export both Incus and LXC images',
    'sudo eggs produce --publish-incus --publish-incus-url=https://images.example.com --publish-incus-token=<token> --publish-incus-product=<id>  # build + publish to incus-image-server',
    'sudo eggs produce --audit                          # full audit: SBOM + license scan + attestation + hardening',
    'sudo eggs produce --audit --audit-vouch-key=~/.vouch/key.pem  # audit with cryptographic attestation',
    'sudo eggs produce --audit --audit-hardening        # audit + apply OS hardening to the chroot',
    'sudo eggs produce --audit --audit-format=cyclonedx-json  # audit with CycloneDX SBOM format'
  ]
  static flags = {
    addons: Flags.string({ description: 'addons to be used: adapt, pve, rsupport', multiple: true }),
    basename: Flags.string({ description: 'basename' }),
    'cros-browser-repo': Flags.string({ description: 'custom browser repo URL for ChromiumOS flavour' }),
    'cros-flavour': Flags.string({ description: 'ChromiumOS browser flavour: chromium, thorium, brave, vanadium, bromite, cromite' }),
    dtbdir: Flags.string({ description: 'path to Device Tree Blobs (DTB) directory' }),
    clone: Flags.boolean({ char: 'c', description: 'clone (uncrypted)' }),
    excludes: Flags.string({ description: 'use: static, homes, home', multiple: true }),
    fullcrypt: Flags.boolean({ char: 'f', description: 'clone crypted full' }),
    help: Flags.help({ char: 'h' }),
    hidden: Flags.boolean({ char: 'H', description: 'stealth mode' }),
    homecrypt: Flags.boolean({ char: 'k', description: 'clone crypted home' }),
    includeRootHome: Flags.boolean({ char: 'i', description: 'folder /root is included on live' }),
    kernel: Flags.string({ char: 'K', description: 'kernel version' }),
    links: Flags.string({ description: 'desktop links', multiple: true }),
    max: Flags.boolean({ char: 'm', description: 'max compression: xz -Xbcj ...' }),
    noicon: Flags.boolean({ char: 'N', description: 'no icon eggs on desktop' }),
    nointeractive: Flags.boolean({ char: 'n', description: 'no user interaction' }),
    pendrive: Flags.boolean({ char: 'p', description: 'optimized for pendrive: zstd -b 1M -Xcompression-level 15' }),
    prefix: Flags.string({ char: 'P', description: 'prefix' }),
    recovery: Flags.boolean({ description: 'layer penguins-recovery tools onto the produced ISO' }),
    'recovery-gui': Flags.string({ description: 'GUI profile for recovery: minimal, touch, or full', options: ['minimal', 'touch', 'full'] }),
    'recovery-rescapp': Flags.boolean({ description: 'include rescapp GUI wizard in recovery ISO' }),
    lfs: Flags.boolean({ description: 'track produced ISO in git-lfs after build' }),
    ipfs: Flags.boolean({ description: 'publish produced ISO to IPFS via brig after build' }),
    snapshot: Flags.boolean({ description: 'create BTRFS snapshots before/after build (requires BTRFS)' }),
    sbom: Flags.boolean({ description: 'generate a Software Bill of Materials (SBOM) for the produced ISO via syft' }),
    distrobuilder: Flags.boolean({ description: 'export the produced system to an Incus/LXC container image via distrobuilder' }),
    'distrobuilder-type': Flags.string({ description: 'distrobuilder image type: incus, lxc, or both (default: incus)', options: ['incus', 'lxc', 'both'] }),
    'distrobuilder-output': Flags.string({ description: 'output directory for distrobuilder images (default: /var/lib/eggs/distrobuilder)' }),
    'publish-incus': Flags.boolean({ description: 'publish the distrobuilder image to an incus-image-server (implies --distrobuilder)' }),
    'publish-incus-url': Flags.string({ description: 'incus-image-server base URL (e.g. https://images.example.com)' }),
    'publish-incus-token': Flags.string({ description: 'incus-image-server publish session token' }),
    'publish-incus-product': Flags.string({ description: 'incus-image-server product ID to publish under' }),
    audit: Flags.boolean({ description: 'run full audit pipeline: SBOM generation (syft), license scan (grant), attestation (vouch), optional hardening' }),
    'audit-format': Flags.string({ description: 'SBOM format: spdx-json, cyclonedx-json, syft-json, spdx-tag-value (default: spdx-json)', options: ['spdx-json', 'cyclonedx-json', 'syft-json', 'spdx-tag-value'] }),
    'audit-output': Flags.string({ description: 'output directory for audit artefacts (default: /var/lib/eggs/audit)' }),
    'audit-vouch-key': Flags.string({ description: 'path to vouch signing key for ISO attestation (skipped if not set)' }),
    'audit-hardening': Flags.boolean({ description: 'apply OS hardening scripts to the chroot before ISO assembly' }),
    'audit-grant-policy': Flags.string({ description: 'path to .grant.yaml license policy file' }),
    'audit-fail-on-deny': Flags.boolean({ description: 'exit non-zero if license policy violations are found (default: false)', default: false }),
    release: Flags.boolean({ description: 'release: remove penguins-eggs, calamares and dependencies after installation' }),
    script: Flags.boolean({ char: 's', description: 'script mode. Generate scripts to manage iso build' }),
    standard: Flags.boolean({ char: 'S', description: 'standard compression: xz -b 1M' }),
    theme: Flags.string({ description: 'theme for livecd, calamares branding and partitions' }),
    verbose: Flags.boolean({ char: 'v', description: 'verbose' }),
    yolk: Flags.boolean({ char: 'y', description: 'force yolk renew' })
  }

  /**
   * Apply penguins-recovery tools to a produced ISO.
   * Downloads the adapter if not present, then runs it against the ISO.
   */
  private async applyRecovery(isoPath: string, guiProfile?: string, withRescapp?: boolean, verbose?: boolean): Promise<void> {
    const recoveryRepo = 'https://github.com/Interested-Deving-1896/penguins-recovery'
    const recoveryDir = '/usr/local/share/penguins-recovery'
    const adapterScript = `${recoveryDir}/adapters/adapter.sh`

    Utils.warning('Applying penguins-recovery tools to ISO...')

    if (!fs.existsSync(adapterScript)) {
      Utils.warning(`Downloading penguins-recovery from ${recoveryRepo}`)
      const { execSync } = await import('node:child_process')
      try {
        execSync(`git clone --depth=1 ${recoveryRepo} ${recoveryDir}`, {
          stdio: verbose ? 'inherit' : 'pipe'
        })
      } catch {
        console.log(chalk.red('Failed to download penguins-recovery. Skipping recovery layer.'))
        console.log(chalk.yellow(`Install manually: git clone ${recoveryRepo} ${recoveryDir}`))
        return
      }
    }

    const outputIso = isoPath.replace('.iso', '-recovery.iso')
    let cmd = `sudo ${adapterScript} --input "${isoPath}" --output "${outputIso}"`

    if (guiProfile) {
      cmd += ` --gui ${guiProfile}`
    }

    if (withRescapp) {
      cmd += ' --with-rescapp'
    }

    Utils.warning(`Running: ${cmd}`)
    const { execSync } = await import('node:child_process')
    try {
      execSync(cmd, { stdio: 'inherit' })
      console.log(chalk.green(`Recovery ISO created: ${outputIso}`))
    } catch {
      console.log(chalk.red('penguins-recovery adapter failed. Original ISO is unchanged.'))
      console.log(chalk.yellow(`You can run manually: ${cmd}`))
    }
  }

  /**
   * Shared exec helper passed to audit plugin classes.
   * Runs a shell command and returns { code, data, error }.
   */
  private makeExec(verbose: boolean) {
    return async (cmd: string, opts: { capture?: boolean; echo?: boolean } = {}) => {
      const { spawnSync } = require('node:child_process') as typeof import('node:child_process')
      if (opts.echo || verbose) console.log(chalk.dim(`$ ${cmd}`))
      const result = spawnSync('bash', ['-c', cmd], {
        stdio: opts.capture ? 'pipe' : 'inherit',
        encoding: 'utf8',
      })
      return {
        code: result.status ?? 1,
        data: (result.stdout ?? '').toString(),
        error: (result.stderr ?? '').toString(),
      }
    }
  }

  /**
   * Run the full audit pipeline on the produced ISO:
   *   1. SBOM generation via syft
   *   2. License compliance scan via grant
   *   3. Cryptographic attestation via vouch (if key provided)
   */
  private async runAudit(
    isoPath: string,
    snapshotDir: string,
    opts: {
      format: 'spdx-json' | 'cyclonedx-json' | 'syft-json' | 'spdx-tag-value'
      outputDir: string
      vouchKey?: string
      grantPolicy?: string
      failOnDeny: boolean
    },
    verbose: boolean,
  ): Promise<void> {
    // Resolve audit plugin classes.
    // In a compiled production build (dist/), plugins are pre-compiled to
    // dist/audit-plugins/plugins/ by the build:audit-plugins script.
    // In development (src/ via ts-node), fall back to the TypeScript source.
    const auditPluginsDist = path.resolve(__dirname, '../audit-plugins/plugins')
    const auditPluginsSrc  = path.resolve(__dirname, '../../integrations/penguins-eggs-audit/plugins')
    const auditBase = fs.existsSync(auditPluginsDist) ? auditPluginsDist : auditPluginsSrc

    const exec = this.makeExec(verbose)
    fs.mkdirSync(opts.outputDir, { recursive: true })

    Utils.warning('Running audit pipeline...')

    // ── 1. SBOM via syft ──────────────────────────────────────────────────
    try {
      const syftPath = path.join(auditBase, 'sbom/syft-generate/syft-generate.js')
      const { SyftGenerate } = fs.existsSync(syftPath)
        ? await import(syftPath)
        : await import(path.join(auditBase, 'sbom/syft-generate/syft-generate.ts'))

      const syft = new SyftGenerate(exec)
      if (await syft.isAvailable()) {
        Utils.warning('Generating SBOM with syft...')
        const result = await syft.generate(isoPath, { format: opts.format, outputDir: opts.outputDir })
        console.log(chalk.green(`SBOM written: ${result.sbomPath}`))

        // ── 2. License scan via grant ──────────────────────────────────────
        try {
          const grantPath = path.join(auditBase, 'sbom/grant-license/grant-license.js')
          const { GrantLicense } = fs.existsSync(grantPath)
            ? await import(grantPath)
            : await import(path.join(auditBase, 'sbom/grant-license/grant-license.ts'))

          const grant = new GrantLicense(exec)
          if (await grant.isAvailable()) {
            Utils.warning('Scanning licenses with grant...')
            if (opts.grantPolicy) {
              // use provided policy
            } else {
              grant.initPolicy(path.join(opts.outputDir, '.grant.yaml'))
              opts.grantPolicy = path.join(opts.outputDir, '.grant.yaml')
            }
            const licResult = await grant.check(result.sbomPath, {
              policyFile: opts.grantPolicy,
              failOnDeny: opts.failOnDeny,
            })
            const icon = licResult.passed ? chalk.green('✅') : chalk.yellow('⚠️')
            console.log(`${icon} License scan: ${licResult.passed ? 'passed' : 'violations found'}`)
            if (!licResult.passed && verbose) console.log(licResult.output)
          } else {
            console.log(chalk.yellow('grant not found — skipping license scan. Install: https://github.com/anchore/grant'))
          }
        } catch (err: any) {
          console.log(chalk.yellow(`License scan skipped: ${err.message}`))
        }
      } else {
        console.log(chalk.yellow('syft not found — skipping SBOM. Install: curl -sSfL https://raw.githubusercontent.com/anchore/syft/main/install.sh | sh'))
      }
    } catch (err: any) {
      console.log(chalk.yellow(`SBOM generation skipped: ${err.message}`))
    }

    // ── 3. Attestation via vouch ───────────────────────────────────────────
    if (opts.vouchKey) {
      try {
        const vouchPath = path.join(auditBase, 'security-audit/vouch-attest/vouch-attest.js')
        const { VouchAttest } = fs.existsSync(vouchPath)
          ? await import(vouchPath)
          : await import(path.join(auditBase, 'security-audit/vouch-attest/vouch-attest.ts'))

        const vouch = new VouchAttest(exec)
        if (await vouch.isAvailable()) {
          Utils.warning('Attesting ISO with vouch...')
          const attestResult = await vouch.attest(isoPath, {
            keyPath: opts.vouchKey,
            outputDir: opts.outputDir,
          })
          if (attestResult.success) {
            console.log(chalk.green(`Attestation bundle: ${attestResult.bundlePath}`))
          } else {
            console.log(chalk.yellow('Attestation failed — check vouch key and binary'))
          }
        } else {
          console.log(chalk.yellow('vouch not found — skipping attestation. Install: https://github.com/mitchellh/vouch'))
        }
      } catch (err: any) {
        console.log(chalk.yellow(`Attestation skipped: ${err.message}`))
      }
    }

    console.log(chalk.green(`Audit artefacts written to: ${opts.outputDir}`))
  }

  /**
   * Apply OS hardening scripts to the snapshot chroot via OsHardening.
   * Fetches the upstream Opsek/OSs-security scripts on first run.
   */
  private async runHardening(
    chrootPath: string,
    outputDir: string,
    verbose: boolean,
  ): Promise<void> {
    const auditPluginsDist = path.resolve(__dirname, '../audit-plugins/plugins')
    const auditPluginsSrc  = path.resolve(__dirname, '../../integrations/penguins-eggs-audit/plugins')
    const auditBase = fs.existsSync(auditPluginsDist) ? auditPluginsDist : auditPluginsSrc
    const exec = this.makeExec(verbose)

    try {
      const hardeningPath = path.join(auditBase, 'security-audit/os-hardening/os-hardening.js')
      const { OsHardening } = fs.existsSync(hardeningPath)
        ? await import(hardeningPath)
        : await import(path.join(auditBase, 'security-audit/os-hardening/os-hardening.ts'))

      const hardening = new OsHardening(exec)

      if (!hardening.scriptsAvailable('linux')) {
        Utils.warning('Fetching OS hardening scripts (first run)...')
        await hardening.fetchScripts('linux')
      }

      Utils.warning(`Applying OS hardening to chroot: ${chrootPath}`)
      const result = await hardening.applyHardening({
        chrootPath,
        targetOS: 'linux',
        dryRun: false,
      })

      if (result.applied) {
        console.log(chalk.green('OS hardening applied successfully'))
      } else {
        console.log(chalk.yellow('OS hardening completed with warnings — check output above'))
      }
      if (verbose) console.log(result.output)
    } catch (err: any) {
      console.log(chalk.yellow(`OS hardening skipped: ${err.message}`))
    }
  }

  /**
   * Export the produced system to an Incus/LXC container image via distrobuilder.
   * Delegates to the distrobuilder-hook.sh plugin script so all logic lives
   * in one place and can be used both from the CLI flag and from the plugin loader.
   */
  private async runDistrobuilder(
    isoPath: string,
    snapshotDir: string,
    type: string,
    outputDir?: string,
    verbose?: boolean,
  ): Promise<void> {
    const { spawnSync } = await import('node:child_process')

    // Locate the hook script: prefer the installed copy, fall back to the
    // integrations/ subtree inside the eggs repo.
    const hookCandidates = [
      '/usr/share/penguins-distrobuilder/integration/eggs-plugin/distrobuilder-hook.sh',
      '/usr/local/share/penguins-distrobuilder/integration/eggs-plugin/distrobuilder-hook.sh',
      path.resolve(__dirname, '../../integrations/penguins-distrobuilder/integration/eggs-plugin/distrobuilder-hook.sh'),
    ]

    let hookScript = ''
    for (const candidate of hookCandidates) {
      if (fs.existsSync(candidate)) {
        hookScript = candidate
        break
      }
    }

    if (!hookScript) {
      Utils.warning('distrobuilder hook script not found. Install penguins-distrobuilder or check integrations/penguins-distrobuilder/.')
      console.log(chalk.yellow('Expected locations:'))
      for (const c of hookCandidates) console.log(chalk.yellow(`  ${c}`))
      return
    }

    Utils.warning(`Exporting to ${type} image via distrobuilder...`)

    const env: NodeJS.ProcessEnv = {
      ...process.env,
      EGGS_HOOK: 'produce',
      EGGS_ISO_FILE: isoPath,
      EGGS_ISO_ROOT: snapshotDir,
      EGGS_WORK: snapshotDir,
      DISTROBUILDER_ENABLED: '1',
      DISTROBUILDER_TYPE: type,
    }
    if (outputDir) env['DISTROBUILDER_OUTPUT'] = outputDir

    const result = spawnSync('bash', [hookScript], {
      env,
      stdio: verbose ? 'inherit' : 'pipe',
    })

    if (result.status !== 0) {
      const stderr = result.stderr?.toString().trim() ?? ''
      console.log(chalk.red(`distrobuilder export failed (exit ${result.status})${stderr ? ': ' + stderr : ''}`))
      console.log(chalk.yellow('Check /etc/penguins-distrobuilder/eggs-hooks.conf and ensure distrobuilder is installed.'))
    } else {
      const out = outputDir ?? '/var/lib/eggs/distrobuilder'
      console.log(chalk.green(`distrobuilder: ${type} image written to ${out}`))
    }
  }

  /**
   * Publish a distrobuilder-produced image to an incus-image-server instance.
   *
   * Uses the direct-upload workflow:
   *   POST /publish/sessions                          → get/validate token
   *   POST /publish/products/:id/versions             → create version
   *   POST /publish/products/:id/versions/:vid/upload → upload rootfs + metadata
   *
   * The image files are expected in outputDir as produced by distrobuilder:
   *   incus.tar.xz   — image metadata tarball
   *   rootfs.tar.xz  — container rootfs  (containers)
   *   disk.qcow2     — VM disk image     (VMs, if present)
   */
  private async publishToIncusImageServer(
    outputDir: string,
    serverUrl?: string,
    token?: string,
    productId?: string,
    verbose?: boolean,
  ): Promise<void> {
    // Read config from /etc/penguins-distrobuilder/eggs-hooks.conf if flags not set
    const confPath = '/etc/penguins-distrobuilder/eggs-hooks.conf'
    if (fs.existsSync(confPath)) {
      const conf = fs.readFileSync(confPath, 'utf8')
      const get = (key: string) => conf.match(new RegExp(`^${key}=(.+)$`, 'm'))?.[1]?.trim()
      serverUrl  ??= get('INCUS_SERVER_URL')
      token      ??= get('INCUS_SERVER_TOKEN')
      productId  ??= get('INCUS_SERVER_PRODUCT')
    }

    if (!serverUrl) {
      Utils.warning('--publish-incus-url is required (or set INCUS_SERVER_URL in /etc/penguins-distrobuilder/eggs-hooks.conf)')
      return
    }
    if (!token) {
      Utils.warning('--publish-incus-token is required (or set INCUS_SERVER_TOKEN in /etc/penguins-distrobuilder/eggs-hooks.conf)')
      return
    }
    if (!productId) {
      Utils.warning('--publish-incus-product is required (or set INCUS_SERVER_PRODUCT in /etc/penguins-distrobuilder/eggs-hooks.conf)')
      return
    }

    const base = serverUrl.replace(/\/$/, '')
    const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' }

    Utils.warning(`Publishing to incus-image-server: ${base}`)

    // Locate image files produced by distrobuilder
    const metadataFile = path.join(outputDir, 'incus.tar.xz')
    const rootfsFile   = path.join(outputDir, 'rootfs.tar.xz')
    const diskFile     = path.join(outputDir, 'disk.qcow2')

    if (!fs.existsSync(metadataFile)) {
      Utils.warning(`incus.tar.xz not found in ${outputDir}. Run --distrobuilder first.`)
      return
    }

    try {
      const { default: https } = await import('node:https')
      const { default: http }  = await import('node:http')

      // Helper: JSON POST/GET via Node built-ins (no extra deps)
      const request = (method: string, url: string, body?: string, extraHeaders?: Record<string, string>): Promise<{ status: number; body: string }> =>
        new Promise((resolve, reject) => {
          const u = new URL(url)
          const mod = u.protocol === 'https:' ? https : http
          const req = mod.request(u, {
            method,
            headers: { ...headers, 'Content-Type': 'application/json', ...extraHeaders },
          }, (res) => {
            let data = ''
            res.on('data', (c: Buffer) => { data += c.toString() })
            res.on('end', () => resolve({ status: res.statusCode ?? 0, body: data }))
          })
          req.on('error', reject)
          if (body) req.write(body)
          req.end()
        })

      // 1. Create a new version under the product
      if (verbose) console.log(`[incus-image-server] Creating version for product ${productId}`)
      const serial = new Date().toISOString().slice(0, 16).replace(/[-T:]/g, '')
      const versionRes = await request(
        'POST',
        `${base}/publish/products/${productId}/versions`,
        JSON.stringify({ serial }),
      )
      if (versionRes.status < 200 || versionRes.status >= 300) {
        throw new Error(`Failed to create version: HTTP ${versionRes.status} — ${versionRes.body}`)
      }
      const versionId = JSON.parse(versionRes.body)?.data?.id
      if (!versionId) throw new Error(`No version ID in response: ${versionRes.body}`)
      if (verbose) console.log(`[incus-image-server] Version created: ${versionId}`)

      // 2. Upload via multipart — delegate to curl for reliable multipart handling
      const { spawnSync } = await import('node:child_process')
      const uploadUrl = `${base}/publish/products/${productId}/versions/${versionId}/upload`

      const curlArgs = [
        '-s', '-X', 'POST', uploadUrl,
        '-H', `Authorization: Bearer ${token}`,
        '-F', `metadata=@${metadataFile};type=application/x-xz`,
      ]

      if (fs.existsSync(rootfsFile)) {
        curlArgs.push('-F', `rootfs=@${rootfsFile};type=application/x-xz`)
      } else if (fs.existsSync(diskFile)) {
        curlArgs.push('-F', `kvmdisk=@${diskFile};type=application/octet-stream`)
      } else {
        Utils.warning(`No rootfs.tar.xz or disk.qcow2 found in ${outputDir}. Uploading metadata only.`)
      }

      if (verbose) console.log(`[incus-image-server] Uploading to ${uploadUrl}`)
      const uploadResult = spawnSync('curl', curlArgs, { stdio: verbose ? 'inherit' : 'pipe' })

      if (uploadResult.status !== 0) {
        const stderr = uploadResult.stderr?.toString().trim() ?? ''
        throw new Error(`Upload failed (curl exit ${uploadResult.status})${stderr ? ': ' + stderr : ''}`)
      }

      console.log(chalk.green(`incus-image-server: image published to ${base} (product=${productId} version=${versionId})`))
      console.log(chalk.green(`Clients can pull with: incus image copy images:${productId} local:`))

    } catch (err: any) {
      console.log(chalk.red(`incus-image-server publish failed: ${err.message}`))
      console.log(chalk.yellow(`Check server URL, token, and product ID. Server docs: ${serverUrl}/publish`))
    }
  }

  async run(): Promise<void> {
    Utils.titles(this.id + ' ' + this.argv)

    const { flags } = await this.parse(Produce)
    const pendrive = flags.pendrive === undefined ? null : Number(flags.pendrive)

    if (Utils.isRoot()) {
      /**
       * ADDONS dei vendors
       * Fino a 3
       */
      const addons = []
      if (flags.addons) {
        const { addons } = flags // array
        for (let addon of addons) {
          // se non viene specificato il vendor il default è eggs
          if (!addon.includes('//')) {
            addon = 'eggs/' + addon
          }

          const dirAddon = path.resolve(__dirname, `../../addons/${addon}`)
          if (!fs.existsSync(dirAddon)) {
            console.log(dirAddon)
            Utils.warning('addon: ' + chalk.white(addon) + ' not found, terminate!')
            process.exit()
          }

          const vendorAddon = addon.slice(0, Math.max(0, addon.search('/')))
          const nameAddon = addon.substring(addon.search('/') + 1, addon.length)
          if (nameAddon === 'theme') {
            flags.theme = vendorAddon
          }
        }
      }

      // links check
      const myLinks: string[] = []
      if (flags.links) {
        const { links } = flags
        for (const link_ of links) {
          if (fs.existsSync(`/usr/share/applications/${link_}.desktop`)) {
            myLinks.push(link_)
          } else {
            Utils.warning('desktop link: ' + chalk.white('/usr/share/applications/' + link_ + '.desktop') + ' not found!')
          }
        }
      }

      /**
       * composizione dei flag
       */

      // excludes
      const excludes = {} as IExcludes
      excludes.usr = true
      excludes.var = true
      excludes.static = false
      excludes.homes = false
      excludes.home = false

      if (flags.excludes) {
        if (flags.excludes.includes('static')) {
          excludes.static = true
        }

        if (flags.excludes.includes('homes')) {
          excludes.homes = true
        }

        if (flags.excludes.includes('home')) {
          excludes.home = true
        }
      }

      let prefix = ''
      if (flags.prefix !== undefined) {
        prefix = flags.prefix
      }

      let basename = '' // se vuoto viene definito da loadsetting (default nome dell'host)
      if (flags.basename !== undefined) {
        basename = flags.basename
      }

      let dtbDir = ''
      if (flags.dtbdir !== undefined) {
        dtbDir = flags.dtbdir
        if (dtbDir !== 'none' && !fs.existsSync(dtbDir)) {
          Utils.warning('dtbDir: ' + chalk.white(dtbDir) + ' not found!')
          process.exit()
        }
      }

      const compressors = new Compressors()
      await compressors.populate()

      let compression = compressors.fast()
      if (flags.max) {
        compression = compressors.max()
      } else if (flags.pendrive) {
        compression = compressors.pendrive('15')
      } else if (flags.standard) {
        compression = compressors.standard()
      }

      const { release } = flags

      const { clone } = flags

      const { homecrypt } = flags

      const { hidden } = flags

      const { fullcrypt } = flags

      const { verbose } = flags

      const scriptOnly = flags.script

      const yolkRenew = flags.yolk

      const { nointeractive } = flags

      const { noicon } = flags

      // if clone, homecrypt, fullcrypt
      const includeRootHome = flags.includeRootHome || clone || homecrypt

      let { kernel } = flags
      if (kernel === undefined) {
        kernel = ''
      }

      if (kernel !== '' && !fs.existsSync(`/usr/lib/modules/${kernel}`)) {
        let kernelModules = `/usr/lib/modules/`
        if (!fs.existsSync(kernelModules)) {
          kernelModules = `/lib/modules/`
        }

        const kernels = fs.readdirSync(kernelModules)
        console.log('modules available:')
        for (const k of kernels) {
          console.log(`- ${k}`)
        }

        console.log(`\nNo available modules for kernel version "${kernel}" in /usr/lib/modules/`)
        process.exit(1)
      }

      /**
       * theme: if not defined will use eggs
       */
      let theme = 'eggs'
      if (flags.theme !== undefined) {
        theme = flags.theme
        if (theme.includes('/')) {
          if (theme.endsWith('/')) {
            theme = theme.slice(0, Math.max(0, theme.length - 1))
          }
        } else {
          const wpath = `/home/${await Utils.getPrimaryUser()}/.wardrobe/vendors/`
          theme = wpath + flags.theme
        }

        theme = path.resolve(theme)
        if (!fs.existsSync(theme + '/theme')) {
          console.log('Cannot find theme: ' + theme)
          process.exit()
        }
      }

      /**
       * ChromiumOS flavour: install selected browser before snapshotting
       */
      const crosFlavourId = flags['cros-flavour']
      const crosBrowserRepo = flags['cros-browser-repo']
      if (crosFlavourId) {
        const distro = new Distro()
        if (distro.familyId !== 'chromiumos') {
          Utils.warning(`--cros-flavour is only supported on ChromiumOS (detected: ${distro.familyId})`)
          process.exit(1)
        }

        const { getFlavour, createCustomFlavour, installFlavour, getFlavourBranding, listDesktopFlavours } = await import('../classes/ovary.d/cros_flavour.js')

        let flavour = getFlavour(crosFlavourId)
        if (!flavour && crosFlavourId === 'custom') {
          if (!crosBrowserRepo) {
            Utils.warning('--cros-browser-repo is required when using --cros-flavour=custom')
            process.exit(1)
          }
          flavour = createCustomFlavour(crosBrowserRepo)
        }

        if (!flavour) {
          Utils.warning(`Unknown ChromiumOS flavour: ${crosFlavourId}. Available: ${listDesktopFlavours().join(', ')}`)
          process.exit(1)
        }

        Utils.warning(`ChromiumOS flavour: ${flavour.name}`)
        await installFlavour(flavour, crosBrowserRepo)

        // Apply branding to basename/prefix if not explicitly set
        const branding = getFlavourBranding(flavour)
        if (!flags.basename) {
          basename = branding.isoPrefix
        }
        if (!flags.prefix) {
          prefix = ''
        }
      }

      const i = await Config.thatWeNeed(nointeractive, verbose, homecrypt)
      if (i.needUpdate || i.configurationInstall || i.configurationRefresh || i.distroTemplate) {
        await Config.install(i, nointeractive, verbose)
      }

      const myAddons = {} as IAddons
      if (flags.addons != undefined) {
        if (flags.addons.includes('adapt')) {
          myAddons.adapt = true
        }

        if (flags.addons.includes('pve')) {
          myAddons.pve = true
        }

        if (flags.addons.includes('rsupport')) {
          myAddons.rsupport = true
        }
      }

      Utils.titles(this.id + ' ' + this.argv)
      const ovary = new Ovary()
      Utils.warning('Produce an egg...')
      if (i.calamares) {
        const message = 'this is a GUI system, calamares is available, but NOT installed\n'
        Utils.warning(message)
      }

      /**
       * se è appImage e fullcrypt esce
       */
      if (Utils.isAppImage() && fullcrypt) {
        Utils.warning('eggs produce --fullcrypt cannot be used on AppImage')
        console.log(`\nyou can try: "sudo eggs produce --homecrypt"`)
        process.exit(9)
      }

      if (!Utils.isAppImage() && fullcrypt) {
        const distro = new Distro()
        if (distro.familyId === 'debian' && (distro.codenameId === 'trixie' || distro.codenameId === 'excalibur')) {
          Utils.info('Use eggs --fullcrypt with extreme caution, and ALWAYS first try it out in a test environment.')
          Utils.sleep(3000)
        } else {
          Utils.warning(`eggs produce --fullcrypt cannot be used on ${distro.distroId}/${distro.codenameId}`)
          console.log(`\nyou can try: "sudo eggs produce --homecrypt"`)
          process.exit(9)
        }
      }

      if (await ovary.fertilization(prefix, basename, dtbDir, theme, compression, !nointeractive)) {
        // --- Integration: pre-produce hooks ---
        if (flags.snapshot) {
          try {
            const { btrfsBeforeProduce } = await import('penguins-eggs-integrations/build-infra')
            await btrfsBeforeProduce(exec, verbose)
          } catch (err: any) {
            if (verbose) Utils.warning(`BTRFS snapshot skipped: ${err.message}`)
          }
        }

        // Pre-produce: OS hardening applied to the running system BEFORE ISO assembly.
        // liveroot (work_dir.merged) is not mounted until bindLiveFs runs inside
        // ovary.produce(), so we harden '/' here — bindLiveFs will cp -r the hardened
        // /etc, /usr, etc. into the live filesystem automatically.
        if (flags.audit && flags['audit-hardening'] && !scriptOnly) {
          await this.runHardening(
            '/',
            flags['audit-output'] ?? '/var/lib/eggs/audit',
            verbose,
          )
        }

        // Run pre-produce plugins (e.g. pkm-hook.sh, pif-hook.sh embed state into ISO root).
        // EGGS_ISO_ROOT is set to '/' here because liveroot is not yet mounted — bindLiveFs
        // (inside ovary.produce) will cp -r /etc and /usr into the live filesystem, so hooks
        // that write to /etc/<tool>/ on the real system will be picked up automatically.
        await runPlugins(
          { hook: 'produce', isoRoot: '/' },
          undefined,
          verbose,
        )

        await ovary.produce(kernel, clone, homecrypt, fullcrypt, hidden, scriptOnly, yolkRenew, release, myAddons, myLinks, excludes, nointeractive, noicon, includeRootHome, verbose)
        ovary.finished(scriptOnly)

        // Post-produce: layer penguins-recovery tools onto the ISO
        if (flags.recovery && !scriptOnly) {
          await this.applyRecovery(
            ovary.settings.config.snapshot_dir + ovary.settings.isoFilename,
            flags['recovery-gui'],
            flags['recovery-rescapp'],
            verbose
          )
        }

        // --- Integration: post-produce hooks ---
        const isoPath = path.join(ovary.settings.config.snapshot_dir, ovary.settings.isoFilename)

        if (flags.snapshot) {
          try {
            const { btrfsAfterProduce } = await import('penguins-eggs-integrations/build-infra')
            const isoSize = fs.existsSync(isoPath) ? fs.statSync(isoPath).size : 0
            await btrfsAfterProduce(ovary.settings.isoFilename, isoSize, exec, verbose)
          } catch (err: any) {
            if (verbose) Utils.warning(`BTRFS snapshot skipped: ${err.message}`)
          }
        }

        if (flags.lfs) {
          try {
            const { lfsAfterProduce } = await import('penguins-eggs-integrations/distribution')
            await lfsAfterProduce(ovary.settings.isoFilename, ovary.settings.config.snapshot_dir, verbose, exec)
          } catch (err: any) {
            Utils.warning(`LFS tracking failed: ${err.message}`)
          }
        }

        if (flags.ipfs) {
          try {
            const { BrigPublisher } = await import('penguins-eggs-integrations/decentralized')
            const publisher = new BrigPublisher(exec, verbose)
            if (await publisher.isInstalled()) {
              const result = await publisher.publish(isoPath)
              console.log(`IPFS: published ${ovary.settings.isoFilename} CID=${result.cid}`)
            } else {
              Utils.warning('brig not installed, skipping IPFS publish')
            }
          } catch (err: any) {
            Utils.warning(`IPFS publish failed: ${err.message}`)
          }
        }

        // --sbom: standalone SBOM generation (subset of --audit)
        // --audit: full pipeline (SBOM + license + attestation).
        // If both are set, --audit handles SBOM so --sbom is skipped to avoid
        // running syft twice.
        if (flags.sbom && !flags.audit) {
          try {
            const { SyftGenerate } = await import('penguins-eggs-audit/sbom')
            const syft = new SyftGenerate(exec)
            if (await syft.isAvailable()) {
              const sbomDir = path.join(ovary.settings.config.snapshot_dir, 'sbom')
              const result = await syft.generate(isoPath, { outputDir: sbomDir })
              console.log(`SBOM: generated ${path.basename(result.sbomPath)}`)
              if (verbose) console.log(`SBOM: written to ${result.sbomPath}`)
            } else {
              Utils.warning('syft not installed, skipping SBOM generation (install from https://github.com/anchore/syft)')
            }
          } catch (err: any) {
            Utils.warning(`SBOM generation failed: ${err.message}`)
          }
        }

        // Post-produce audit: SBOM + license scan + attestation.
        // Covers --sbom functionality when --audit is set, so no duplication.
        if (flags.audit && !scriptOnly) {
          await this.runAudit(
            isoPath,
            ovary.settings.config.snapshot_dir,
            {
              format: (flags['audit-format'] as any) ?? 'spdx-json',
              // If --sbom and --audit both set, write to the same sbom/ dir
              // so the user gets one consistent output location.
              outputDir: flags['audit-output'] ?? (flags.sbom
                ? path.join(ovary.settings.config.snapshot_dir, 'sbom')
                : '/var/lib/eggs/audit'),
              vouchKey: flags['audit-vouch-key'],
              grantPolicy: flags['audit-grant-policy'],
              failOnDeny: flags['audit-fail-on-deny'] ?? false,
            },
            verbose,
          )
        }

        // Export to Incus/LXC via distrobuilder (also triggered by --publish-incus)
        if ((flags.distrobuilder || flags['publish-incus']) && !scriptOnly) {
          await this.runDistrobuilder(
            isoPath,
            ovary.settings.config.snapshot_dir,
            flags['distrobuilder-type'] ?? 'incus',
            flags['distrobuilder-output'],
            verbose,
          )
        }

        // Publish distrobuilder image to incus-image-server
        if (flags['publish-incus'] && !scriptOnly) {
          await this.publishToIncusImageServer(
            flags['distrobuilder-output'] ?? '/var/lib/eggs/distrobuilder',
            flags['publish-incus-url'],
            flags['publish-incus-token'],
            flags['publish-incus-product'],
            verbose,
          )
        }

        // Run post-produce plugins with the final ISO path available
        if (!scriptOnly) {
          await runPlugins(
            {
              hook: 'produce',
              // Post-produce: liveroot overlay is unbound but the directory tree
              // remains accessible for inspection. isoFile is the primary output.
              isoRoot: ovary.settings.work_dir.merged,
              isoFile: isoPath,
              workDir: ovary.settings.config.snapshot_dir,
              // Pass distrobuilder config so the plugin hook respects CLI flags
              distrobuilder_enabled: flags.distrobuilder ? '1' : '0',
              distrobuilder_type: flags['distrobuilder-type'] ?? 'incus',
              distrobuilder_output: flags['distrobuilder-output'] ?? '',
            },
            undefined,
            verbose,
          )
        }
      }
    } else {
      Utils.useRoot(this.id)
    }
  }
}
