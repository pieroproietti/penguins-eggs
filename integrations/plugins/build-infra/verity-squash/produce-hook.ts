/**
 * plugins/build-infra/verity-squash/produce-hook.ts
 *
 * Post-produce hook: wrap an eggs-produced SquashFS in dm-verity and sign
 * a UKI with Secure Boot keys.
 *
 * Usage in ovary.d/produce.ts:
 *   import { veritySignIso } from './integrations/verity-squash-hook.js'
 *
 *   // After mksquashfs completes:
 *   await veritySignIso(squashfsPath, efiDir, keyPath, exec, verbose)
 */

import { VeritySquash, VeritySquashOptions } from './verity-squash.js'

type ExecFn = (cmd: string, opts?: { capture?: boolean; echo?: boolean }) => Promise<{
  code: number
  data: string
  error?: string
}>

/**
 * Apply dm-verity + Secure Boot signing to an eggs-produced SquashFS image.
 *
 * @param squashfsPath  Path to the SquashFS rootfs image
 * @param efiDir        EFI partition directory (signed UKI written here)
 * @param keyPath       Path to the Secure Boot signing key (.key file)
 * @param exec          eggs exec function
 * @param verbose       Verbose output
 * @param opts          verity-squash-root options
 */
export async function veritySignIso(
  squashfsPath: string,
  efiDir: string,
  keyPath: string,
  exec: ExecFn,
  verbose: boolean,
  opts: VeritySquashOptions = {}
): Promise<{ rootHash: string; verityPath: string; efiPath: string }> {
  const verity = new VeritySquash(exec, verbose, { ...opts, ignoreWarnings: true })

  const missing = await verity.checkDependencies()
  if (missing.length > 0) {
    throw new Error(
      `verity-squash: missing dependencies: ${missing.join(', ')}\n` +
      'Install: apt install squashfs-tools cryptsetup-bin binutils sbsigntool openssl'
    )
  }

  console.log('verity-squash: generating dm-verity hash tree and signing UKI...')
  const result = await verity.produceVerifiedIso(squashfsPath, efiDir, keyPath)

  console.log(`verity-squash: root hash: ${result.rootHash}`)
  console.log(`verity-squash: verity tree: ${result.verityPath}`)
  console.log(`verity-squash: signed EFI: ${result.efiPath}`)

  return result
}

/**
 * Initialize verity-squash-root for a system (create keys, write config,
 * set up boot). Run once before the first verified build.
 */
export async function verityInit(
  exec: ExecFn,
  verbose: boolean,
  opts: VeritySquashOptions = {}
): Promise<void> {
  const verity = new VeritySquash(exec, verbose, { ...opts, ignoreWarnings: true })

  if (!(await verity.isAvailable())) {
    throw new Error(
      'verity-squash-root not installed.\n' +
      'Install from AUR: yay -S verity-squash-root\n' +
      'Or from CI packages: https://github.com/brandsimon/verity-squash-root-packages'
    )
  }

  console.log('verity-squash: creating Secure Boot keys...')
  const keys = await verity.createKeys()
  console.log(`verity-squash: keys created. Public keys tar: ${keys.publicKeysTar}`)
  console.log('verity-squash: import public_keys.tar into UEFI firmware to enable Secure Boot.')

  verity.writeConfig()
  console.log('verity-squash: config written to /etc/verity_squash_root/config.ini')

  await verity.setupBoot('systemd')
  console.log('verity-squash: systemd-boot configured.')
}
