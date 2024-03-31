/**
 * penguins-eggs
 * class: ovary.ts
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

// packages
import fs from 'fs'
import yaml from 'js-yaml'
import path from 'node:path'
import os from 'node:os'
import shx from 'shelljs'
import chalk from 'chalk'
import mustache from 'mustache'
import PveLive from './pve-live'

// interfaces
import { IAddons, IFilters } from '../interfaces/index'

// libraries
import { exec } from '../lib/utils'

// classes
import Utils from './utils'
import N8 from './n8'
import Incubator from './incubation/incubator'
import Xdg from './xdg'
import Pacman from './pacman'
import Settings from './settings'
import Systemctl from './systemctl'
import Bleach from './bleach'
import Repo from './yolk'
import { displaymanager } from './incubation/fisherman-helper/displaymanager'

// backup
import { access } from 'fs/promises'
import { constants } from 'fs'
import Users from './users'
import CliAutologin from '../lib/cli-autologin'

/**
 * Ovary:
 */
export default class Ovary {
  verbose = false

  echo = {}

  toNull = ''

  incubator = {} as Incubator

  settings = {} as Settings

  familyId = ''

  snapshot_prefix = ''

  snapshot_basename = ''

  compression = ''

  theme = ''

  clone = false

  cryptedclone = false

  cryptedcloneSize = '2G'

  cliAutologin = new CliAutologin()

  nest = ''

  /**
   * @returns {boolean} success
   */
  async fertilization(snapshot_prefix = '', snapshot_basename = '', theme = '', compression = '', nointeratctive = false): Promise<boolean> {
    this.settings = new Settings()

    if (await this.settings.load()) {
      this.familyId = this.settings.distro.familyId
      this.nest = this.settings.config.snapshot_mnt

      if (snapshot_prefix !== '') {
        this.settings.config.snapshot_prefix = snapshot_prefix
      }

      if (snapshot_basename !== '') {
        this.settings.config.snapshot_basename = snapshot_basename
      }

      if (theme !== '') {
        this.theme = theme
      }

      if (compression !== '') {
        this.settings.config.compression = compression
      }

      if (!nointeratctive) {
        return true
      }

      this.settings.listFreeSpace()
      if (await Utils.customConfirm('Select yes to continue...')) {
        return true
      }
    }

    return false
  }

