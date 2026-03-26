/**
 * plugins/distribution/gentoo-installer/produce-hook.ts
 *
 * Pre-produce hook: prepare a Gentoo Stage3 rootfs for eggs produce.
 * Downloads, verifies, and extracts a Stage3 tarball, then applies
 * make.conf and profile so eggs can remaster it into a live ISO.
 */

import { GentooInstaller, GentooInstallerConfig } from './gentoo-installer.js'

type ExecFn = (cmd: string, opts?: { capture?: boolean; echo?: boolean }) => Promise<{
  code: number
  data: string
  error?: string
}>

/**
 * Prepare a Gentoo Stage3 rootfs directory for use as eggs produce source.
 * Returns the path to the extracted rootfs directory.
 */
export async function gentooStage3Rootfs(
  targetDir: string,
  exec: ExecFn,
  verbose: boolean,
  config: GentooInstallerConfig = {}
): Promise<string> {
  const installer = new GentooInstaller(exec, verbose, config)

  const stage3 = await installer.fetchLatestStage3()
  console.log(`gentoo: latest Stage3: ${stage3.filename}`)

  const stage3Path = await installer.downloadStage3('/var/cache/eggs/gentoo')
  await installer.extractStage3(stage3Path, targetDir)
  await installer.writeMakeConf(targetDir)
  await installer.selectProfile(targetDir)

  console.log(`gentoo: Stage3 rootfs ready: ${targetDir}`)
  return targetDir
}
