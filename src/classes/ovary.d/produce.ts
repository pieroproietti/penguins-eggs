/**
 * ./src/classes/ovary.d/produce.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import chalk from 'chalk'
import e from 'express'
import mustache from 'mustache'
// packages
import fs, { Dirent } from 'node:fs'
import path from 'path'

// interfaces
import { IAddons, IExcludes } from '../../interfaces/index.js'
import { shx } from '../../lib/utils.js'
// libraries
import { exec } from '../../lib/utils.js'
import Bleach from './../bleach.js'
import Diversions from './../diversions.js'
import Incubator from './../incubation/incubator.js'
import Ovary from './../ovary.js'
import Pacman from './../pacman.js'
// classes
import Utils from './../utils.js'
import Repo from './../yolk.js'
import { CryptoConfig } from './luks-interactive-crypto-config.js'

// _dirname
const __dirname = path.dirname(new URL(import.meta.url).pathname)

/**
 * produce
 * @param clone
 * @param homecrypt
 * @param scriptOnly
 * @param yolkRenew
 * @param release
 * @param myAddons
 * @param nointeractive
 * @param noicons
 * @param includeRootHome
 * @param verbose
 */
export async function produce(
  this: Ovary,
  kernel = '',
  clone = false,
  homecrypt = false,
  fullcrypt = false,
  hidden = false,
  scriptOnly = false,
  yolkRenew = false,
  release = false,
  myAddons: IAddons,
  myLinks: string[],
  excludes: IExcludes,
  nointeractive = false,
  noicons = false,
  includeRootHome = false,
  verbose = false
) {
  this.verbose = verbose
  this.echo = Utils.setEcho(verbose)
  if (this.verbose) {
    this.toNull = ' > /dev/null 2>&1'
  }

  this.kernel = kernel
  this.liveRoot = this.settings.work_dir.merged
  this.dotOverlay = this.settings.work_dir

  this.clone = clone
  this.homecrypt = homecrypt
  this.fullcrypt = fullcrypt
  this.hidden = hidden

  // Crittografia
  if (this.homecrypt || this.fullcrypt) {
    if (this.homecrypt) {
      this.luksMappedName = 'home.img'
    } else if (this.fullcrypt) {
      this.luksMappedName = 'root.img'
    }

    this.luksFile = `/var/tmp/${this.luksMappedName}`
    this.luksMappedName = this.luksMappedName
    this.luksMountpoint = `/tmp/mnt/${this.luksMappedName}`
    this.luksDevice = `/dev/mapper/${this.luksMappedName}`
    this.luksPassword = '0' // USARE UNA PASSWORD SICURA IN PRODUZIONE!

    this.luksConfig = await this.interactiveCryptoConfig()

    Utils.warning('You choose an encrypted eggs')
    await this.luksGetPassword()
  }

  /**
   * ChromiumOS: detect read-only rootfs and set up overlay if needed.
   * On dm-verity-protected ChromeOS, the rootfs is read-only.
   * We use the overlayroot pattern: accept the read-only rootfs,
   * use tmpfs for eggs' temp files, and snapshot the lower rootfs.
   */
  if (this.familyId === 'chromiumos') {
    const { isRootReadOnly, isRootVerityProtected, isOverlayActive, getSnapshotRootPath, setupOverlayForProduce } = await import('./cros_verity.js')

    if (isRootReadOnly()) {
      Utils.warning('Read-only rootfs detected (dm-verity protected)')

      if (isRootVerityProtected()) {
        Utils.warning('dm-verity is active on root partition')
      }

      if (isOverlayActive()) {
        Utils.warning('Overlayfs already active -- snapshotting lower (verified) rootfs')
      }

      // Set up tmpfs overlay for eggs work files if needed
      const overlayWorkDir = '/tmp/eggs-overlay-work'
      const overlay = await setupOverlayForProduce(overlayWorkDir, this.echo)
      if (overlay.overlayMounted) {
        Utils.warning(`Overlay mounted: upper=${overlay.upperDir}`)
      }

      // Use the real (lower) rootfs for snapshotting, not the overlay
      const snapshotRoot = getSnapshotRootPath()
      if (snapshotRoot !== '/') {
        Utils.warning(`Snapshot root: ${snapshotRoot} (lower rootfs)`)
        // The liveRoot for squashfs creation should use the real rootfs
        this.liveRoot = snapshotRoot
      }
    }
  }

  /**
   * define kernel
   */
  if (this.kernel === '') {
    if (this.familyId === 'alpine') {
      const moduleDirs = fs.readdirSync('/lib/modules')
      this.kernel = moduleDirs[0]
    } else if (this.familyId === 'archlinux') {
      // arch, manjaro
      const moduleDirs = fs.readdirSync('/usr/lib/modules')
      this.kernel = moduleDirs[0]
    } else {
      // debian, fedora, openmamba, opensuse, voidlinux
      const vmlinuz = path.basename(Utils.vmlinuz())
      this.kernel = vmlinuz.slice(Math.max(0, vmlinuz.indexOf('-') + 1))
    }
  }

  /**
   * define vmlinuz and initrd fullpath
   */
  this.vmlinuz = Utils.vmlinuz()
  this.initrd = Utils.initrdImg(this.kernel)

  /**
   * yolk
   */
  if (this.familyId === 'debian' && Utils.uefiArch() === 'amd64') {
    const yolk = new Repo()
    if (!yolk.exists()) {
      Utils.warning('creating yolk')
      await yolk.create(verbose)
    } else if (yolkRenew) {
      Utils.warning('refreshing yolk')
      await yolk.erase()
      await yolk.create(verbose)
    } else {
      Utils.warning('using preesixent yolk')
    }
  }

  if (!fs.existsSync(this.settings.config.snapshot_dir)) {
    shx.mkdir('-p', this.settings.config.snapshot_dir)
  }

  if (Utils.isLive()) {
    console.log(chalk.red('>>> eggs: This is a live system! An egg cannot be produced from an egg!'))
  } else {
    await this.liveCreateStructure()

    // Carica calamares solo se le icone sono accettate
    if (
      !noicons && // se VOGLIO le icone
      !nointeractive &&
      this.settings.distro.isCalamaresAvailable &&
      Pacman.isInstalledGui() &&
      this.settings.config.force_installer &&
      !Pacman.calamaresExists()
    ) {
      console.log('Installing ' + chalk.bgGray('calamares') + ' due force_installer=yes.')
      await Pacman.calamaresInstall(verbose)
      const bleach = new Bleach()
      await bleach.clean(verbose)
    }

    /**
     * homecrypt/fullcrypt/clone/standard
     */
    if (this.homecrypt) {
      Utils.warning("eggs will SAVE users and users' data ENCRYPTED on the live (ISO)/live/home.img")
    } else if (this.fullcrypt) {
      Utils.warning('eggs will SAVE full system ENCRYPTED on the live (ISO)/live/root.img')
    } else if (this.clone) {
      this.settings.config.user_opt = 'live' // patch for humans
      this.settings.config.user_opt_passwd = 'evolution'
      this.settings.config.root_passwd = 'evolution'
      Utils.warning("eggs will SAVE users and users' data on CLEAR on the live (ISO)/live/filesystem.squashfs")
    } else {
      Utils.warning("eggs will REMOVE users and users' data from live")
    }

    /**
     * exclude.list
     */
    if (!excludes.static && !fs.existsSync('/etc/penguins-eggs/exclude.list')) {
      const excludeListTemplateDir = '/etc/penguins-eggs.d/exclude.list.d/'
      const excludeListTemplate = excludeListTemplateDir + 'master.list'
      if (!fs.existsSync(excludeListTemplate)) {
        Utils.warning('Cannot find: ' + excludeListTemplate)
        process.exit(1)
      }

      let excludeUsr = ''
      let excludeVar = ''
      let excludeHomes = ''
      let excludeHome = ''

      if (excludes.usr) {
        excludeUsr = fs.readFileSync(`${excludeListTemplateDir}usr.list`, 'utf8')
      }

      if (excludes.var) {
        excludeVar = fs.readFileSync(`${excludeListTemplateDir}var.list`, 'utf8')
      }

      if (excludes.homes) {
        excludeHomes = fs.readFileSync(`${excludeListTemplateDir}homes.list`, 'utf8')
      }

      if (excludes.home) {
        excludeHome = `home/${await Utils.getPrimaryUser()}/*`
      }

      const view = {
        home_list: excludeHome,
        homes_list: excludeHomes,
        usr_list: excludeUsr,
        var_list: excludeVar
      }
      const template = fs.readFileSync(excludeListTemplate, 'utf8')
      fs.writeFileSync(this.settings.config.snapshot_excludes, mustache.render(template, view))
    }

    /**
     * NOTE: reCreate = false
     *
     * reCreate = false is just for develop
     * put reCreate = true in release
     */
    const reCreate = true
    let mksquashfsCmd = ''
    let mkIsofsCmd = ''
    let mkImgCmd = ''
    if (reCreate) {
      // start pre-clone

      /**
       * installer
       */
      this.incubator = new Incubator(this.settings.remix, this.settings.distro, this.settings.config.user_opt, this.theme, this.clone || this.fullcrypt || this.homecrypt, verbose)

      await this.incubator.config(release)

      // 5 secondi di sleep
      await Utils.sleep(5000)

      await this.bindLiveFs()
      await this.bindVfs()

      /**
       * kernelCopy
       */
      await this.kernelCopy()

      /**
       * initrd creation
       */
      if (fullcrypt) {
        await this.luksRootInitrd()
      } else
        switch (this.familyId) {
          case 'alpine': {
            await this.initrdAlpine()

            break
          }

          case 'archlinux': {
            await this.initrdArch()

            break
          }

          case 'debian': {
            await this.initrdDebian()

            break
          }

          case 'chromiumos':
          case 'fedora':
          case 'gentoo':
          case 'openmamba':
          case 'opensuse':
          case 'voidlinux': {
            await this.initrdDracut()

            break
          }
          // No default
        }

      // We don't need more
      await this.ubindVfs()

      // mistero della Fede
      await this.editLiveFs()

      /**
       * Autologin solo se per non clone
       */
      if (!(this.clone || this.homecrypt || this.fullcrypt)) {
        await this.usersRemove()
        await this.userCreateLive()
        if (Pacman.isInstalledGui()) {
          // add GUI autologin
          await this.createXdgAutostart(this.settings.config.theme, myAddons, myLinks, noicons)
        } else {
          // add cli-autologin
          this.cliAutologin.add(this.settings.distro.distroId, this.settings.distro.codenameId, this.settings.config.user_opt, this.settings.config.user_opt_passwd, this.settings.config.root_passwd, this.settings.work_dir.merged)
        }
      }

      /**
       * configurazione homecrypt
       */
      if (this.homecrypt) {
        // Occorre forzare il login CLI
        if (Utils.isSystemd()) {
          const systemdDir = `${this.settings.work_dir.merged}/etc/systemd/system`

          // remove eventuali autologin
          if (fs.existsSync(`${systemdDir}/getty@tty1.service.d`)) {
            await exec(`rm -rf ${systemdDir}/getty@tty1.service.d/*`)
          } else {
            await exec(`mkdir -p ${systemdDir}/getty@tty1.service.d`)
          }

          let content = ``
          content += `[Service]\n`
          content += `ExecStart=\n`
          content += `ExecStart=-/sbin/agetty -o '-p -- \\u' --noclear %I \$TERM\n`
          fs.writeFileSync(`${systemdDir}/getty@tty1.service.d/no-autologin.conf`, content)
        } else if (Utils.isSysvinit()) {
          const inittabPath = `${this.settings.work_dir.merged}/etc/inittab`

          if (fs.existsSync(inittabPath)) {
            // Non funziona per Devuan
            let content = fs.readFileSync(inittabPath, 'utf8')

            // La riga standard per Devuan/Debian SysVinit.
            // 1: ID
            // 2345: Runlevels in cui attivarlo (Nota che il tuo boot è in runlevel 2)
            // respawn: Riavvia getty se muore
            // /sbin/getty 38400 tty1: Il comando
            const tty1Line = '1:2345:respawn:/sbin/agetty --noclear tty1 linux'

            // Rimuoviamo vecchie definizioni di tty1 (anche se commentate o diverse)
            // Cerca righe che iniziano con "1:"
            const regex = /^1:.*$/gm

            if (regex.test(content)) {
              // Sostituisce la riga esistente
              content = content.replaceAll(regex, tty1Line)
              console.log('Fixed tty1 in inittab (replaced)')
            } else {
              // Se non c'è, la aggiunge in fondo (dopo i commenti iniziali)
              content += `\n${tty1Line}\n`
              console.log('Fixed tty1 in inittab (appended)')
            }

            // FIX CRITICO PER --cryptedhome / LIVE:
            // A volte le live commentano tutte le tty per usare i propri hook.
            // Assicurati che non ci siano altre righe strane che confliggono.

            fs.writeFileSync(inittabPath, content)
          }
        }

        /**
         * homecrypt: installa il supporto
         */
        const squashfsRoot = this.settings.work_dir.merged
        const homeImgPath = this.distroLiveMediumPath + 'live/home.img'
        this.installHomecryptSupport(squashfsRoot, homeImgPath)
      }


      mksquashfsCmd = await this.makeSquashfs(scriptOnly, includeRootHome)

      /**
       * ChromiumOS: generate dm-verity hash tree for the squashfs.
       * This creates filesystem.squashfs.verity alongside the squashfs
       * and records the root hash for embedding in the kernel cmdline.
       * The live ISO will boot with verified integrity (same model as ChromeOS).
       */
      if (this.familyId === 'chromiumos' && !scriptOnly) {
        const { generateVerityHashTree, hasVeritysetup, buildVerityCmdline } = await import('./cros_verity.js')
        const { installAllVerityModules } = await import('./dracut_verity_module.js')

        const squashfsFile = path.join(this.settings.iso_work, 'live', 'filesystem.squashfs')
        if (hasVeritysetup() && fs.existsSync(squashfsFile)) {
          try {
            // Generate verity hash tree
            const verity = await generateVerityHashTree(squashfsFile, this.echo)

            // Save root hash for later use in kernel cmdline and CrOS image
            const hashFile = path.join(this.settings.iso_work, 'live', 'verity.roothash')
            fs.writeFileSync(hashFile, verity.rootHash)

            // Install dracut verity modules so initramfs can verify at boot
            await installAllVerityModules(this.echo)

            Utils.warning(`dm-verity enabled: root hash saved to ${hashFile}`)
          } catch (error) {
            Utils.warning(`dm-verity hash generation failed (non-fatal): ${error}`)
          }
        }
      }

      mkIsofsCmd = (await this.xorrisoCommand(clone, homecrypt, fullcrypt)).replaceAll(/\s\s+/g, ' ')
      this.makeDotDisk(this.volid, mksquashfsCmd, mkIsofsCmd)
      if (this.dtbDir !== '') {
        mkImgCmd = await this.makeImg()
        if (!scriptOnly) {
          Utils.warning(mkImgCmd)
          await exec(mkImgCmd)
        }
      }

      await this.uBindLiveFs() // we don't need more
    }

    /**
     * we now work just on ISO and filesystem.squashfs
     */
    if (homecrypt) {
      await this.luksHome()
    } else if (fullcrypt) {
      await this.luksRoot()
    }

    /**
     * makeEfi and syslinux was moved
     * after luksRoot
     * to get luks.uuid
     */
    if (this.settings.config.make_efi) {
      await this.makeEfi(this.theme)
    }

    // need syslinux?
    const { arch } = process
    if (arch === 'ia32' || arch === 'x64') {
      await this.syslinux(this.theme)
    }


    /**
     * AntiX/MX LINUX
     */
    if (fs.existsSync('/etc/antix-version')) {
      let uname = (await exec('uname -r', { capture: true })).data
      uname = uname.replaceAll('\n', '')

      let content = ''
      content = '#!/usr/bin/env bash'
      content += 'mkdir /live/bin -p\n'
      content += '## \n'
      content += '# cp /usr/lib/penguins-eggs/scripts/non-live-cmdline /live/bin -p\n'
      content += '# chmod +x /live/bin/non-live-cmdline\n'
      content += '## \n'
      content += 'mkdir /live/boot-dev/antiX -p\n'
      content += 'ln -s /run/live/medium/live/filesystem.squashfs /live/boot-dev/antiX/linuxfs\n'
      content += `ln -s /run/live/medium/live/initrd.img-${uname} /live/boot-dev/antiX/initrd.gz\n`
      content += `ln -s /run/live/medium/live/vmlinuz-${uname} /live/boot-dev/antiX/vmlinuz\n`
      content += `# md5sum /live/boot-dev/antiX/linuxfs > /live/boot-dev/antiX/linuxfs.md5\n`
      content += `# md5sum /live/boot-dev/antiX/initrd.gz > /live/boot-dev/antiX/initrd.gz.md5\n`
      content += `# md5sum /live/boot-dev/antiX/vmlinuz > /live/boot-dev/antiX/vmlinuz.md5\n`
      content += `# /live/aufs -> /run/live/rootfs/filesystem.squashfs\n`
      content += 'ln -s /run/live/rootfs/filesystem.squashfs /live/aufs\n'
      content += `# use: minstall -no-media-check\n`
      content += 'minstall --no-media-check\n'
      const file = `${this.settings.iso_work}antix-mx-installer`
      fs.writeFileSync(file, content)
      await exec(`chmod +x ${file}`)
    }

    /**
     * patch to emulate miso/archiso on archilinux family
     */
    if (this.familyId === 'archlinux') {
      let filesystemName = `arch/x86_64/airootfs.sfs`
      let hashCmd = 'sha512sum'
      let hashExt = '.sha512'
      if (Diversions.isManjaroBased(this.settings.distro.distroId)) {
        filesystemName = `manjaro/x86_64/livefs.sfs`
        hashCmd = `md5sum`
        hashExt = '.md5'
      }

      await exec(`mkdir ${path.join(this.settings.iso_work, path.dirname(filesystemName))} -p`, this.echo)
      await exec(`ln ${path.join(this.settings.iso_work, 'live/filesystem.squashfs')} ${path.join(this.settings.iso_work, filesystemName)}`, this.echo)

      /**
       * patch 4 mksquashfs
       */
      const fname = `${this.settings.work_dir.bin}mksquashfs`
      let content = fs.readFileSync(fname, 'utf8')
      const patched = '# Arch and Manjaro based distro need this link'
      // not need check, is always clean here... but OK
      if (!content.includes(patched)) {
        content += patched + '\n'
        content += `if [ ! -e "${filesystemName}" ]; then\n`
        content += `   ln ${this.settings.iso_work}live/filesystem.squashfs ${this.settings.iso_work}${filesystemName}\n`
        content += `fi\n`
        fs.writeFileSync(fname, content, 'utf8')
      }
    }

    if (this.dtbDir === '') {
      await this.makeIso(mkIsofsCmd, scriptOnly)
    }

    /**
     * ChromiumOS: optionally produce a CrOS-compatible disk image
     * alongside the standard ISO. The CrOS image can be dd'd to USB
     * and booted via depthcharge on Chromebooks.
     *
     * Requires: cgpt, futility (from vboot-utils)
     * Optional: submarine .kpart (for depthcharge boot without custom firmware)
     */
    if (this.familyId === 'chromiumos' && Utils.commandExists('cgpt')) {
      const { createCrosImage, hasFutility } = await import('./cros_image.js')
      const { createSubmarineImage, isSubmarineAvailable } = await import('./submarine_boot.js')

      const squashfsPath = path.join(this.settings.iso_work, 'live', 'filesystem.squashfs')
      const isoDir = this.settings.config.snapshot_dir
      const baseName = path.basename(this.settings.isoFilename, '.iso')
      const arch = process.arch === 'arm64' ? 'arm64' as const : 'x86_64' as const

      if (fs.existsSync(squashfsPath)) {
        // Build kernel cmdline, including verity root hash if available
        const hashFile = path.join(this.settings.iso_work, 'live', 'verity.roothash')
        let cmdline = `root=live:LABEL=ROOT-A rd.live.image rd.live.dir=/live rd.live.squashimg=filesystem.squashfs cros_debug`
        if (fs.existsSync(hashFile)) {
          const rootHash = fs.readFileSync(hashFile, 'utf8').trim()
          cmdline += ` verity.usr=LABEL=ROOT-A verity.usrhash=${rootHash}`
          cmdline += ` verity_squash_root_hash=${rootHash} verity_squash_root_slot=a`
        }

        // Submarine boot image (preferred -- works without custom firmware)
        if (isSubmarineAvailable(arch) || Utils.commandExists('curl')) {
          try {
            const submarineImg = path.join(isoDir, `${baseName}-submarine.bin`)
            Utils.warning('Producing submarine boot image for Chromebook depthcharge...')
            await createSubmarineImage({
              arch,
              vmlinuz: Utils.vmlinuz(),
              initramfs: path.join(this.settings.iso_work, 'live', 'initrd.img'),
              cmdline,
              squashfs: squashfsPath,
              outputImage: submarineImg,
              verbose: this.verbose,
            })
          } catch (error) {
            Utils.warning(`Submarine image creation failed (non-fatal): ${error}`)
          }
        }

        // Direct signed kernel image (alternative -- requires dev mode)
        if (hasFutility()) {
          try {
            const crosImg = path.join(isoDir, `${baseName}-cros.bin`)
            Utils.warning('Producing CrOS signed kernel image...')
            await createCrosImage({
              vmlinuz: Utils.vmlinuz(),
              cmdline,
              squashfs: squashfsPath,
              outputImage: crosImg,
              arch,
              verbose: this.verbose,
            })
          } catch (error) {
            Utils.warning(`CrOS image creation failed (non-fatal): ${error}`)
          }
        }
      }
    }
  }
}
