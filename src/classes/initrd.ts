/**
 * penguins-eggs: initrd
 * author: Piero Proietti
 * mail: piero.proietti@gmail.com
 *
 * Schema from "refractasnapshot-10.2.10 (20191218)"
 * Copyright: fsmithred@gmail.com 2011-2019
 */

// packages
import fs from 'node:fs'
import shx from 'shelljs'
import {IInitrd} from '../interfaces/index'

/**
 * initrd
 * Controlla e rimuove, se necessario cryptroot, resume
 * cryptsetup
 */
export default class Initrd {
  workDir = '/tmp/initrd-extracted'
  compression = 'gzip'
  initrdSrc = '/initrd.img'
  initrdDest = '/home/eggs/ovarium/iso/live'
  fsLive = '/home/eggs/ovarium/filesystem'

  // const initrd = new Initrd(this.settings.initrd_image, `${this.settings.work_dir.pathIso}/live/initrd.img`, this.settings.work_dir.path)
  constructor(initrdSrc = '/initrd.img', initrdDest = '/home/eggs/ovarium/iso/live/initrd.img', fsLive = '/home/eggs/ovarium/filesystem') {
    this.initrdSrc = initrdSrc
    this.initrdDest = initrdDest
    this.fsLive = fsLive
    console.log('sorgente: ' + this.initrdSrc)
    console.log('destinazione: ' + this.initrdDest)
    console.log('fsLive: ' + this.fsLive)
  }

  /**
   * clean
   */
  clean() {
    this.extract()
    this.edit()
    this.rebuild()
  }

  /**
   * Check initrd for cryptroot, resume, cryptsetup.
   */
  check(): IInitrd {
    const initrd = {} as IInitrd

    const cmdCheck = `lsinitramfs ${this.initrdSrc} | egrep 'conf/conf.d/cryptroot|cryptroot/crypttab|conf/conf.d/resume|conf/conf.d/zz-resume-auto'`
    const check = shx.exec(cmdCheck, {silent: true})

    if (check.includes('conf/conf.d/cryptroot')) {
      initrd.cryptoroot = true
    }

    if (check.includes('cryptroot/crypttab')) {
      initrd.crypttab = true
    }

    if (check.includes('conf/conf.d/resume')) {
      initrd.resume = true
    }

    if (check.includes('conf/conf.d/zz-resume-auto')) {
      initrd.zz_resume_auto = true
    }

    return initrd
  }

  /**
   * extract
   */
  async extract(initrd = '/initrd.img', verbose = false) {
    let echo = {echo: false, ignore: false}
    if (verbose) {
      echo = {echo: true, ignore: false}
    }

    const savedState = process.cwd()

    // cancello e ricreo la cartella di lavore
    if (fs.existsSync(this.workDir)) {
      shx.exec(`rm ${this.workDir} -rf`)
    }

    shx.mkdir(this.workDir)
    process.chdir(this.workDir)

    // Verifico il tipo di compressione
    const cmd = `file -L ${this.initrdSrc} | egrep -o 'gzip compressed|XZ compressed|cpio archive'`
    const compressionShell = shx.exec(cmd).trimStart().trimEnd()
    switch (compressionShell) {
    case 'gzip compressed': {
      break
    }

    case 'xz compressed': {
      this.compression = 'xz'

      break
    }

    case 'cpio compressed': {
      this.compression = 'cpio'

      break
    }
      // No default
    }

    // Estratto initrd nella cartella di lavoro
    console.log('compression: [' + this.compression + ']')
    if ((this.compression = 'gzip')) {
      shx.exec(`zcat ${initrd} | cpio -i`)
    } else if (this.compression === 'xz') {
      shx.exec(`xzcat ${initrd} | cpio -d -i -m`)
    } else if (this.compression === 'cpio') {
      shx.exec(`(cpio -i ; zcat | cpio -i) < ${initrd}`)
    }

    process.chdir(savedState)
  }

  /**
   * edit
   */
  private edit(verbose = true) {
    // Analizzo per cryptroot
    if (fs.existsSync(`${this.workDir}/conf/conf.d/cryptroot`)) {
      console.log('Removing cryptroot')
      shx.exec(`rm -f ${this.workDir}/conf/conf.d/cryptroot`)
    } else if (fs.existsSync(`${this.workDir}/cryptroot/crypttab`)) {
      console.log('Removing crypttab')
      shx.exec(`rm -f ${this.workDir}/cryptroot/crypttab`)
    }

    // Analizzo per resume
    if (fs.existsSync(`${this.workDir}/conf/conf.d/resume`)) {
      console.log('Removing resume')
      shx.exec(`rm -f ${this.workDir}/conf/conf.d/resume`)
      shx.exec(`rm -f ${this.fsLive}/etc/initramfs-tools/conf.d/resume`)
    } else if (`${this.workDir}/conf/conf.d/zz-resume-auto`) {
      shx.exec(`rm -f ${this.workDir}/rm -f conf/conf.d/zz-resume-auto`)
      shx.exec(`rm -f ${this.fsLive}/etc/initramfs-tools/conf.d/resume`)
    }
  }

  /**
   * rebuild
   */
  private rebuild(initrd = '/initrd.img', verbose = true) {
    let echo = {echo: false, ignore: false}
    if (verbose) {
      echo = {echo: true, ignore: false}
    }

    const savedState = process.cwd()

    console.log('Compression: ' + this.compression)
    process.chdir(this.workDir)
    console.log('work_dir: ' + this.workDir)

    if (this.compression === 'gzip') {
      shx.exec(`find . -print0 | cpio -0 -H newc -o | gzip -c > ${this.initrdDest}`)
    } else if (this.compression === 'xz') {
      shx.exec(`find . | cpio -o -H newc | xz --check=crc32 --x86 --lzma2=dict=512KiB > ${this.initrdDest}`)
    }

    process.chdir(savedState)
  }
}