  /**
   * produce
   * @param clone 
   * @param cryptedclone 
   * @param scriptOnly 
   * @param yolkRenew 
   * @param release 
   * @param myAddons 
   * @param nointeractive 
   * @param noicons 
   * @param unsecure 
   * @param verbose 
   */
  async produce(
    clone = false,
    cryptedclone = false,
    criptedcloneSize="2G",
    scriptOnly = false,
    yolkRenew = false,
    release = false,
    myAddons: IAddons,
    myLinks: string[],
    filters: IFilters,
    nointeractive = false,
    noicons = false,
    unsecure = false,
    verbose = false) {

    this.verbose = verbose
    this.echo = Utils.setEcho(verbose)
    if (this.verbose) {
      this.toNull = ' > /dev/null 2>&1'
    }

    this.clone = clone

    this.cryptedclone = cryptedclone

    this.cryptedcloneSize = criptedcloneSize

    const luksName = 'luks-volume'

    const luksFile = `/tmp/${luksName}`

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

    await this.settings.loadRemix(this.snapshot_basename, this.theme)

    if (Utils.isLive()) {
      console.log(chalk.red('>>> eggs: This is a live system! An egg cannot be produced from an egg!'))
    } else {
      await this.liveCreateStructure()

      // Carica calamares sono se le icone sono accettate
      if (!noicons) { // se VOGLIO le icone
        if (!nointeractive && this.settings.distro.isCalamaresAvailable && (Pacman.isInstalledGui()) &&
          this.settings.config.force_installer && !(Pacman.calamaresExists())) {
          console.log('Installing ' + chalk.bgGray('calamares') + ' due force_installer=yes.')
          await Pacman.calamaresInstall(verbose)
          const bleach = new Bleach()
          await bleach.clean(verbose)
        }
      }

      if (cryptedclone) {
      /**
       * cryptedclone
       */
      console.log('eggs will SAVE users and users\' data ENCRYPTED')
        /*
        const users = await this.usersFill()
        for (const user of users) {
          if (user.saveIt) {
            let utype = 'user   '
            if (Number.parseInt(user.uid) < 1000) {
              utype = 'service'
            }
            //console.log(`- ${utype}: ${user.login.padEnd(16)} \thome: ${user.home}`)
            if (user.login !== 'root') {
              this.addRemoveExclusion(true, user.home)
            }
          }
        }
        */

      } else if (this.clone) {
        /**
         * clone
         * 
         * users tend to set user_opt as 
         * real user when create a clone,
         * this is WRONG here we correct 
         */
        this.settings.config.user_opt = 'live' // patch for humans 
        this.settings.config.user_opt_passwd = 'evolution'
        this.settings.config.root_passwd = 'evolution'
        Utils.warning('eggs will SAVE users and users\' data UNCRYPTED on the live')

      } else {
        /**
         * normal
         */
        Utils.warning('eggs will REMOVE users and users\' data from live')
      }

      /**
       * exclude.list
       */
      let excludeListTemplateDir = '/etc/penguins-eggs.d/exclude.list.d/'
      let excludeListTemplate = excludeListTemplateDir + 'master.list'
      if (!fs.existsSync(excludeListTemplate)) {
        Utils.warning('Cannot find: ' + excludeListTemplate)
        process.exit(1)
      }
      let excludeCustom = ''
      let excludeClone = ''
      let excludeDevHome = ''
      let excludeUsr = ''
      if (filters.custom) {
        excludeCustom = fs.readFileSync(`${excludeListTemplateDir}custom.list`, 'utf8')
      }
      if (filters.custom) {
        excludeClone = fs.readFileSync(`${excludeListTemplateDir}clone.list`, 'utf8')
      }

      if (filters.dev) {
        excludeDevHome = `home/${await Utils.getPrimaryUser()}/*`
      }
      if (filters.usr) {
        excludeUsr = fs.readFileSync(`${excludeListTemplateDir}usr.list`, 'utf8')
      }
      let view = {
        custom_list: excludeCustom,
        clone_list: excludeClone,
        dev_home_list: excludeDevHome,
        usr_list: excludeUsr
      }
      const template = fs.readFileSync(excludeListTemplate, 'utf8')
      fs.writeFileSync(this.settings.config.snapshot_excludes, mustache.render(template, view))


      /**
       * NOTE: reCreate = false
       *
       * reCreate = false is just for develop
       * put reCreate = true in release
       */
      const reCreate = true
      let mksquashfsCmd = ''
      if (reCreate) { // start pre-clone
        /**
         * installer
         */
        this.incubator = new Incubator(this.settings.remix, this.settings.distro, this.settings.config.user_opt, this.theme, this.clone, verbose)
        await this.incubator.config(release)

        await this.syslinux()
        await this.isolinux(this.theme)
        await this.kernelCopy()
        /**
         * we need different behaviour on
         * initrd for different familis
         */
        if (this.familyId === 'debian') {
          await this.initrdDebian()
        } else if (this.familyId === 'archlinux') {
          await this.initrdArch()
        }

        if (this.settings.config.make_efi) {
          await this.makeEfi(this.theme)
        }

        await this.bindLiveFs()
        await this.copyBoot()

        if (!this.clone) {
          /**
           * ANCHE per cryptedclone
           */
          await this.cleanUsersAccounts()
          await this.createUserLive()
          if (Pacman.isInstalledGui()) {
            await this.createXdgAutostart(this.settings.config.theme, myAddons, myLinks, noicons)

            /**
             * GUI installed but NOT Desktop Manager: just create motd and issue
             */
            if (displaymanager() === '') {
              this.cliAutologin.addIssue(this.settings.distro.distroId, this.settings.distro.codenameId, this.settings.config.user_opt, this.settings.config.user_opt_passwd, this.settings.config.root_passwd, this.settings.work_dir.merged)
              this.cliAutologin.addMotd(this.settings.distro.distroId, this.settings.distro.codenameId, this.settings.config.user_opt, this.settings.config.user_opt_passwd, this.settings.config.root_passwd, this.settings.work_dir.merged)
            }
          } else {
            this.cliAutologin.addAutologin(this.settings.distro.distroId, this.settings.distro.codenameId, this.settings.config.user_opt, this.settings.config.user_opt_passwd, this.settings.config.root_passwd, this.settings.work_dir.merged)
          }

          // Here we are forcing alwats cliAutologin
          this.cliAutologin.addAutologin(this.settings.distro.distroId, this.settings.distro.codenameId, this.settings.config.user_opt, this.settings.config.user_opt_passwd, this.settings.config.root_passwd, this.settings.work_dir.merged)
        }

        await this.editLiveFs(clone, cryptedclone)
        mksquashfsCmd = await this.makeSquashfs(scriptOnly, unsecure)
        await this.uBindLiveFs() // Lo smonto prima della fase di backup
      }

      if (cryptedclone) {
        let synctoCmd = `eggs syncto  -f ${luksFile} -s ${this.cryptedcloneSize}`
        if (filters.clone) {
         synctoCmd += ' --exclusion' // from Marco
        }
        await exec(synctoCmd, Utils.setEcho(true))
        Utils.warning(`Waiting 3s, before to copy ${luksFile} in ${this.nest}iso/live`)
        await exec('sleep 3', Utils.setEcho(false))
        Utils.warning(`copyng ${luksFile} in ${this.nest}iso/live`)
        await exec(`cp ${luksFile} ${this.nest}iso/live`, this.echo)
      }

      const mkIsofsCmd = this.xorrisoCommand(clone, cryptedclone).replace(/\s\s+/g, ' ')
      const info = Utils.getVolid(this.settings.remix.name)
      this.makeDotDisk(info, mksquashfsCmd, mkIsofsCmd)

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
        let file = `${this.settings.iso_work}antix-mx-installer`
        fs.writeFileSync(file, content)
        await exec(`chmod +x ${file}`)
      }

      /**
       * patch to emulate miso/archiso on archilinux family
       */
      if (this.familyId === 'archlinux') {
        let pathName = `arch/x86_64/airootfs`
        let hashCmd = 'sha512sum'
        let hashExt = '.sha512'
        if (isMiso(this.settings.distro.distroId)) {
          pathName = `manjaro/x86_64/livefs`
          hashCmd = `md5sum`
          hashExt = '.md5'
        }
        await exec(`mkdir ${this.settings.iso_work}${pathName}/x86_64 -p`, this.echo)
        fs.linkSync(`${this.settings.iso_work}live/filesystem.squashfs`, `${this.settings.iso_work}${pathName}.sfs`)
      }
      await this.makeIso(mkIsofsCmd, scriptOnly)
    }
  }

  /**
   * Crea la struttura della workdir
   */
  async liveCreateStructure() {
    if (this.verbose) {
      console.log('Ovary: liveCreateStructure')
    }

    Utils.warning(`creating egg in ${this.settings.config.snapshot_dir}`)

    let cmd
    if (!fs.existsSync(this.settings.config.snapshot_dir)) {
      cmd = `mkdir -p ${this.settings.config.snapshot_dir}`
      this.tryCatch(cmd)
    }

    if (!fs.existsSync(this.settings.config.snapshot_dir + '/README.md')) {
      cmd = `cp ${path.resolve(__dirname, '../../conf/README.md')} ${this.settings.config.snapshot_dir}README.md`
      this.tryCatch(cmd)
    }

    // Ovarium 
    if (!fs.existsSync(this.settings.work_dir.ovarium)) {
      cmd = `mkdir -p ${this.settings.work_dir.ovarium}`
      this.tryCatch(cmd)
    }

    if (!fs.existsSync(this.settings.work_dir.lowerdir)) {
      cmd = `mkdir -p ${this.settings.work_dir.lowerdir}`
      this.tryCatch(cmd)
    }

    if (!fs.existsSync(this.settings.work_dir.upperdir)) {
      cmd = `mkdir -p ${this.settings.work_dir.upperdir}`
      this.tryCatch(cmd)
    }

    if (!fs.existsSync(this.settings.work_dir.workdir)) {
      cmd = `mkdir -p ${this.settings.work_dir.workdir}`
      this.tryCatch(cmd)
    }

    if (!fs.existsSync(this.settings.work_dir.merged)) {
      cmd = `mkdir -p ${this.settings.work_dir.merged}`
      this.tryCatch(cmd)
    }

    /**
     * Creo le directory di destinazione per boot, efi, isolinux e live
     */
    if (!fs.existsSync(this.settings.iso_work)) {
      cmd = `mkdir -p ${this.settings.iso_work}boot/grub/${Utils.uefiFormat()}`
      this.tryCatch(cmd)

      cmd = `mkdir -p ${this.settings.iso_work}efi/boot`
      this.tryCatch(cmd)

      cmd = `mkdir -p ${this.settings.iso_work}isolinux`
      this.tryCatch(cmd)

      cmd = `mkdir -p ${this.settings.iso_work}live`
      this.tryCatch(cmd)
    }

    // ln iso
    cmd = `ln -s ${this.settings.iso_work} ${this.settings.config.snapshot_dir}/iso`
    this.tryCatch(cmd)

    // ln livefs
    cmd = `ln -s ${this.settings.work_dir.merged} ${this.settings.config.snapshot_dir}/livefs`
    this.tryCatch(cmd)
  }

  /**
   *
   * @param cmd
   */
  async tryCatch(cmd = '') {
    if (this.verbose) {
      console.log('Ovary: tryCatch')
    }

    try {
      await exec(cmd, this.echo)
    } catch (error) {
      console.log(`Error: ${error}`)
      await Utils.pressKeyToExit(cmd)
    }
  }

  /**
   * editLiveFs
   * - Truncate logs, remove archived log
   * - Allow all fixed drives to be mounted with pmount
   * - Enable or disable password login trhough ssh for users (not root)
   * - Create an empty /etc/fstab
   * - Blanck /etc/machine-id
   * - Add some basic files to /dev
   * - Clear configs from /etc/network/interfaces, wicd and NetworkManager and netman
   */
  async editLiveFs(clone = false, cryptedclone = false) {
    if (this.verbose) {
      console.log('Ovary: editLiveFs')
    }

    /**
     * /etc/penguins-eggs.d/is_clone file created on live
     */
    if (clone) {
      await exec(`touch ${this.settings.work_dir.merged}/etc/penguins-eggs.d/is_clone`, this.echo)
    }

    /**
     * /etc/penguins-eggs.d/is_crypted_clone file created on live
     */
    if (cryptedclone) {
      await exec(`touch ${this.settings.work_dir.merged}/etc/penguins-eggs.d/is_crypted_clone`, this.echo)
    }

    /**
     * /etc/default/epoptes-client created on live
     */
    if (Pacman.packageIsInstalled('epoptes')) {
      const file = `${this.settings.work_dir.merged}/etc/default/epoptes-client`
      const text = `SERVER=${os.hostname}.local\n`
      fs.writeFileSync(file, text)
    }

    if (this.familyId === 'debian') {
      // Aggiungo UMASK=0077 in /etc/initramfs-tools/conf.d/calamares-safe-initramfs.conf
      const text = 'UMASK=0077\n'
      const file = '/etc/initramfs-tools/conf.d/eggs-safe-initramfs.conf'
      Utils.write(file, text)
    }

    // Truncate logs, remove archived logs.
    let cmd = `find ${this.settings.work_dir.merged}/var/log -name "*gz" -print0 | xargs -0r rm -f`
    await exec(cmd, this.echo)
    cmd = `find ${this.settings.work_dir.merged}/var/log/ -type f -exec truncate -s 0 {} \\;`
    await exec(cmd, this.echo)

    // Allow all fixed drives to be mounted with pmount
    if (this.settings.config.pmount_fixed && fs.existsSync(`${this.settings.work_dir.merged}/etc/pmount.allow`)) {
      // MX aggiunto /etc
      await exec(`sed -i 's:#/dev/sd\[a-z\]:/dev/sd\[a-z\]:' ${this.settings.work_dir.merged}/etc/pmount.allow`, this.echo)
    }

    // Remove obsolete live-config file
    if (fs.existsSync(`${this.settings.work_dir.merged}lib/live/config/1161-openssh-server`)) {
      await exec(`rm -f ${this.settings.work_dir.merged}/lib/live/config/1161-openssh-server`, this.echo)
    }

    if (fs.existsSync(`${this.settings.work_dir.merged}/etc/ssh/sshd_config`)) {
      /**
       * enable/disable SSH root/users password login
       */
      await exec(`sed -i '/PermitRootLogin/d' ${this.settings.work_dir.merged}/etc/ssh/sshd_config`)
      await exec(`sed -i '/PasswordAuthentication/d' ${this.settings.work_dir.merged}/etc/ssh/sshd_config`)
      if (this.settings.config.ssh_pass) {
        /** removed on 2023-12-28 
        * await exec(`echo 'PermitRootLogin yes' | tee -a ${this.settings.work_dir.merged}/etc/ssh/sshd_config`)
        */
        await exec(`echo 'PasswordAuthentication yes' | tee -a ${this.settings.work_dir.merged}/etc/ssh/sshd_config`)
      } else {
        await exec(`echo 'PermitRootLogin prohibit-password' | tee -a ${this.settings.work_dir.merged}/etc/ssh/sshd_config`)
        await exec(`echo 'PasswordAuthentication no' | tee -a ${this.settings.work_dir.merged}/etc/ssh/sshd_config`)
      }
    }

    /**
     * ufw --force reset 
     */
    // if (Pacman.packageIsInstalled('ufw')) {
    //    await exec('ufw --force reset')
    // }


    /**
     * /etc/fstab should exist, even if it's empty,
     * to prevent error messages at boot
     */
    await exec(`rm ${this.settings.work_dir.merged}/etc/fstab`, this.echo)
    await exec(`touch ${this.settings.work_dir.merged}/etc/fstab`, this.echo)

    /**
     * Remove crypttab if exists
     * this is crucial for tpm systems.
     */
    if (fs.existsSync(`${this.settings.work_dir.merged}/etc/crypttab`)) {
      await exec(`rm ${this.settings.work_dir.merged}/etc/crypttab`, this.echo)
    }

    /**
     * Blank out systemd machine id.
     * If it does not exist, systemd-journald will fail,
     * but if it exists and is empty, systemd will automatically
     * set up a new unique ID.
     */
    if (fs.existsSync(`${this.settings.work_dir.merged}/etc/machine-id`)) {
      await exec(`rm ${this.settings.work_dir.merged}/etc/machine-id`, this.echo)
      await exec(`touch ${this.settings.work_dir.merged}/etc/machine-id`, this.echo)
      Utils.write(`${this.settings.work_dir.merged}/etc/machine-id`, ':')
    }

    /**
     * LMDE4: utilizza UbuntuMono16.pf2
     * aggiungo un link a /boot/grub/fonts/UbuntuMono16.pf2
     */
    shx.cp(`${this.settings.work_dir.merged}/boot/grub/fonts/unicode.pf2`, `${this.settings.work_dir.merged}/boot/grub/fonts/UbuntuMono16.pf2`)

    /**
    * cleaning /etc/resolv.conf
    */
    const resolvFile = `${this.settings.work_dir.merged}/etc/resolv.conf`
    shx.rm(resolvFile)

    /**
     * Per tutte le distro systemd
     */
    if (Utils.isSystemd()) {
      const systemdctl = new Systemctl(this.verbose)

      /**
       * systemd-systemd-resolved
       */
      let resolvContent = ''
      if (await systemdctl.isActive('systemd-resolved.service')) {
        await systemdctl.stop('systemd-resolved.service')
        resolvContent = 'nameserver 127.0.0.53\noptions edns0 trust-ad\nsearch .\n'
      }

      fs.writeFileSync(resolvFile, resolvContent)

      if (await systemdctl.isEnabled('systemd-networkd.service')) {
        await systemdctl.disable('systemd-networkd.service', this.settings.work_dir.merged, true)
      }

      if (await systemdctl.isEnabled('remote-cryptsetup.target')) {
        await systemdctl.disable('remote-cryptsetup.target', this.settings.work_dir.merged, true)
      }

      if (await systemdctl.isEnabled('speech-dispatcherd.service')) {
        await systemdctl.disable('speech-dispatcherd.service', this.settings.work_dir.merged, true)
      }

      if (await systemdctl.isEnabled('wpa_supplicant-nl80211@.service')) {
        await systemdctl.disable('wpa_supplicant-nl80211@.service', this.settings.work_dir.merged, true)
      }

      if (await systemdctl.isEnabled('wpa_supplicant@.service')) {
        await systemdctl.disable('wpa_supplicant@.service', this.settings.work_dir.merged, true)
      }

      if (await systemdctl.isEnabled('wpa_supplicant-wired@.service')) {
        await systemdctl.disable('wpa_supplicant-wired@.service', this.settings.work_dir.merged, true)
      }

      /**
       * All systemd distros rm
       */
      await exec(`rm -f ${this.settings.work_dir.merged}/var/lib/wicd/configurations/*`, this.echo)
      await exec(`rm -f ${this.settings.work_dir.merged}/etc/wicd/wireless-settings.conf`, this.echo)
      await exec(`rm -f ${this.settings.work_dir.merged}/etc/NetworkManager/system-connections/*`, this.echo)
      await exec(`rm -f ${this.settings.work_dir.merged}/etc/network/wifi/*`, this.echo)
      /**
       * removing from /etc/network/:
       * if-down.d if-post-down.d if-pre-up.d if-up.d interfaces interfaces.d
       */
      const cleanDirs = ['if-down.d', 'if-post-down.d', 'if-pre-up.d', 'if-up.d', 'interfaces.d']
      let cleanDir = ''
      for (cleanDir of cleanDirs) {
        await exec(`rm -f ${this.settings.work_dir.merged}/etc/network/${cleanDir}/wpasupplicant`, this.echo)
      }
    }

    /**
     * Clear configs from /etc/network/interfaces, wicd and NetworkManager
     * and netman, so they aren't stealthily included in the snapshot.
     */
    if (this.familyId === 'debian') {
      if (fs.existsSync(`${this.settings.work_dir.merged}/etc/network/interfaces`)) {
        await exec(`rm -f ${this.settings.work_dir.merged}/etc/network/interfaces`, this.echo)
        Utils.write(`${this.settings.work_dir.merged}/etc/network/interfaces`, 'auto lo\niface lo inet loopback')
      }

      /**
       * add some basic files to /dev
       */
      if (!fs.existsSync(`${this.settings.work_dir.merged}/dev/console`)) {
        await exec(`mknod -m 622 ${this.settings.work_dir.merged}/dev/console c 5 1`, this.echo)
      }

      if (!fs.existsSync(`${this.settings.work_dir.merged}/dev/null`)) {
        await exec(`mknod -m 666 ${this.settings.work_dir.merged}/dev/null c 1 3`, this.echo)
      }

      if (!fs.existsSync(`${this.settings.work_dir.merged}/dev/zero`)) {
        await exec(`mknod -m 666 ${this.settings.work_dir.merged}/dev/zero c 1 5`, this.echo)
      }

      if (!fs.existsSync(`${this.settings.work_dir.merged}/dev/ptmx`)) {
        await exec(`mknod -m 666 ${this.settings.work_dir.merged}/dev/ptmx c 5 2`, this.echo)
      }

      if (!fs.existsSync(`${this.settings.work_dir.merged}/dev/tty`)) {
        await exec(`mknod -m 666 ${this.settings.work_dir.merged}/dev/tty c 5 0`, this.echo)
      }

      if (!fs.existsSync(`${this.settings.work_dir.merged}/dev/random`)) {
        await exec(`mknod -m 444 ${this.settings.work_dir.merged}/dev/random c 1 8`, this.echo)
      }

      if (!fs.existsSync(`${this.settings.work_dir.merged}/dev/urandom`)) {
        await exec(`mknod -m 444 ${this.settings.work_dir.merged}/dev/urandom c 1 9`, this.echo)
      }

      if (!fs.existsSync(`${this.settings.work_dir.merged}/dev/{console,ptmx,tty}`)) {
        await exec(`chown -v root:tty ${this.settings.work_dir.merged}/dev/{console,ptmx,tty}`, this.echo)
      }

      if (!fs.existsSync(`${this.settings.work_dir.merged}/dev/fd`)) {
        await exec(`ln -sv /proc/self/fd ${this.settings.work_dir.merged}/dev/fd`, this.echo)
      }

      if (!fs.existsSync(`${this.settings.work_dir.merged}/dev/stdin`)) {
        await exec(`ln -sv /proc/self/fd/0 ${this.settings.work_dir.merged}/dev/stdin`, this.echo)
      }

      if (!fs.existsSync(`${this.settings.work_dir.merged}/dev/stdout`)) {
        await exec(`ln -sv /proc/self/fd/1 ${this.settings.work_dir.merged}/dev/stdout`, this.echo)
      }

      if (!fs.existsSync(`${this.settings.work_dir.merged}/dev/stderr`)) {
        await exec(`ln -sv /proc/self/fd/2 ${this.settings.work_dir.merged}/dev/stderr`, this.echo)
      }

      if (!fs.existsSync(`${this.settings.work_dir.merged}/dev/core`)) {
        await exec(`ln -sv /proc/kcore ${this.settings.work_dir.merged}/dev/core`, this.echo)
      }

      if (!fs.existsSync(`${this.settings.work_dir.merged}/dev/shm`)) {
        await exec(`mkdir -v ${this.settings.work_dir.merged}/dev/shm`, this.echo)
      }

      if (!fs.existsSync(`${this.settings.work_dir.merged}/dev/pts`)) {
        await exec(`mkdir -v ${this.settings.work_dir.merged}/dev/pts`, this.echo)
      }

      if (!fs.existsSync(`${this.settings.work_dir.merged}/dev/shm`)) {
        await exec(`chmod 1777 ${this.settings.work_dir.merged}/dev/shm`, this.echo)
      }

      /**
       * creo /tmp
       */
      if (!fs.existsSync(`${this.settings.work_dir.merged}/tmp`)) {
        await exec(`mkdir ${this.settings.work_dir.merged}/tmp`, this.echo)
      }
      /**
      * Assegno 1777 a /tmp creava problemi con MXLINUX 
      */
      await exec(`chmod 1777 ${this.settings.work_dir.merged}/tmp`, this.echo)
    }
  }

  /**
   * syslinux
   */
  async syslinux() {
    if (this.verbose) {
      console.log('Ovary: syslinux')
    }

    await exec(`cp ${this.settings.distro.syslinuxPath}/vesamenu.c32 ${this.settings.iso_work}/isolinux/`, this.echo)
    await exec(`cp ${this.settings.distro.syslinuxPath}/chain.c32 ${this.settings.iso_work}/isolinux/`, this.echo)
    /**
     * per openSuse non sono riusciuto a determinare
     * quale pacchetto installi:
     * ldllinux.c43, libcom32 e libutil.c32
     */
    if (this.familyId !== 'suse') {
      await exec(`cp ${this.settings.distro.syslinuxPath}/ldlinux.c32 ${this.settings.iso_work}/isolinux/`, this.echo)
      await exec(`cp ${this.settings.distro.syslinuxPath}/libcom32.c32 ${this.settings.iso_work}/isolinux/`, this.echo)
      await exec(`cp ${this.settings.distro.syslinuxPath}/libutil.c32 ${this.settings.iso_work}/isolinux/`, this.echo)
    }
  }

  /**
   *  async isolinux
   */
  async isolinux(theme = 'eggs') {
    if (this.verbose) {
      console.log('Ovary: isolinux')
    }

    /**
     * isolinux.bin
     */
    await exec(`cp ${this.settings.distro.isolinuxPath}/isolinux.bin ${this.settings.iso_work}/isolinux/`, this.echo)

    /**
     * isolinux.theme.cfg
     */
    const isolinuxThemeDest = this.settings.iso_work + 'isolinux/isolinux.theme.cfg'
    let isolinuxThemeSrc = path.resolve(__dirname, `../../addons/${theme}/theme/livecd/isolinux.theme.cfg`)
    if (this.theme.includes('/')) {
      isolinuxThemeSrc = `${theme}/theme/livecd/isolinux.theme.cfg`
    }

    if (!fs.existsSync(isolinuxThemeSrc)) {
      Utils.warning('Cannot find: ' + isolinuxThemeSrc)
      process.exit()
    }

    fs.copyFileSync(isolinuxThemeSrc, isolinuxThemeDest)

    /**
     * isolinux.cfg from isolinux.main.cfg
     */
    const isolinuxDest = `${this.settings.iso_work}/isolinux/isolinux.cfg`
    this.settings.iso_work + 'isolinux/isolinux.cfg'
    let isolinuxTemplate = `${theme}/theme/livecd/isolinux.main.cfg`
    if (!fs.existsSync(isolinuxTemplate)) {
      //isolinuxTemplate = path.resolve(__dirname, '../../addons/templates/isolinux.main.cfg')
      isolinuxTemplate = path.resolve(__dirname, '../../addons/eggs/theme/livecd/isolinux.main.cfg')
    }

    if (!fs.existsSync(isolinuxTemplate)) {
      Utils.warning('Cannot find: ' + isolinuxTemplate)
      process.exit()
    }

    const kernel_parameters = this.kernelParameters()
    const template = fs.readFileSync(isolinuxTemplate, 'utf8')
    const view = {
      fullname: this.settings.remix.fullname.toUpperCase(),
      kernel: Utils.kernelVersion(),
      vmlinuz: `/live${this.settings.vmlinuz}`,
      initrdImg: `/live${this.settings.initrdImg}`,
      kernel_parameters: kernel_parameters,
    }
    fs.writeFileSync(isolinuxDest, mustache.render(template, view))

    /**
     * splash
     */
    const splashDest = `${this.settings.iso_work}/isolinux/splash.png`
    let splashSrc = path.resolve(__dirname, `../../addons/${theme}/theme/livecd/splash.png`)
    if (this.theme.includes('/')) {
      splashSrc = path.resolve(`${theme}/theme/livecd/splash.png`)
    }

    if (!fs.existsSync(splashSrc)) {
      Utils.warning('Cannot find: ' + splashSrc)
      process.exit()
    }

    fs.copyFileSync(splashSrc, splashDest)
  }

  /**
   * 
   * @returns kernelParameters
   */
  kernelParameters(): string {
    if (this.verbose) {
      console.log('Ovary: kernelParameters')
    }

    // GRUB_CMDLINE_LINUX='ipv6.disable=1'
    const distroId = this.settings.distro.distroId
    let kp = `boot=live components locales=${process.env.LANG}`
    if (this.familyId === 'archlinux') {
      const volid = Utils.getVolid(this.settings.remix.name)
      if (isMiso(distroId)) {
        kp += ` misobasedir=manjaro misolabel=${volid}`
      } else {
        kp += ` archisobasedir=arch archisolabel=${volid}`
      }
    }
    kp += ` cow_spacesize=4G`
    return kp
  }

  /**
   * kernelCopy
   */
  async kernelCopy() {
  Utils.warning(`copying ${path.basename(this.settings.kernel_image)} on ISO/live`)

  let lackVmlinuzImage = false
  if (fs.existsSync(this.settings.kernel_image)) {
    await exec(`cp ${this.settings.kernel_image} ${this.settings.iso_work}live/`, this.echo)
  } else {
    Utils.error(`Cannot find ${this.settings.kernel_image}`)
    lackVmlinuzImage = true
  }

  if (lackVmlinuzImage) {
    Utils.warning('Try to edit /etc/penguins-eggs.d/eggs.yaml and check for')
    Utils.warning(`vmlinuz: ${this.settings.kernel_image}`)
    process.exit(1)
  }
}

  /**
   * initrdArch()
   * necessita di echoYes
   */
  async initrdArch() {
  Utils.warning(`creating ${path.basename(this.settings.initrdImg)} on ISO/live`)

  let initrdImg = Utils.initrdImg()
  initrdImg = initrdImg.slice(Math.max(0, initrdImg.lastIndexOf('/') + 1))
  Utils.warning(`Creating ${initrdImg} in ${this.settings.iso_work}live/`)
  const distroId = this.settings.distro.distroId
  let fileConf = 'arch'
  if (isMiso(distroId)) {
    fileConf="manjarolinux"
    if (distroId.toLowerCase().includes("biglinux"))  {
      fileConf="biglinux"
    }
  }

  let pathConf = path.resolve(__dirname, `../../mkinitcpio/${fileConf}/live.conf`)
  await exec(`mkinitcpio -c ${pathConf} -g ${this.settings.iso_work}live/${initrdImg}`, Utils.setEcho(true))
}

  /**
   * We must upgrade to initrdCreate for Debian/Ubuntu
   * @returns
   */
  async initrdDebian(verbose = false) {
  Utils.warning(`creating ${path.basename(this.settings.initrdImg)} on ISO/live`)

  let isCrypted = false

  if (fs.existsSync('/etc/crypttab')) {
    isCrypted = true
    await exec('mv /etc/crypttab /etc/crypttab.saved', this.echo)
  }

  await exec(`mkinitramfs -o ${this.settings.iso_work}/live/initrd.img-$(uname -r) ${this.toNull}`, this.echo)

  if (isCrypted) {
    await exec('mv /etc/crypttab.saved /etc/crypttab', this.echo)
  }
}

  /**
   * squashFs: crea in live filesystem.squashfs
   */
  async makeSquashfs(scriptOnly = false, unsecure = false): Promise < string > {
  if(this.verbose) {
  console.log('Ovary: makeSquashfs')
}

/**
 * exclude all the accurence of cryptdisks in rc0.d, etc
 */
const fexcludes = [
  '/boot/efi/EFI',
  '/etc/fstab',
  '/etc/mtab',
  '/etc/udev/rules.d/70-persistent-cd.rules',
  '/etc/udev/rules.d/70-persistent-net.rules',
]

for (const i in fexcludes) {
  this.addRemoveExclusion(true, fexcludes[i])
}

/**
 * Non sò che fa, ma sicuro non serve per archlinux
 */
if (this.familyId === 'debian') {
  const rcd = ['rc0.d', 'rc1.d', 'rc2.d', 'rc3.d', 'rc4.d', 'rc5.d', 'rc6.d', 'rcS.d']
  let files: string[]
  for (const i in rcd) {
    files = fs.readdirSync(`${this.settings.work_dir.merged}/etc/${rcd[i]}`)
    for (const n in files) {
      if (files[n].includes('cryptdisks')) {
        this.addRemoveExclusion(true, `/etc/${rcd[i]}${files[n]}`)
      }
    }
  }
}

/**
 * secure
 */
if (!unsecure) {
  this.addRemoveExclusion(true, `root/*`)
  this.addRemoveExclusion(true, `root/.*`)
}

if (shx.exec('/usr/bin/test -L /etc/localtime', { silent: true }) && shx.exec('cat /etc/timezone', { silent: true }) !== 'Europe/Rome') {
  // this.addRemoveExclusion(true, '/etc/localtime')
}

this.addRemoveExclusion(true, this.settings.config.snapshot_dir /* .absolutePath() */)

if (fs.existsSync(`${this.settings.iso_work}/live/filesystem.squashfs`)) {
  fs.unlinkSync(`${this.settings.iso_work}/live/filesystem.squashfs`)
}

const compression = `-comp ${this.settings.config.compression}`

/**
* limit: patch per Raspberry
*/
let limit = ''
if (Utils.uefiArch() === 'arm64') {
  // limit = ' -processors 2 -mem 1024M'
}

/**
 * mksquashfs
 * 
 * SYNTAX: mksquashfs source1 source2 ...  
 * FILESYSTEM [OPTIONS] 
 * [-ef exclude.list]
 * [-e list of exclude dirs/files]
 */
let cmd = `mksquashfs ${this.settings.work_dir.merged} ${this.settings.iso_work}live/filesystem.squashfs ${compression} ${limit} -wildcards -ef ${this.settings.config.snapshot_excludes} ${this.settings.session_excludes}`

cmd = cmd.replace(/\s\s+/g, ' ')
Utils.writeX(`${this.settings.work_dir.ovarium}mksquashfs`, cmd)
if (!scriptOnly) {
  Utils.warning('creating filesystem.squashfs on ISO/live')
  // Utils.warning(`compression: ` + compression)
  const test = (await exec(cmd, Utils.setEcho(true))).code
  if (test !== 0) {
    process.exit()
  }
}
return cmd
  }

