/**
 * ./src/krill/modules/locale.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

import fs from 'node:fs'

import Utils from '../../../classes/utils.js'
import { exec } from '../../../lib/utils.js'
import Sequence from '../../classes/sequence.js'

/**
 * locale
 */
export default async function locale(this: Sequence) {
  const defaultLocale = this.language
  if (this.distro.familyId === 'archlinux' || this.distro.familyId === 'debian') {
    /**
     * influcence: - /etc/default/locale
     *             - /etc/locale.conf
     *             - /etc/timezone
     */
    let file = this.installTarget + '/etc/default/locale'
    let content = ''
    content += `LANG=${defaultLocale}\n`
    content += `LC_CTYPE=${defaultLocale}\n`
    content += `LC_NUMERIC=${defaultLocale}\n`
    content += `LC_TIME=${defaultLocale}\n`
    content += `LC_COLLATE=${defaultLocale}\n`
    content += `LC_MONETARY=${defaultLocale}\n`
    content += `LC_MESSAGES=${defaultLocale}\n`
    content += `LC_PAPER=${defaultLocale}\n`
    content += `LC_NAME=${defaultLocale}\n`
    content += `LC_ADDRESS=${defaultLocale}\n`
    content += `LC_TELEPHONE=${defaultLocale}\n`
    content += `LC_MEASUREMENT=${defaultLocale}\n`
    content += `LC_IDENTIFICATION=${defaultLocale}\n`
    content += `LC_ALL=${defaultLocale}\n`
    Utils.write(file, content)

    // /etc/locale.conf
    file = this.installTarget + '/etc/locale.conf'
    Utils.write(file, content)

    // timezone Arch Debian
    if (fs.existsSync('/etc/localtime')) {
      const cmd = `chroot ${this.installTarget} unlink /etc/localtime ${this.toNull}`
      await exec(cmd, this.echo)
    }

    const cmd = `chroot ${this.installTarget} ln -sf /usr/share/zoneinfo/${this.region}/${this.zone} /etc/localtime ${this.toNull}`
    await exec(cmd, this.echo)
  } else if (this.distro.familyId === 'alpine') {
    // locale Alpine
    let file = this.installTarget + '/etc/profile.d/00locale.sh'
    let content = ''
    content += `#!/bin/sh\n`
    content += `export MUSL_LOCPATH="/usr/share/i18n/locales/musl"\n`
    content += `\n`
    content += `export LANG=${defaultLocale}\n`
    content += `export LC_CTYPE=${defaultLocale}\n`
    content += `export LC_NUMERIC=${defaultLocale}\n`
    content += `export LC_TIME=${defaultLocale}\n`
    content += `export LC_COLLATE=${defaultLocale}\n`
    content += `export LC_MONETARY=${defaultLocale}\n`
    content += `export LC_MESSAGES=${defaultLocale}\n`
    content += `export LC_PAPER=${defaultLocale}\n`
    content += `export LC_NAME=${defaultLocale}\n`
    content += `export LC_ADDRESS=${defaultLocale}\n`
    content += `export LC_TELEPHONE=${defaultLocale}\n`
    content += `export LC_MEASUREMENT=${defaultLocale}\n`
    content += `export LC_IDENTIFICATION=${defaultLocale}\n`
    content += `export LC_ALL=${defaultLocale}\n`
    Utils.write(file, content)
    await exec(`chmod +x ${file}`)

    /**
     * https://docs.alpinelinux.org/user-handbook/0.1a/Installing/manual.html
     */

    /**
     * timezone
     *
     */
    const tz = `/etc/zoneinfo/${this.region}/${this.zone}`
    await exec(`chroot ${this.installTarget} rm -rf /etc/zoneinfo/* ${this.toNull}`, this.echo)
    await exec(`chroot ${this.installTarget} mkdir -p ${tz} ${this.toNull}`, this.echo)

    file = `${this.installTarget}/etc/profile.d/timezone.sh`
    content = ''
    content += `#!/bin/sh\n`
    content += `export TZ='${tz}'`
    Utils.write(file, content)
    await exec(`chmod +x ${file} ${this.toNull}`)
  }
}
