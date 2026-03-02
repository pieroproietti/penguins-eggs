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
    'sudo eggs produce --cros-flavour=custom --cros-browser-repo=https://github.com/user/fork  # custom browser'
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
      }
    } else {
      Utils.useRoot(this.id)
    }
  }
}