/**
 * Restituisce true per le direcory da montare con overlay
 *
 * Ci sono tre tipologie:
 *
 * - normal solo la creazione della directory, nessun mount
 * - merged creazione della directory e mount ro
 * - mergedAndOverlay creazione directory, overlay e mount rw
 *
 * @param dir
 */
mergedAndOverlay(dir: string): boolean {
  if (this.verbose) {
    console.log('Ovary: mergedAndOverlay')
  }
  // boot viene copiato... non ricordo perchè
  const mountDirs = ['etc', 'usr', 'var']
  let mountDir = ''
  let overlay = false
  for (mountDir of mountDirs) {
    if (mountDir === dir) {
      overlay = true
    }
  }

  return overlay
}

/**
 * Ritorna true se c'è bisogno del mount --bind
 *
 * Ci sono tre tipologie:
 *
 * - normal solo la creazione della directory, nessun mount
 * - merged creazione della directory e mount ro
 * - mergedAndOverlay creazione directory, overlay e mount rw
 * - copied: creazione directory e copia
 */
merged(dir: string): boolean {
  if (this.verbose) {
    console.log('Ovary: merged')
  }

  let merged = true

  if (dir === 'home') {
    merged = this.clone
  } else {
    const noMergeDirs = [
      'boot', // will be copied now
      'cdrom',
      'dev',
      'media',
      'mnt',
      'proc',
      'run',
      'swapfile',
      'sys',
      'tmp',
    ]

    // deepin
    noMergeDirs.push('data', 'recovery')

    for (const noMergeDir of noMergeDirs) {
      if (dir === noMergeDir) {
        merged = false
      }
    }
  }
  return merged
}

  /**
   * Esegue il bind del fs live e
   * crea lo script bind
   *
   * @param verbose
   */
  async bindLiveFs() {
  if (this.verbose) {
    console.log('Ovary: bindLiveFs')
  }

  /**
   * Attenzione:
   * fs.readdirSync('/', { withFileTypes: true })
   * viene ignorato da Node8, ma da problemi da Node10 in poi
   */
  const dirs = fs.readdirSync('/') // we must remove boot and 
  const startLine = '#############################################################'
  const titleLine = '# -----------------------------------------------------------'
  const endLine = '# ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n'

  let lnkDest = ''
  let cmd = ''
  const cmds: string[] = []
  cmds.push('# NOTE: cdrom, dev, live, media, mnt, proc, run, sys and tmp', `#       need just a mkdir in ${this.settings.work_dir.merged}`)
  cmds.push(`# host: ${os.hostname()} user: ${await Utils.getPrimaryUser()}\n`)

  for (const dir of dirs) {
    cmds.push(startLine)
    if (N8.isDirectory(dir)) {
      if (dir !== 'boot') {
        if (dir !== 'lost+found') {
          cmd = `# /${dir} is a directory`
          if (this.mergedAndOverlay(dir)) {
            /**
             * mergedAndOverlay creazione directory, overlay e mount rw
             */
            cmds.push(`${cmd} need to be presente, and rw`, titleLine, '# create mountpoint lower')
            cmds.push(await makeIfNotExist(`${this.settings.work_dir.lowerdir}/${dir}`), `# first: mount /${dir} rw in ${this.settings.work_dir.lowerdir}/${dir}`)
            cmds.push(await rexec(`mount --bind --make-slave /${dir} ${this.settings.work_dir.lowerdir}/${dir}`, this.verbose), '# now remount it ro')
            cmds.push(await rexec(`mount -o remount,bind,ro ${this.settings.work_dir.lowerdir}/${dir}`, this.verbose), `\n# second: create mountpoint upper, work and ${this.settings.work_dir.merged} and mount ${dir}`)
            cmds.push(await makeIfNotExist(`${this.settings.work_dir.upperdir}/${dir}`, this.verbose))
            cmds.push(await makeIfNotExist(`${this.settings.work_dir.workdir}/${dir}`, this.verbose))
            cmds.push(await makeIfNotExist(`${this.settings.work_dir.merged}/${dir}`, this.verbose), `\n# thirth: mount /${dir} rw in ${this.settings.work_dir.merged}`)
            cmds.push(await rexec(`mount -t overlay overlay -o lowerdir=${this.settings.work_dir.lowerdir}/${dir},upperdir=${this.settings.work_dir.upperdir}/${dir},workdir=${this.settings.work_dir.workdir}/${dir} ${this.settings.work_dir.merged}/${dir}`, this.verbose))
          } else if (this.merged(dir)) {
            /*
             * merged creazione della directory e mount ro
             */
            cmds.push(`${cmd} need to be present, mount ro`, titleLine)
            cmds.push(await makeIfNotExist(`${this.settings.work_dir.merged}/${dir}`, this.verbose))
            cmds.push(await rexec(`mount --bind --make-slave /${dir} ${this.settings.work_dir.merged}/${dir}`, this.verbose))
            cmds.push(await rexec(`mount -o remount,bind,ro ${this.settings.work_dir.merged}/${dir}`, this.verbose))
          } else {
            /**
             * normal solo la creazione della directory, nessun mount
             */
            cmds.push(`${cmd} need to be present, no mount`, titleLine)
            cmds.push(await makeIfNotExist(`${this.settings.work_dir.merged}/${dir}`, this.verbose), `# mount -o bind /${dir} ${this.settings.work_dir.merged}/${dir}`)
          }
        }
      }
    } else if (N8.isFile(dir)) {
      cmds.push(`# /${dir} is just a file`, titleLine)
      if (!fs.existsSync(`${this.settings.work_dir.merged}/${dir}`)) {
        cmds.push(await rexec(`cp /${dir} ${this.settings.work_dir.merged}`, this.verbose))
      } else {
        cmds.push('# file exist... skip')
      }
    } else if (N8.isSymbolicLink(dir)) {
      lnkDest = fs.readlinkSync(`/${dir}`)
      cmds.push(
        `# /${dir} is a symbolic link to /${lnkDest} in the system`,
        '# we need just to recreate it',
        `# ln -s ${this.settings.work_dir.merged}/${lnkDest} ${this.settings.work_dir.merged}/${lnkDest}`,
        "# but we don't know if the destination exist, and I'm too lazy today. So, for now: ",
        titleLine,
      )
      if (!fs.existsSync(`${this.settings.work_dir.merged}/${dir}`)) {
        if (fs.existsSync(lnkDest)) {
          cmds.push(`ln -s ${this.settings.work_dir.merged}/${lnkDest} ${this.settings.work_dir.merged}/${lnkDest}`)
        } else {
          cmds.push(await rexec(`cp -r /${dir} ${this.settings.work_dir.merged}`, this.verbose))
        }
      } else {
        cmds.push('# SymbolicLink exist... skip')
      }
    }

    cmds.push(endLine)
  }

  // Utils.writeXs(`${this.settings.config.snapshot_dir}bind`, cmds)
  Utils.writeXs(`${this.settings.work_dir.ovarium}bind`, cmds)
}

  /**
   * copyBoot
   * 
   * necessario: prima era merged
   */
  async copyBoot() {
  if (this.verbose) {
    console.log('Ovary: copyBoot')
  }
  await rexec(`cp -r /boot ${this.settings.config.snapshot_mnt}filesystem.squashfs`, this.verbose)
}


  /**
   * ubind del fs live
   * @param verbose
   */
  async uBindLiveFs() {
  if (this.verbose) {
    console.log('Ovary: uBindLiveFs')
  }

  const cmds: string[] = []
  cmds.push('# NOTE: home, cdrom, dev, live, media, mnt, proc, run, sys and tmp', `#       need just to be removed in ${this.settings.work_dir.merged}`)
  cmds.push(`# host: ${os.hostname()} user: ${await Utils.getPrimaryUser()}\n`)
  if (fs.existsSync(this.settings.work_dir.merged)) {
    const bindDirs = fs.readdirSync(this.settings.work_dir.merged, {
      withFileTypes: true,
    })

    for (const dir of bindDirs) {
      const dirname = N8.dirent2string(dir)

      cmds.push('#############################################################')
      if (N8.isDirectory(dirname)) {
        cmds.push(`\n# directory: ${dirname}`)
        if (this.mergedAndOverlay(dirname)) {
          cmds.push(`\n# ${dirname} has overlay`, `\n# First, umount it from ${this.settings.config.snapshot_dir}`)
          cmds.push(await rexec(`umount ${this.settings.work_dir.merged}/${dirname}`, this.verbose), `\n# Second, umount it from ${this.settings.work_dir.lowerdir}`)
          cmds.push(await rexec(`umount ${this.settings.work_dir.lowerdir}/${dirname}`, this.verbose))
        } else if (this.merged(dirname)) {
          cmds.push(await rexec(`umount ${this.settings.work_dir.merged}/${dirname}`, this.verbose))
        }

        cmds.push(`\n# remove in ${this.settings.work_dir.merged} and ${this.settings.work_dir.lowerdir}`)

        /**
         * We can't remove the nest!!!
         */
        const nest = this.settings.config.snapshot_dir.split('/')
        if (dirname !== nest[1]) { // We can't remove first level nest
          cmds.push(await rexec(`rm ${this.settings.work_dir.merged}/${dirname} -rf`, this.verbose))
        }
      } else if (N8.isFile(dirname)) {
        cmds.push(`\n# ${dirname} = file`)
        cmds.push(await rexec(`rm ${this.settings.work_dir.merged}/${dirname}`, this.verbose))
      } else if (N8.isSymbolicLink(dirname)) {
        cmds.push(`\n# ${dirname} = symbolicLink`)
        cmds.push(await rexec(`rm ${this.settings.work_dir.merged}/${dirname}`, this.verbose))
      }
    }
  }

  if (this.clone) {
    cmds.push(await rexec(`umount ${this.settings.work_dir.merged}/home`, this.verbose))
  }
  // Utils.writeXs(`${this.settings.config.snapshot_dir}ubind`, cmds)
  Utils.writeXs(`${this.settings.work_dir.ovarium}ubind`, cmds)

}

  /**
   * bind dei virtual file system
   */
  async bindVfs() {
  if (this.verbose) {
    console.log('Ovary: bindVfs')
  }

  const cmds: string[] = []
  cmds.push(
    `mount -o bind /dev ${this.settings.work_dir.merged}/dev`,
    `mount -o bind /dev/pts ${this.settings.work_dir.merged}/dev/pts`,
    `mount -o bind /proc ${this.settings.work_dir.merged}/proc`,
    `mount -o bind /sys ${this.settings.work_dir.merged}/sys`,
    `mount -o bind /run ${this.settings.work_dir.merged}/run`,
  )
  // Utils.writeXs(`${this.settings.config.snapshot_dir}bindvfs`, cmds)
  Utils.writeXs(`${this.settings.work_dir.ovarium}bindvfs`, cmds)
}

  /**
   *
   * @param verbose
   */
  async ubindVfs() {
  if (this.verbose) {
    console.log('Ovary: ubindVfs')
  }

  const cmds: string[] = []
  cmds.push(`umount ${this.settings.work_dir.merged}/dev/pts`, `umount ${this.settings.work_dir.merged}/dev`, `umount ${this.settings.work_dir.merged}/proc`, `umount ${this.settings.work_dir.merged}/run`, `umount ${this.settings.work_dir.merged}/sys`)
  // Utils.writeXs(`${this.settings.config.snapshot_dir}ubindvfs`, cmds)
  Utils.writeXs(`${this.settings.work_dir.ovarium}ubindvfs`, cmds)
}

  /**
   *
   * @param verbose
   */
  async cleanUsersAccounts() {
  if (this.verbose) {
    console.log('Ovary: cleanUsersAccounts')
  }

  /**
   * delete all user in chroot
   */
  const cmds: string[] = []
  const cmd = `chroot ${this.settings.work_dir.merged} getent passwd {1000..60000} |awk -F: '{print $1}'`
  const result = await exec(cmd, {
    echo: this.verbose,
    ignore: false,
    capture: true,
  })
  const users: string[] = result.data.split('\n')
  for (let i = 0; i < users.length - 1; i++) {
    // cmds.push(await rexec(`chroot ${this.settings.work_dir.merged} deluser ${users[i]}`, verbose))
    cmds.push(await rexec(`chroot ${this.settings.work_dir.merged} userdel ${users[i]}`, this.verbose))
  }
}

  /**
   * list degli utenti: grep -E 1[0-9]{3}  /etc/passwd | sed s/:/\ / | awk '{print $1}'
   * create la home per user_opt
   * @param verbose
   */
  async createUserLive() {
  if (this.verbose) {
    console.log('Ovary: createUserLive')
  }

  const cmds: string[] = []
  cmds.push(await rexec('chroot ' + this.settings.work_dir.merged + ' rm /home/' + this.settings.config.user_opt + ' -rf', this.verbose))
  cmds.push(await rexec('chroot ' + this.settings.work_dir.merged + ' mkdir /home/' + this.settings.config.user_opt, this.verbose))
  cmds.push(await rexec('chroot ' + this.settings.work_dir.merged + ' useradd ' + this.settings.config.user_opt + ' --home-dir /home/' + this.settings.config.user_opt + ' --shell /bin/bash ', this.verbose))
  cmds.push(await rexec('chroot  ' + this.settings.work_dir.merged + ' cp /etc/skel/. /home/' + this.settings.config.user_opt + ' -R', this.verbose))

  // da problemi con il mount sshfs
  cmds.push(await rexec('chroot  ' + this.settings.work_dir.merged + ' chown ' + this.settings.config.user_opt + ':users' + ' /home/' + this.settings.config.user_opt + ' -R', this.verbose))

  // live password
  cmds.push(await rexec('chroot ' + this.settings.work_dir.merged + ' echo ' + this.settings.config.user_opt + ':' + this.settings.config.user_opt_passwd + '| chroot ' + this.settings.work_dir.merged + ' chpasswd', this.verbose))

  // root password
  cmds.push(await rexec('chroot ' + this.settings.work_dir.merged + ' echo root:' + this.settings.config.root_passwd + '| chroot ' + this.settings.work_dir.merged + ' chpasswd', this.verbose))

  if (this.familyId === 'debian') {
    cmds.push(await rexec(`chroot ${this.settings.work_dir.merged} usermod -aG sudo ${this.settings.config.user_opt}`, this.verbose))
  } else if (this.familyId === 'archlinux') {
    cmds.push(await rexec(`chroot ${this.settings.work_dir.merged} gpasswd -a ${this.settings.config.user_opt} wheel`, this.verbose))

    // check or create group: autologin
    cmds.push(await rexec(`chroot ${this.settings.work_dir.merged} getent group autologin || chroot ${this.settings.work_dir.merged} groupadd autologin`, this.verbose))
    cmds.push(await rexec(`chroot ${this.settings.work_dir.merged} gpasswd -a ${this.settings.config.user_opt} autologin`, this.verbose))
  }

  /**
   * educaandos and others themes
   * users.yml
   */
  let usersConf = path.resolve(__dirname, `../../addons/${this.theme}/theme/calamares/users.yml`)
  if (this.theme.includes('/')) {
    usersConf = `${this.theme}/theme/calamares/modules/users.yml`
  }

  if (fs.existsSync(usersConf)) {
    interface IUserCalamares {
      doAutologin: boolean
      setRootPassword: boolean
      doReusePassword: boolean
      sudoersGroup: string
      defaultGroups: string[]
      passwordRequirements: {
        minLenght: number
        maxLenght: number
      }
      userShell: string
    }
    const o = yaml.load(fs.readFileSync(usersConf, 'utf-8')) as IUserCalamares
    for (const group of o.defaultGroups) {
      cmds.push(await rexec(`chroot ${this.settings.work_dir.merged} usermod -aG ${group} ${this.settings.config.user_opt}`, this.verbose))
    }
  }
}

  /**
   *
   */
  async createXdgAutostart(theme = 'eggs', myAddons: IAddons, myLinks: string[] = [], noicons = false) {
  if (this.verbose) {
    console.log('Ovary: createXdgAutostart')
  }

  const pathHomeLive = `/home/${this.settings.config.user_opt}`

  if (noicons) { // NO icons
    shx.rm(`${this.settings.work_dir.merged}/etc/xdg/autostart/penguins-links-add.desktop`)
  } else { // VOGLIO le icone
    // Copia icona penguins-eggs
    shx.cp(path.resolve(__dirname, '../../assets/eggs.png'), '/usr/share/icons/')
    shx.cp(path.resolve(__dirname, '../../assets/krill.svg'), '/usr/share/icons/')
    shx.cp(path.resolve(__dirname, '../../assets/leaves.svg'), '/usr/share/icons/')

    /**
     * creazione dei link in /usr/share/applications
     */
    shx.cp(path.resolve(__dirname, '../../assets/penguins-eggs.desktop'), '/usr/share/applications/')
    /**
     * Scrivania/install-system.desktop
     */
    let installerUrl = 'install-system.desktop'
    let installerIcon = 'install-system.sh'
    if (Pacman.calamaresExists()) {
      shx.cp(path.resolve(__dirname, `../../addons/${theme}/theme/applications/install-system.desktop`), `${this.settings.work_dir.merged}/usr/share/applications/`)
    } else if (Pacman.packageIsInstalled('live-installer')) {
      // carico la policy per live-installer
      const policySource = path.resolve(__dirname, '../../assets/live-installer/com.github.pieroproietti.penguins-eggs.policy')
      const policyDest = '/usr/share/polkit-1/actions/com.github.pieroproietti.penguins-eggs.policy'
      shx.cp(policySource, policyDest)
      await exec(`sed -i 's/auth_admin/yes/' ${policyDest}`)

      // carico in filesystem.live packages-remove
      shx.cp(path.resolve(__dirname, '../../assets/live-installer/filesystem.packages-remove'), `${this.settings.iso_work}/live/`)
      shx.touch(`${this.settings.iso_work}/live/filesystem.packages`)

      installerUrl = 'penguins-live-installer.desktop'
      installerIcon = 'utilities-terminal'
      shx.cp(path.resolve(__dirname, '../../assets/penguins-live-installer.desktop'), `${this.settings.work_dir.merged}/usr/share/applications/`)
    } else {
      installerUrl = 'penguins-krill.desktop'
      installerIcon = 'utilities-terminal'
      shx.cp(path.resolve(__dirname, '../../assets/penguins-krill.desktop'), `${this.settings.work_dir.merged}/usr/share/applications/`)
    }

    /**
     * flags
     */

    // adapt
    if (myAddons.adapt) {
      const dirAddon = path.resolve(__dirname, '../../addons/eggs/adapt/')
      shx.cp(`${dirAddon}/applications/eggs-adapt.desktop`, `${this.settings.work_dir.merged}/usr/share/applications/`)
      shx.cp(`${dirAddon}/bin/adapt`, `${this.settings.work_dir.merged}/usr/bin/`)
      shx.chmod('+x', `${this.settings.work_dir.merged}/usr/bin/adapt`)
    }

    // ichoice
    if (myAddons.ichoice) {
      installerUrl = 'eggs-ichoice.desktop'
      installerIcon = 'system-software-install'
      const dirAddon = path.resolve(__dirname, '../../addons/eggs/ichoice/')
      shx.cp(`${dirAddon}/applications/eggs-ichoice.desktop`, `${this.settings.work_dir.merged}/usr/share/applications/`)
      shx.cp(`${dirAddon}/bin/eggs-ichoice.sh`, `${this.settings.work_dir.merged}/usr/bin/`)
      shx.chmod('+x', `${this.settings.work_dir.merged}/usr/bin/eggs-ichoice.sh`)
    }

    // pve
    if (myAddons.pve) {
      /**
       * create service pve-live
       */
      const pve = new PveLive()
      pve.create(this.settings.work_dir.merged)

      /**
       * adding a desktop link for pve
       */
      const dirAddon = path.resolve(__dirname, '../../addons/eggs/pve')
      shx.cp(`${dirAddon}/artwork/eggs-pve.png`, `${this.settings.work_dir.merged}/usr/share/icons/`)
      shx.cp(`${dirAddon}/applications/eggs-pve.desktop`, `${this.settings.work_dir.merged}/usr/share/applications/`)
    }

    // rsupport
    if (myAddons.rsupport) {
      const dirAddon = path.resolve(__dirname, '../../addons/eggs/rsupport')
      shx.cp(`${dirAddon}/applications/eggs-rsupport.desktop`, `${this.settings.work_dir.merged}/usr/share/applications/`)
      shx.cp(`${dirAddon}/artwork/eggs-rsupport.png`, `${this.settings.work_dir.merged}/usr/share/icons/`)
    }

    /**
     * configuro add-penguins-desktop-icons in /etc/xdg/autostart
     */

    const dirAutostart = `${this.settings.work_dir.merged}/etc/xdg/autostart`
    if (fs.existsSync(dirAutostart)) {

      // Creo l'avviatore xdg: DEVE essere add-penguins-links.desktop
      shx.cp(path.resolve(__dirname, '../../assets/penguins-links-add.desktop'), dirAutostart)

      // create /usr/bin/penguins-links-add.sh
      const script = '/usr/bin/penguins-links-add.sh'
      let text = ''
      text += '#!/bin/sh\n'
      text += 'DESKTOP=$(xdg-user-dir DESKTOP)\n'
      text += 'test -d "$DESKTOP" && mkdir -p "$DESKTOP"\n'
      text += `cp /usr/share/applications/${installerUrl} "$DESKTOP"\n`
      if (Pacman.packageIsInstalled('lxde-core')) {
        text += this.lxdeLink('penguins-eggs.desktop', "Penguins' eggs", 'eggs')
        if (myAddons.adapt) text += this.lxdeLink('eggs-adapt.desktop', 'Adapt', 'video-display')
        if (myAddons.pve) text += this.lxdeLink('eggs-pve.desktop', 'Proxmox VE', 'proxmox-ve')
        if (myAddons.rsupport) text += this.lxdeLink('eggs-rsupport.desktop', 'Remote assistance', 'remote-assistance')
      } else {
        text += 'cp /usr/share/applications/penguins-eggs.desktop "$DESKTOP"\n'
        if (myLinks.length > 0) {
          for (const link of myLinks) {
            text += `cp /usr/share/applications/${link}.desktop "$DESKTOP"\n`
          }
        }
        if (myAddons.adapt) text += 'cp /usr/share/applications/eggs-adapt.desktop "$DESKTOP"\n'
        if (myAddons.pve) text += 'cp /usr/share/applications/eggs-pve.desktop "$DESKTOP"\n'
        if (myAddons.rsupport) text += 'cp /usr/share/applications/eggs-rsupport.desktop "$DESKTOP"\n'
      }

      /**
       * enable desktop links
       */
      if (Pacman.packageIsInstalled('gdm3') || Pacman.packageIsInstalled('gdm')) {
        // GNOME
        text += 'test -f /usr/share/applications/penguins-eggs.desktop && cp /usr/share/applications/penguins-eggs.desktop "$DESKTOP"\n'
        text += 'test -f "$DESKTOP"/op && chmod a+x "$DESKTOP"/penguins-eggs.desktop\n'
        text += 'test -f "$DESKTOP"/penguins-eggs.desktop && gio set "$DESKTOP"/penguins-eggs.desktop metadata::trusted true\n'
        text += `test -f /usr/share/applications/${installerUrl} && cp /usr/share/applications/${installerUrl} "$DESKTOP"\n`
        text += `test -f "$DESKTOP"/${installerUrl} && chmod a+x "$DESKTOP"/${installerUrl}\n`
        text += `test -f "$DESKTOP"/${installerUrl} && gio set "$DESKTOP"/${installerUrl} metadata::trusted true\n`
      } else if (Pacman.packageIsInstalled('xfce4-session')) {

        // f=FILE; gio set -t string $f metadata::xfce-exe-checksum "$(sha256sum $f | awk '{print $1}')"
        text += 'chmod +x "$DESKTOP"/*.desktop'
        // await exec(`f="$DESKTOP"/*.desktop; gio set -t string $f metadata::xfce-exe-checksum "$(sha256sum $f | awk '{print $1}')"`)
      } else {
        // OTHERS: CINNAMON/KDE/ETC
        text += 'chmod +x "$DESKTOP"/*.desktop'
      }

      fs.writeFileSync(script, text, 'utf8')
      await exec(`chmod a+x ${script}`, this.echo)
    }
  } // END se VOGLIO le icone
  await Xdg.autologin(await Utils.getPrimaryUser(), this.settings.config.user_opt, this.settings.work_dir.merged)
}

  /**
   * Creazione link desktop per lxde
   * @param name
   * @param icon
   */
  private lxdeLink(file: string, name: string, icon: string): string {
    if (this.verbose) {
      console.log('Ovary: lxdeLink')
    }

    const lnk = `lnk-${file}`

    let text = ''
    text += `echo "[Desktop Entry]" >$DESKTOP/${lnk}\n`
    text += `echo "Type=Link" >> $DESKTOP/${lnk}\n`
    text += `echo "Name=${name}" >> $DESKTOP/${lnk}\n`
    text += `echo "Icon=${icon}" >> $DESKTOP/${lnk}\n`
    text += `echo "URL=/usr/share/applications/${file}" >> $DESKTOP/${lnk}\n\n`

    return text
  }

  /**
   * Add or remove exclusion
   * @param add {boolean} true = add, false remove
   * @param exclusion {string} path to add/remove
   */
  addRemoveExclusion(add: boolean, exclusion: string): void {
    if(this.verbose) {
      console.log('Ovary: addRemoveExclusion')
    }

    if (exclusion.startsWith('/')) {
      exclusion = exclusion.slice(1) // remove / initial Non compatible with rsync
    }

    if (add) {
      this.settings.session_excludes += this.settings.session_excludes === '' ? `-e '${exclusion}' ` : ` '${exclusion}' `
    } else {
      this.settings.session_excludes.replace(` '${exclusion}'`, '')
      if (this.settings.session_excludes === '-e') {
        this.settings.session_excludes = ''
      }
    }
  }

  // #######################################################################################
  /**
   * makeEfi
  */
  // #######################################################################################
  async makeEfi(theme = 'eggs') {
  if (this.verbose) {
    console.log('Ovary: makeEfi')
  }

  const memdiskDir = this.settings.config.snapshot_mnt + 'memdiskDir'
  const efiWorkDir = this.settings.efi_work
  const isoDir = this.settings.iso_work

  /**
   * il pachetto grub/grub2 DEVE essere presente
   */
  const grubName = Pacman.whichGrubIsInstalled()
  if (grubName === '') {
    Utils.error('Something went wrong! Cannot find grub! Run lsb_release -a and check the result')
    process.exit(1)
  }

  /**
   * Creo o cancello e creo: memdiskDir
   */
  if (fs.existsSync(memdiskDir)) {
    await exec(`rm ${memdiskDir} -rf`, this.echo)
  }

  Utils.warning('creating temporary memdiskDir on ' + memdiskDir)
  await exec(`mkdir ${memdiskDir}`)
  await exec(`mkdir ${memdiskDir}/boot`, this.echo)
  await exec(`mkdir ${memdiskDir}/boot/grub`, this.echo)

  /**
   * for initial grub.cfg in memdisk
   */
  const grubCfg = `${memdiskDir}/boot/grub/grub.cfg`
  let text = ''
  text += 'search --file --set=root /.disk/info\n'
  text += 'set prefix=($root)/boot/grub\n'
  text += `source $prefix/${Utils.uefiFormat()}/grub.cfg\n`
  Utils.write(grubCfg, text)

  // #################################

  /**
   * start with empty efiWorkDir
   */
  if (fs.existsSync(efiWorkDir)) {
    await exec(`rm ${efiWorkDir} -rf`, this.echo)
  }

  Utils.warning('creating temporary efiWordDir on ' + efiWorkDir)
  await exec(`mkdir ${efiWorkDir}`, this.echo)
  await exec(`mkdir ${efiWorkDir}boot`, this.echo)
  await exec(`mkdir ${efiWorkDir}boot/grub`, this.echo)
  await exec(`mkdir ${efiWorkDir}boot/grub/${Utils.uefiFormat()}`, this.echo)
  await exec(`mkdir ${efiWorkDir}efi`, this.echo)
  await exec(`mkdir ${efiWorkDir}efi/boot`, this.echo)

  /**
  * copy splash to efiWorkDir
  */
  const splashDest = `${efiWorkDir}boot/grub/splash.png`
  let splashSrc = path.resolve(__dirname, `../../addons/${theme}/theme/livecd/splash.png`)
  if (this.theme.includes('/')) {
    splashSrc = `${theme}/theme/livecd/splash.png`
  }

  if (!fs.existsSync(splashSrc)) {
    Utils.warning('Cannot find: ' + splashSrc)
    process.exit()
  }

  await exec(`cp ${splashSrc} ${splashDest}`, this.echo)

  /**
   * copy theme
   */
  const themeDest = `${efiWorkDir}boot/grub/theme.cfg`
  let themeSrc = path.resolve(__dirname, `../../addons/${theme}/theme/livecd/grub.theme.cfg`)
  if (this.theme.includes('/')) {
    themeSrc = `${theme}/theme/livecd/grub.theme.cfg`
  }

  if (!fs.existsSync(themeSrc)) {
    Utils.warning('Cannot find: ' + themeSrc)
    process.exit()
  }

  await exec(`cp ${themeSrc} ${themeDest}`, this.echo)

  /**
   * second grub.cfg file in efiWork
   */
  //         for i in $(ls /usr/lib/grub/x86_64-efi            |grep part_|grep \.mod|sed 's/.mod//'); do echo "insmod $i" >>              boot/grub/x86_64-efi/grub.cfg; done
  let cmd = `for i in $(ls /usr/lib/grub/${Utils.uefiFormat()}|grep part_|grep \.mod|sed 's/.mod//'); do echo "insmod $i" >> ${efiWorkDir}boot/grub/${Utils.uefiFormat()}/grub.cfg; done`
  await exec(cmd, this.echo)
  //cmd = `for i in efi_gop efi_uga ieee1275_fb vbe vga video_bochs video_cirrus jpeg png gfxterm ; do echo "insmod $i" >> ${efiWorkDir}boot/grub/${Utils.uefiFormat()}/grub.cfg ; done`
  cmd = `for i in efi_gop efi_uga ieee1275_fb vbe vga video_bochs video_cirrus jpeg png gfxterm ; do echo "insmod $i" >> ${efiWorkDir}boot/grub/${Utils.uefiFormat()}/grub.cfg ; done`
  await exec(cmd, this.echo)
  await exec(`echo "source /boot/grub/grub.cfg" >> ${efiWorkDir}boot/grub/${Utils.uefiFormat()}/grub.cfg`, this.echo)

  /**
   * andiamo in memdiskDir
   */

  /**
   * make a tarred "memdisk" to embed in the grub image
   *
   * NOTE: it's CRUCIAL to chdir before tar!!!
   */
  const currentDir = process.cwd()
  process.chdir(memdiskDir)
  await exec('tar -cvf memdisk boot', this.echo)
  process.chdir(currentDir)

  // -O, --format=FORMAT
  // -m --memdisk=FILE embed FILE as a memdisk image
  // -o, --output=FILE embed FILE as a memdisk image
  // -p, --prefix=DIR set prefix directory
  //                               --format=x86_64-efi         --memdisk=memdisk          --output=bootx64.efi           --prefix?DIR set prefix directory
  //          grub-mkimage         -O "x86_64-efi"             -m "memdisk"               -o "bootx64.efi"               -p '(memdisk)/boot/grub' search iso9660 configfile normal memdisk tar cat part_msdos part_gpt fat ext2 ntfs ntfscomp hfsplus chain boot linux
  //                                   arm64-efi 
  await exec(`${grubName}-mkimage  -O "${Utils.uefiFormat()}" \
                -m "${memdiskDir}/memdisk" \
                -o "${memdiskDir}/${Utils.uefiBN()}" \
                -p '(memdisk)/boot/grub' \
                search iso9660 configfile normal memdisk tar cat part_msdos part_gpt fat ext2 ntfs ntfscomp hfsplus chain boot linux`, this.echo)

  // popd torna in efiWorkDir

  // copy the grub image to efi/boot (to go later in the device's root)
  await exec(`cp ${memdiskDir}/${Utils.uefiBN()} ${efiWorkDir}efi/boot`, this.echo)

  // #######################

  // Do the boot image "boot/grub/efiboot.img"

  await exec(`dd if=/dev/zero of=${efiWorkDir}boot/grub/efiboot.img bs=1K count=1440`, this.echo)
  await exec(`/sbin/mkdosfs -F 12 ${efiWorkDir}boot/grub/efiboot.img`, this.echo)

  await exec(`mkdir ${efiWorkDir}img-mnt`, this.echo)

  await exec(`mount -o loop ${efiWorkDir}boot/grub/efiboot.img ${efiWorkDir}img-mnt`, this.echo)

  await exec(`mkdir ${efiWorkDir}img-mnt/efi`, this.echo)
  await exec(`mkdir ${efiWorkDir}img-mnt/efi/boot`, this.echo)

  // era cp -r
  await exec(`cp ${memdiskDir}/${Utils.uefiBN()} ${efiWorkDir}img-mnt/efi/boot`, this.echo)

  // #######################

  // copy modules and font
  await exec(`cp -r /usr/lib/grub/${Utils.uefiFormat()}/* ${efiWorkDir}boot/grub/${Utils.uefiFormat()}/`, this.echo)

  // if this doesn't work try another font from the same place (grub's default, unicode.pf2, is much larger)
  // Either of these will work, and they look the same to me. Unicode seems to work with qemu. -fsr
  if (fs.existsSync('/usr/share/grub/font.pf2')) {
    await exec(`cp /usr/share/grub/font.pf2 ${efiWorkDir}boot/grub/font.pf2`, this.echo)
  } else if (fs.existsSync('/usr/share/grub/unicode.pf2')) {
    await exec(`cp /usr/share/grub/unicode.pf2 ${efiWorkDir}boot/grub/font.pf2`, this.echo)
  } else if (fs.existsSync('/usr/share/grub/ascii.pf2')) {
    await exec(`cp /usr/share/grub/ascii.pf2 ${efiWorkDir}boot/grub/font.pf2`, this.echo)
  }

  // doesn't need to be root-owned
  // chown -R 1000:1000 $(pwd) 2>/dev/null

  // Cleanup efi temps
  await exec(`umount ${efiWorkDir}img-mnt`, this.echo)
  await exec(`rmdir ${efiWorkDir}img-mnt`, this.echo)
  await exec(`rm ${memdiskDir}/img-mnt -rf`, this.echo)

  //  popd

  // Copy efi files to iso
  await exec(`rsync -avx  ${efiWorkDir}boot ${isoDir}/`, this.echo)
  await exec(`rsync -avx ${efiWorkDir}efi  ${isoDir}/`, this.echo)

  // Do the main grub.cfg (which gets loaded last):

  // grub.theme.cfg
  let grubThemeSrc = path.resolve(__dirname, `../../addons/${theme}/theme/livecd/grub.theme.cfg`)
  if (this.theme.includes('/')) {
    grubThemeSrc = `${theme}/theme/livecd/grub.theme.cfg`
  }

  const grubThemeDest = `${isoDir}/boot/grub/theme.cfg`
  if (!fs.existsSync(grubThemeSrc)) {
    Utils.warning('Cannot find: ' + grubThemeSrc)
    process.exit()
  }

  fs.copyFileSync(grubThemeSrc, grubThemeDest)

  /**
  * prepare grub.cfg from grub.main.cfg
  */

  let grubTemplate = `${theme}/theme/livecd/grub.main.cfg`
  if (!fs.existsSync(grubTemplate)) {
    // grubTemplate = path.resolve(__dirname, '../../addons/templates/grub.main.cfg')
    grubTemplate = path.resolve(__dirname, '../../addons/eggs/theme/livecd/grub.main.cfg')
  }

  if (!fs.existsSync(grubTemplate)) {
    Utils.warning('Cannot find: ' + grubTemplate)
    process.exit()
  }
  const kernel_parameters = this.kernelParameters()
  const grubDest = `${isoDir}/boot/grub/grub.cfg`
  const template = fs.readFileSync(grubTemplate, 'utf8')

  const view = {
    fullname: this.settings.remix.fullname.toUpperCase(),
    kernel: Utils.kernelVersion(),
    vmlinuz: `/live${this.settings.vmlinuz}`,
    initrdImg: `/live${this.settings.initrdImg}`,
    kernel_parameters: kernel_parameters,
  }
  fs.writeFileSync(grubDest, mustache.render(template, view))

  /**
  * loopback.cfg
  */
  fs.writeFileSync(`${isoDir}/boot/grub/loopback.cfg`, 'source /boot/grub/grub.cfg\n')

  // console.log('end makeEfi')
  // process.exit()
}

