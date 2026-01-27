/**
 * ./src/classes/ovary.d/make-efi.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import mustache from 'mustache'
// packages
import fs from 'node:fs'
import path from 'node:path'

// classes
import { exec } from '../../lib/utils.js'
import Diversions from '../diversions.js'
import Ovary from '../ovary.js'
import Utils from '../utils.js'

// _dirname
const __dirname = path.dirname(new URL(import.meta.url).pathname)

/**
 * @param this
 * @param theme
 */
export async function makeEfi(this: Ovary, theme = 'eggs') {
  const bootloaders = Diversions.bootloaders(this.familyId)

  /**
   * Define default paths based on arch
   */
  let signed = false
  let grubEfi = ''
  let shimEfi = ''

  // Default paths based on architecture
  switch (process.arch) {
    case 'arm64': {
      grubEfi = path.resolve(bootloaders, `grub/arm64-efi/monolithic/grubaa64.efi`)
      shimEfi = path.resolve(bootloaders, `shim/shimaa64.efi`)

      break
    }

    case 'ia32': {
      grubEfi = path.resolve(bootloaders, `grub/i386-efi/monolithic/grubia32.efi`)
      shimEfi = path.resolve(bootloaders, `shim/shimia32.efi`) // raramente usato non firmato

      break
    }

    case 'riscv64': {
      // Percorso per RISC-V (assumendo struttura simile)
      // Nota: Assicurati che Diversions.bootloaders punti al posto giusto o che i file esistano lì
      grubEfi = path.resolve(bootloaders, `grub/riscv64-efi/monolithic/grubriscv64.efi`)
      shimEfi = '' // Solitamente niente SHIM su RISC-V per ora

      break
    }

    case 'x64': {
      grubEfi = path.resolve(bootloaders, `grub/x86_64-efi/monolithic/grubx64.efi`)
      shimEfi = path.resolve(bootloaders, `shim/shimx64.efi`)

      break
    }
    // No default
  }

  /**
   * Gestione Secure Boot (Debian/Ubuntu/Devuan)
   */
  if (this.familyId === 'debian') {
    signed = true
    switch (process.arch) {
      case 'arm64': {
        grubEfi = path.resolve(bootloaders, `grub/arm64-efi-signed/grubaa64.efi.signed`)
        shimEfi = path.resolve(bootloaders, `shim/shimaa64.efi.signed`)

        break
      }

      case 'ia32': {
        grubEfi = path.resolve(bootloaders, `grub/i386-efi-signed/grubia32.efi.signed`)
        shimEfi = path.resolve(bootloaders, `shim/shimia32.efi.signed`)

        break
      }

      case 'riscv64': {
        // Per ora niente firma su RISC-V Debian, fallback su unsigned
        signed = false
        grubEfi = path.resolve(bootloaders, `grub/riscv64-efi/monolithic/grubriscv64.efi`)
        shimEfi = ''

        break
      }

      case 'x64': {
        grubEfi = path.resolve(bootloaders, `grub/x86_64-efi-signed/grubx64.efi.signed`)
        shimEfi = path.resolve(bootloaders, `shim/shimx64.efi.signed`)

        break
      }
      // No default
    }
  }

  // Safety check se i file non esistono (es. grub riscv non trovato)
  if (!fs.existsSync(grubEfi) && process.arch === 'riscv64') {
    // Fallback tentativo path alternativo o warning
    Utils.warning(`Warning: ${grubEfi} not found. Checking alternate paths...`)
  }

  if (signed) {
    Utils.warning(`Your live system ${this.distroId}/${process.arch} can boot with Secure Boot enabled`)
  } else {
    Utils.warning(`You must disable Secure Boot to boot live system ${this.distroId}/${process.arch}`)
  }

  // 2 secondi per leggere...
  await new Promise((resolve) => setTimeout(resolve, 2000))

  const efiPath = this.settings.efi_work
  const efiWorkDir = path.join(efiPath, '/work/')
  const efiMemdiskDir = path.join(efiPath, '/memdisk/')
  const efiImgMnt = path.join(efiPath, 'mnt')
  const isoDir = this.settings.iso_work

  // create (ISO)/boot/grub
  await exec(`mkdir ${path.join(isoDir, `/boot/grub/${Utils.uefiFormat()}`)} -p`, this.echo)

  // create (ISO)/EFI
  await exec(`mkdir ${isoDir}/EFI/boot -p`, this.echo)

  // Copy EFI binaries to ISO root
  if (shimEfi && fs.existsSync(shimEfi)) {
    await exec(`cp ${shimEfi} ${isoDir}/EFI/boot/${bootEfiName()}`, this.echo)
  }

  // Se non c'è shim (es. RISC-V), copiamo grub direttamente come boot<arch>.efi?
  // Solitamente se c'è shim: bootx64.efi = shim, grubx64.efi = grub
  // Se NO shim: bootx64.efi = grub
  if (!shimEfi || !fs.existsSync(shimEfi)) {
    await exec(`cp ${grubEfi} ${isoDir}/EFI/boot/${bootEfiName()}`, this.echo)
  } else {
    await exec(`cp ${grubEfi} ${isoDir}/EFI/boot/${grubEfiName()}`, this.echo)
  }

  // clean/create all in efiPath
  if (fs.existsSync(efiPath)) {
    await exec(`rm -rf ${efiPath}`)
  }

  await exec(`mkdir ${efiPath}`, this.echo)
  await exec(`mkdir ${efiMemdiskDir}`, this.echo)
  await exec(`mkdir ${efiImgMnt}`, this.echo)
  await exec(`mkdir ${efiWorkDir}`, this.echo)

  /**
   * create efi.img logic
   */

  // Seeker GRUB config: cerca il file .disk/id/UUID
  Utils.warning(`UUID used for boot search: ${this.uuid}`)
  let seeker = ''
  seeker += `search --file --set=root /.disk/id/${this.uuid}\n`
  seeker += 'set prefix=($root)/boot/grub\n'
  seeker += 'source $prefix/${grub_cpu}-efi/grub.cfg\n'

  // Fallback generico se la source fallisce (utile per debug)
  seeker += 'configfile ($root)/boot/grub/grub.cfg\n'

  /**
   * creating grub.cfg (1) seeker for usb on (efi.img)/boot/grub/grub.cfg
   */
  Utils.warning('creating grub.cfg seeker USB on (efi.img)/boot/grub')
  await exec(`mkdir ${path.join(efiMemdiskDir, '/boot/grub')} -p`, this.echo)
  const cfgSeekerUsb = `${efiMemdiskDir}/boot/grub/grub.cfg`
  let cfgSeekerUsbText = ''
  cfgSeekerUsbText += `# grub.cfg seeker\n`
  cfgSeekerUsbText += `# created on ${efiMemdiskDir}, path ${cfgSeekerUsb}\n`
  cfgSeekerUsbText += `\n`
  cfgSeekerUsbText += seeker
  Utils.write(cfgSeekerUsb, cfgSeekerUsbText)

  /**
   * create grub.cfg (bridge) on (ISO)/boot/grub/x86_64-efi/grub.cfg
   */
  Utils.warning(`creating grub.cfg bridge to main. (ISO)/boot/grub/${Utils.uefiFormat()}`)
  const cfgBridge = path.join(isoDir, '/boot/grub/', Utils.uefiFormat(), '/grub.cfg')
  let cfgBridgeText = `# grub.cfg bridge\n`
  if (!this.hidden) {
    cfgBridgeText += `# created on ${cfgBridge}\n`
  }

  cfgBridgeText += `\n`
  // Qui è dove l'architettura specifica punta al grub generico
  cfgBridgeText += `source /boot/grub/grub.cfg\n`
  fs.writeFileSync(cfgBridge, cfgBridgeText)



  /**
   * grub bait
   */
  let pathBait = path.join(isoDir, '/EFI/debian')
  if (this.distroLike === 'Ubuntu') {
    pathBait = path.join(isoDir, '/EFI/ubuntu')
  }

  await exec(`mkdir ${pathBait} -p`, this.echo)
  Utils.warning(`creating grub.cfg seeker ISO/DVD on (ISO)/EFI/${path.basename(pathBait)}`)
  const cfgBait = path.join(pathBait, '/grub.cfg')
  let cfgBaitText = ''
  cfgBaitText += `\n`
  cfgBaitText += seeker
  Utils.write(cfgBait, cfgBaitText)

  /**
   * creating grub.cfg configuration on (ISO)/EFI/boot/grub.cfg
   * This ensures fallback bootloader finds the config being in the same dir
   */
  const cfgEfiBoot = path.join(isoDir, 'EFI/boot/grub.cfg')
  Utils.write(cfgEfiBoot, cfgBaitText)

  /**
   * README.md
   */
  const baitReadme = path.join(pathBait, '/README.md')
  let baitReadmeText = ``
  if (this.distroLike !== 'Debian' && this.distroLike !== 'Ubuntu') {
    baitReadmeText += `# penguins-eggs\n`
    baitReadmeText += '\n'
    baitReadmeText += `This is just an hack, to let ${this.distroId} boot using Debian trixie bootloaders\n`
    fs.writeFileSync(baitReadme, baitReadmeText)
  }

  /**
   * creating structure efiWorkDir
   */
  await exec(`mkdir -p ${efiWorkDir}/boot/grub`, this.echo) // qua va grub.cfg 2
  await exec(`mkdir -p ${efiWorkDir}/EFI/boot`)

  /**
   * create tarred efiMemdiskDir (Legacy/Memdisk method)
   */
  const currentDir = process.cwd()
  process.chdir(efiMemdiskDir)
  await exec('tar -cvf memdisk boot', this.echo)
  process.chdir(currentDir)

  /**
   * Create boot image "boot/grub/efi.img"
   */
  const efiImg = path.join(efiWorkDir, `boot/grub/efi.img`)
  // Aumentato leggermente il size per sicurezza
  await exec(`dd if=/dev/zero of=${efiImg} bs=1M count=16`, this.echo)
  await exec(`/sbin/mkdosfs -F 16 ${efiImg}`, this.echo)
  await new Promise((resolve) => setTimeout(resolve, 500))

  // Use mtools to populate efi.img without mounting
  // 1. Create directories
  await exec(`mmd -i ${efiImg} ::/EFI`, this.echo)
  await exec(`mmd -i ${efiImg} ::/EFI/boot`, this.echo)
  await exec(`mmd -i ${efiImg} ::/boot`, this.echo)
  await exec(`mmd -i ${efiImg} ::/boot/grub`, this.echo)

  // 2. Copy grub.cfg to /boot/grub/grub.cfg
  await exec(`mcopy -i ${efiImg} ${cfgSeekerUsb} ::/boot/grub/grub.cfg`, this.echo)

  // 3. Copy EFI binaries
  if (shimEfi && fs.existsSync(shimEfi)) {
    await exec(`mcopy -i ${efiImg} ${shimEfi} ::/EFI/boot/${bootEfiName()}`, this.echo)
    await exec(`mcopy -i ${efiImg} ${grubEfi} ::/EFI/boot/${grubEfiName()}`, this.echo)
  } else {
    // Se no shim (RISC-V), grub diventa il boot loader principale
    await exec(`mcopy -i ${efiImg} ${grubEfi} ::/EFI/boot/${bootEfiName()}`, this.echo)
  }

  // 4. FIX CRUCIALE PER RISC-V (e compatibilità x86):
  // Copia il grub.cfg seeker ANCHE accanto al binario EFI in /EFI/boot/
  if (process.arch === 'riscv64') {
    await exec(`mcopy -i ${efiImg} ${cfgSeekerUsb} ::/EFI/boot/grub.cfg`, this.echo)
  }

  // Copy isoImg in ${${isoDir}/boot/grub
  Utils.warning('copyng (efi.img) on (ISO)/boot/grub')
  await exec(`cp ${efiImg} ${isoDir}/boot/grub`, this.echo)

  /**
   * creating grub.cfg (4) on (ISO)/boot/grub
   */
  Utils.warning('creating grub.cfg main on (ISO)/boot/grub')
  // splash.png
  let splashSrc = ''
  const splashDest = `${efiWorkDir}/boot/grub/splash.png`

  let themeSrc = ''
  const themeDest = `${isoDir}/boot/grub/theme.cfg`

  let grubTemplate = ''
  if (this.hidden) {
    splashSrc = path.resolve(__dirname, `../../../addons/${theme}/theme/livecd/generic-splash.png`)
    grubTemplate = path.resolve(__dirname, '../../../addons/eggs/theme/livecd/generic.grub.main.cfg')
    themeSrc = path.resolve(__dirname, '../../../addons/eggs/theme/livecd/generic.grub.theme.cfg')
  } else {
    // ... (resto della logica temi invariata)
    splashSrc = path.resolve(__dirname, `../../../addons/${theme}/theme/livecd/splash.png`)
    if (this.theme.includes('/')) {
      splashSrc = `${theme}/theme/livecd/splash.png`
    }

    if (!fs.existsSync(splashSrc)) {
      Utils.warning(`warning: ${splashSrc} does not exists`)
      process.exit(1)
    }

    // select themeSrc
    themeSrc = path.resolve(__dirname, `../../../addons/${theme}/theme/livecd/grub.theme.cfg`)
    if (this.theme.includes('/')) {
      themeSrc = `${theme}/theme/livecd/grub.theme.cfg`
    }

    if (!fs.existsSync(themeSrc)) {
      Utils.error(`error: ${themeSrc} does not exist`)
      process.exit(1)
    }

    // fonts... (invariato)
    if (fs.existsSync('/usr/share/grub/font.pf2')) {
      await exec(`cp /usr/share/grub/font.pf2 ${efiWorkDir}boot/grub/font.pf2`, this.echo)
    } else if (fs.existsSync('/usr/share/grub/unicode.pf2')) {
      await exec(`cp /usr/share/grub/unicode.pf2 ${efiWorkDir}boot/grub/font.pf2`, this.echo)
    } else if (fs.existsSync('/usr/share/grub/ascii.pf2')) {
      await exec(`cp /usr/share/grub/ascii.pf2 ${efiWorkDir}boot/grub/font.pf2`, this.echo)
    }

    // Copy workdir files to ISO/boot
    await exec(`rsync -avx  ${efiWorkDir}/boot ${isoDir}/`, this.echo)

    /**
     * prepare main grub.cfg from grub.main.cfg
     */
    grubTemplate = `${theme}/theme/livecd/grub.main.cfg`
    if (!fs.existsSync(grubTemplate)) {
      grubTemplate = path.resolve(__dirname, '../../../addons/eggs/theme/livecd/grub.main.cfg')
    }

    if (!fs.existsSync(grubTemplate)) {
      Utils.error(`error: ${grubTemplate} does not exist`)
      process.exit(1)
    }
  }

  // splash.png
  await exec(`cp ${splashSrc} ${splashDest}`, this.echo)

  // grub.theme.png
  fs.copyFileSync(themeSrc, themeDest)

  // grub.main.png
  const kernel_parameters = Diversions.kernelParameters(this.familyId, this.volid, this.fullcrypt)
  const cfgMain = path.join(isoDir, '/boot/grub/grub.cfg')
  const template = fs.readFileSync(grubTemplate, 'utf8')

  let fullname = this.settings.remix.fullname.toUpperCase()
  if (this.hidden) {
    fullname = 'LINUX'
  }

  /**
   * SMART KERNEL DETECTION FOR RISC-V
   * Invece di forzare ciecamante 'vmlinux', controlliamo cosa c'è davvero
   * nella cartella /live della ISO.
   * Questo supporta sia Debian (spesso vmlinux) che Ubuntu (vmlinuz).
   */
  let kernelName = path.basename(this.vmlinuz) // Nome originale rilevato dal sistema

  if (process.arch === 'riscv64') {
    const liveDir = path.join(isoDir, 'live')

    // Generiamo le due possibili varianti del nome
    const nameX = kernelName.replace('vmlinuz', 'vmlinux') // variante uncompressed
    const nameZ = kernelName.replace('vmlinux', 'vmlinuz') // variante compressed

    // Controllo esistenza fisica
    if (fs.existsSync(path.join(liveDir, nameX))) {
      kernelName = nameX // Abbiamo trovato vmlinux (Debian style)
    } else if (fs.existsSync(path.join(liveDir, nameZ))) {
      kernelName = nameZ // Abbiamo trovato vmlinuz (Ubuntu style)
    }
    // Se non trova nulla, mantiene l'originale kernelName come fallback
  }

  const view = {
    fullname,
    initrdImg: `/live/${path.basename(this.initrd)}`,
    kernel: this.kernel,
    kernel_parameters,
    vmlinuz: `/live/${kernelName}` // Usiamo il nome verificato
  }

  let cfgMainText = ''
  cfgMainText += `# grub.cfg (4) main\n`
  if (!this.hidden) {
    cfgMainText += `# created on ${cfgMain}`
  }

  cfgMainText += `\n`
  cfgMainText += mustache.render(template, view)
  fs.writeFileSync(cfgMain, cfgMainText)
}

/**
 * FUNCTIONS
 */

/**
 * @returns
 */
function bootEfiName(): string {
  let ben = ''
  switch (process.arch) {
    case 'arm64': {
      ben = 'bootaa64.efi'

      break
    }

    case 'ia32': {
      ben = 'bootia32.efi'

      break
    }

    case 'riscv64': {
      ben = 'bootriscv64.efi'

      break
    }

    case 'x64': {
      ben = 'bootx64.efi'

      break
    }
    // No default
  }

  return ben
}

/**
 * @returns
 */
function grubEfiName(): string {
  let gen = ''
  switch (process.arch) {
    case 'arm64': {
      gen = 'grubaa64.efi'

      break
    }

    case 'ia32': {
      gen = 'grubia32.efi' // c'era uno spazio typo nel tuo codice originale "grub ia32", corretto qui

      break
    }

    case 'riscv64': {
      gen = 'grubriscv64.efi'

      break
    }

    case 'x64': {
      gen = 'grubx64.efi'

      break
    }
    // No default
  }

  return gen
}