// #######################################################################################

/**
 * makeDotDisk
 */
makeDotDisk(info = '', mksquashfs = '', mkisofs = '') {
  if (this.verbose) {
    console.log('Ovary: makeDotDisk')
  }

  const dotDisk = this.settings.iso_work + '.disk'
  if (fs.existsSync(dotDisk)) {
    shx.rm('-rf', dotDisk)
  }
  shx.mkdir('-p', dotDisk)
  let text = `# Created at: ${Utils.formatDate(new Date())}\n`
  text += `# penguins_eggs v. ${Utils.getPackageVersion()}\n`

  // .disk/info
  fs.writeFileSync(dotDisk + '/info', text, 'utf-8')

  // .disk/mksquashfs
  fs.writeFileSync(dotDisk + '/mksquashfs', text + mksquashfs, 'utf-8')

  // .disk/mkisofs
  fs.writeFileSync(dotDisk + '/mkisofs', text + mkisofs, 'utf-8')
}

/**
 *
 * @param cryptedclone
 * @returns cmd 4 mkiso
 */
xorrisoCommand(clone = false, cryptedclone = false): string {
  if (this.verbose) {
    console.log('Ovary: xorrisoCommand')
  }

  const volid = Utils.getVolid(this.settings.remix.name)

  let prefix = this.settings.config.snapshot_prefix

  let typology = ''
  // typology is applied only with standard egg-of
  if (prefix.slice(0, 7) === 'egg-of_') {
    if (clone) {
      typology = '_clone'
    } else if (cryptedclone) {
      typology = '_crypted'
    }

    if (fs.existsSync('/usr/bin/eui-start.sh')) {
      typology += "_EUI"
    }
  }

  const postfix = Utils.getPostfix()
  this.settings.isoFilename = prefix + volid + '_' + Utils.uefiArch() + typology + postfix
  // 
  const output = this.settings.config.snapshot_mnt + this.settings.isoFilename

  let command = ''
  // const appid = `-appid "${this.settings.distro.distroId}" `
  // const publisher = `-publisher "${this.settings.distro.distroId}/${this.settings.distro.codenameId}" `
  // const preparer = '-preparer "prepared by eggs <https://penguins-eggs.net>" '

  let isoHybridMbr = ''
  if (this.settings.config.make_isohybrid) {
    const isolinuxFile = this.settings.distro.isolinuxPath + 'isohdpfx.bin'
    if (fs.existsSync(isolinuxFile)) {
      isoHybridMbr = `-isohybrid-mbr ${isolinuxFile}`
    } else {
      Utils.warning(`Can't create isohybrid image. File: ${isolinuxFile} not found. \nThe resulting image will be a standard iso file`)
    }
  }

  // uefi_opt="-uefi_elToritoAltBoot-alt-boot -e boot/grub/efiboot.img -isohybrid-gpt-basdat -no-emul-boot"
  let uefi_elToritoAltBoot = ''
  let uefi_e = ''
  let uefi_isohybridGptBasdat = ''
  let uefi_noEmulBoot = ''
  if (this.settings.config.make_efi) {
    uefi_elToritoAltBoot = '-eltorito-alt-boot'
    uefi_e = '-e boot/grub/efiboot.img'
    uefi_isohybridGptBasdat = '-isohybrid-gpt-basdat'
    uefi_noEmulBoot = '-no-emul-boot'
  }

  /**
    * info Debian GNU/Linux 10.8.0 "Buster" - Official i386 NETINST 20210206-10:54
    * mkisofs xorriso -as mkisofs
    * -r
    * -checksum_algorithm_iso md5,sha1,sha256,sha512
    * -V 'Debian 10.8.0 i386 n'
    * -o /srv/cdbuilder.debian.org/dst/deb-cd/out/2busteri386/debian-10.8.0-i386-NETINST-1.iso
    *       -jigdo-jigdo /srv/cdbuilder.debian.org/dst/deb-cd/out/2busteri386/debian-10.8.0-i386-NETINST-1.jigdo
    *       -jigdo-template /srv/cdbuilder.debian.org/dst/deb-cd/out/2busteri386/debian-10.8.0-i386-NETINST-1.template
    *       -jigdo-map Debian=/srv/cdbuilder.debian.org/src/ftp/debian/
    *       -jigdo-exclude boot1
    *       -md5-list /srv/cdbuilder.debian.org/src/deb-cd/tmp/2busteri386/buster/md5-check
    *       -jigdo-min-file-size 1024
    *       -jigdo-exclude 'README*'
    *       -jigdo-exclude /doc/
    *       -jigdo-exclude /md5sum.txt
    *       -jigdo-exclude /.disk/
    *       -jigdo-exclude /pics/
    *       -jigdo-exclude 'Release*'
    *       -jigdo-exclude 'Packages*'
    *       -jigdo-exclude 'Sources*'
    * -J
    * -joliet-long
    * -cache-inodes
    * -isohybrid-mbr syslinux/usr/lib/ISOLINUX/isohdpfx.bin
    * -b isolinux/isolinux.bin
    * -c isolinux/boot.cat
    * -boot-load-size 4
    * -boot-info-table
    * -no-emul-boot
    * -uefi_elToritoAltBoot-alt-boot
    * -e boot/grub/efi.img
    * -no-emul-boot
    * -isohybrid-gpt-basdat
    *         isohybrid-apm-hfsplus
    * boot1 CD1
 
  command = `xorriso -as mkisofs \
   -r \
   -checksum_algorithm_iso md5,sha1,sha256,sha512 \
   -V ${volid} \
   -o ${output} \
   -J \
   -joliet-long \
   -cache-inodes  \
   ${isoHybridMbr} \
   -b isolinux/isolinux.bin \
   -c isolinux/boot.cat \
   -boot-load-size 4 \
   -boot-info-table \
   -no-emul-boot \
   ${uefi_eltoritoAltBoot} \
   ${uefi_e} \
   ${uefi_noEmulBoot} \
   ${uefi_isohybridGptBasdat}
   ${this.settings.iso_work}`
  */

  /**
   * how is made in refracta
   *
   * -isohybrid-mbr /usr/lib/ISOLINUX/isohdpfx.bin
   * uefi_opt="-eltorito-alt-boot -e boot/grub/efiboot.img -isohybrid-gpt-basdat -no-emul-boot"
   *
   * xorriso -as mkisofs -r \
   * -J \
   * -joliet-long \
   * -l \
   * -iso-level 3 \
   * ${isohybrid_opt} \
   * -partition_offset 16 \
   * -V "$volid" \
   * -b isolinux/isolinux.bin \
   * -c isolinux/boot.cat \
   * -no-emul-boot \
   * -boot-load-size 4 \
   * -boot-info-table \
   * ${uefi_opt} \
   * -o "$snapshot_dir"/"$filename" iso/
   */
  command = `xorriso -as mkisofs \
     -J \
     -joliet-long \
     -l \
     -iso-level 3 \
     ${isoHybridMbr} \
     -partition_offset 16 \
     -V ${volid} \
     -b isolinux/isolinux.bin \
     -c isolinux/boot.cat \
     -no-emul-boot \
     -boot-load-size 4 \
     -boot-info-table \
     ${uefi_elToritoAltBoot} \
     ${uefi_e} \
     ${uefi_isohybridGptBasdat} \
     ${uefi_noEmulBoot} \
     -o ${output} ${this.settings.iso_work}`

  return command
}

  /**
   * makeIso
   * cmd: cmd 4 xorirriso
   */
  async makeIso(cmd: string, scriptOnly = false) {
  // echo = { echo: true, ignore: false }
  if (this.verbose) {
    console.log('Ovary: makeIso')
  }

  Utils.writeX(`${this.settings.work_dir.ovarium}mkisofs`, cmd)
  if (!scriptOnly) {
    const test = (await exec(cmd, Utils.setEcho(true))).code
    if (test !== 0) {
      process.exit()
    }

    // Create link to iso
    const src = this.settings.config.snapshot_mnt + this.settings.isoFilename
    const dest = this.settings.config.snapshot_dir + this.settings.isoFilename
    await exec(`ln -s ${src} ${dest}`)

    // Create md5sum, sha256sum
    if (this.settings.config.make_md5sum) {
      Utils.warning('creating md5, sha256')
      await exec(`md5sum ${src} > ${dest.replace('.iso', '.md5')}`)
      await exec(`sha256sum ${src} > ${dest.replace('.iso', '.sha256')}`)
    }
  }
}

/**
 * finished = show the results
 * @param scriptOnly
 */
finished(scriptOnly = false) {
  Utils.titles('produce')
  if (!scriptOnly) {
    console.log('eggs is finished!\n\nYou can find the file iso: ' + chalk.cyanBright(this.settings.isoFilename) + '\nin the nest: ' + chalk.cyanBright(this.settings.config.snapshot_dir) + '.')
  } else {
    console.log('eggs is finished!\n\nYou can find the scripts to build iso: ' + chalk.cyanBright(this.settings.isoFilename) + '\nin the ovarium: ' + chalk.cyanBright(this.settings.config.snapshot_dir) + '.')
    console.log('usage')
    console.log(chalk.cyanBright(`cd ${this.settings.config.snapshot_dir}`))
    console.log(chalk.cyanBright('sudo ./bind'))
    console.log('Make all yours modifications in the directories filesystem.squashfs and iso.')
    console.log('After when you are ready:')
    console.log(chalk.cyanBright('sudo ./mksquashfs'))
    console.log(chalk.cyanBright('sudo ./mkisofs'))
    console.log(chalk.cyanBright('sudo ./ubind'))
    console.log('happy hacking!')
  }

  console.log()
  console.log('Remember, on liveCD user = ' + chalk.cyanBright(this.settings.config.user_opt) + '/' + chalk.cyanBright(this.settings.config.user_opt_passwd))
  console.log('                    root = ' + chalk.cyanBright('root') + '/' + chalk.cyanBright(this.settings.config.root_passwd))
}

  /**
  * fill
  */
  async usersFill(): Promise < Users[] > {
  if(this.verbose) {
  console.log('Ovary: usersFill')
}

const usersArray = []
await access('/etc/passwd', constants.R_OK | constants.W_OK)
const passwd = fs.readFileSync('/etc/passwd', 'utf-8').split('\n')
for (const element of passwd) {
  const line = element.split(':')
  const users = new Users(line[0], line[1], line[2], line[3], line[4], line[5], line[6])
  await users.getValues()
  if (users.password !== undefined) {
    usersArray.push(users)
  }
}

return usersArray
  }

  /**
   * END CLASS ovary
   */
}

/**
 * FUNCTIONS
 */

/**
 * Crea il path se non esiste
 * @param path
 */
async function makeIfNotExist(path: string, verbose = false): Promise<string> {
  if (verbose) {
    console.log(`Ovary: makeIfNotExist(${path})`)
  }

  const echo = Utils.setEcho(verbose)
  let cmd = `# ${path} alreasy exist`
  if (!fs.existsSync(path)) {
    cmd = `mkdir ${path} -p`
    await exec(cmd, echo)
  }

  return cmd
}

/**
 *
 * @param cmd
 * @param echo
 */
async function rexec(cmd: string, verbose = false): Promise<string> {
  if (verbose) {
    console.log(`Ovary: rexec(${cmd})`)
  }
  const echo = Utils.setEcho(verbose)

  const check = await exec(cmd, echo)
  if (!cmd.startsWith('umount')) { // skip umount errors
    if (check.code !== 0) {
      console.log(`eggs >>> error on command: ` + chalk.cyan(cmd) + ', code: ' + chalk.cyan(check.code))
    }
  }
  return cmd
}

/**
 * isMiso 
 */
function isMiso(distro: string): boolean {
  let found = false
  if ( (distro.includes('ManjaroLinux')) || 
        distro.toLowerCase().includes("biglinux") ) {
    found = true
  }
  return found
}

/**
 * se non zuppa, pan bagnato
 * @param distro 
 * @returns 
 */
function isArchiso(distro: string): boolean {
  return ! isMiso(distro) 
}
