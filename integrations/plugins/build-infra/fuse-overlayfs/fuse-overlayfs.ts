/**
 * plugins/build-infra/fuse-overlayfs/fuse-overlayfs.ts
 *
 * Rootless ISO build support via fuse-overlayfs.
 *
 * fuse-overlayfs (https://github.com/containers/fuse-overlayfs) implements
 * overlay+shiftfs in FUSE, enabling overlayfs semantics without kernel
 * privileges. This allows eggs produce to run inside rootless containers
 * (Podman, Docker --user, CI runners) where kernel overlayfs is unavailable.
 *
 * When kernel overlayfs is available (root build), this plugin is a no-op.
 * When running rootless, it transparently substitutes fuse-overlayfs.
 */

import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

type ExecFn = (cmd: string, opts?: { capture?: boolean; echo?: boolean }) => Promise<{
  code: number
  data: string
  error?: string
}>

export interface OverlayMount {
  /** Merged (unified) view of lower + upper. */
  merged: string
  /** Upper layer — writable changes land here. */
  upper: string
  /** Work directory required by overlayfs. */
  work: string
  /** Lower layer(s) — read-only base. */
  lower: string[]
  /** Whether fuse-overlayfs was used (vs kernel overlayfs). */
  usedFuse: boolean
}

export interface FuseOverlayfsOptions {
  /** UID mapping: host_uid:container_uid:count. */
  uidMapping?: string
  /** GID mapping: host_gid:container_gid:count. */
  gidMapping?: string
  /** Allow other users to access the mount. Default: false. */
  allowOther?: boolean
}

export class FuseOverlayfs {
  private exec: ExecFn
  private verbose: boolean
  private opts: FuseOverlayfsOptions

  constructor(exec: ExecFn, verbose = false, opts: FuseOverlayfsOptions = {}) {
    this.exec = exec
    this.verbose = verbose
    this.opts = opts
  }

  /**
   * Check if kernel overlayfs is available (requires root or user_ns).
   */
  async isKernelOverlayAvailable(): Promise<boolean> {
    // Try a quick test mount into a temp dir
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'eggs-ovl-test-'))
    const lower = path.join(tmp, 'lower')
    const upper = path.join(tmp, 'upper')
    const work = path.join(tmp, 'work')
    const merged = path.join(tmp, 'merged')
    for (const d of [lower, upper, work, merged]) fs.mkdirSync(d)

    const result = await this.exec(
      `mount -t overlay overlay -o lowerdir="${lower}",upperdir="${upper}",workdir="${work}" "${merged}" 2>/dev/null`,
      { capture: true }
    )

    if (result.code === 0) {
      await this.exec(`umount "${merged}" 2>/dev/null`, { capture: true })
    }
    fs.rmSync(tmp, { recursive: true, force: true })
    return result.code === 0
  }

  /**
   * Check if fuse-overlayfs is available on PATH.
   */
  async isFuseOverlayfsAvailable(): Promise<boolean> {
    const result = await this.exec('command -v fuse-overlayfs', { capture: true })
    return result.code === 0
  }

  /**
   * Check if /dev/fuse exists (required for any FUSE mount).
   */
  async isDevFuseAvailable(): Promise<boolean> {
    return fs.existsSync('/dev/fuse')
  }

  /**
   * Mount an overlay filesystem, using fuse-overlayfs if kernel overlayfs
   * is unavailable.
   *
   * @param lower   One or more read-only lower directories (colon-separated in kernel mode)
   * @param upper   Writable upper directory
   * @param work    Work directory (must be on same filesystem as upper)
   * @param merged  Mount point for the unified view
   */
  async mount(
    lower: string[],
    upper: string,
    work: string,
    merged: string
  ): Promise<OverlayMount> {
    for (const d of [upper, work, merged]) {
      fs.mkdirSync(d, { recursive: true })
    }

    const lowerStr = lower.join(':')
    const useKernel = await this.isKernelOverlayAvailable()

    if (useKernel) {
      if (this.verbose) console.log('fuse-overlayfs: using kernel overlayfs')
      await this.exec(
        `mount -t overlay overlay -o lowerdir="${lowerStr}",upperdir="${upper}",workdir="${work}" "${merged}"`,
        { echo: this.verbose }
      )
      return { merged, upper, work, lower, usedFuse: false }
    }

    // Fall back to fuse-overlayfs
    if (!(await this.isFuseOverlayfsAvailable())) {
      throw new Error(
        'Neither kernel overlayfs nor fuse-overlayfs is available.\n' +
        'Install fuse-overlayfs:\n' +
        '  Debian/Ubuntu: apt install fuse-overlayfs\n' +
        '  Arch: pacman -S fuse-overlayfs\n' +
        '  Fedora: dnf install fuse-overlayfs\n' +
        'Or run eggs as root to use kernel overlayfs.'
      )
    }

    if (!(await this.isDevFuseAvailable())) {
      throw new Error(
        '/dev/fuse not found. Create it with:\n' +
        '  mknod /dev/fuse -m 0666 c 10 229\n' +
        'Or install fuse3 via your package manager.'
      )
    }

    if (this.verbose) console.log('fuse-overlayfs: kernel overlayfs unavailable, using fuse-overlayfs')

    const fuseArgs: string[] = [
      '-o', `lowerdir=${lowerStr},upperdir=${upper},workdir=${work}`,
    ]

    if (this.opts.uidMapping) {
      fuseArgs.push('-o', `uidmapping=${this.opts.uidMapping}`)
    }
    if (this.opts.gidMapping) {
      fuseArgs.push('-o', `gidmapping=${this.opts.gidMapping}`)
    }
    if (this.opts.allowOther) {
      fuseArgs.push('-o', 'allow_other')
    }

    fuseArgs.push(merged)

    await this.exec(`fuse-overlayfs ${fuseArgs.join(' ')}`, { echo: this.verbose })

    return { merged, upper, work, lower, usedFuse: true }
  }

  /**
   * Unmount an overlay filesystem (kernel or FUSE).
   */
  async umount(mount: OverlayMount): Promise<void> {
    if (mount.usedFuse) {
      // FUSE unmount via fusermount3 or fusermount
      const fusermount = await this.exec('command -v fusermount3', { capture: true })
      const cmd = fusermount.code === 0 ? 'fusermount3' : 'fusermount'
      await this.exec(`${cmd} -u "${mount.merged}"`, { echo: this.verbose })
    } else {
      await this.exec(`umount "${mount.merged}"`, { echo: this.verbose })
    }
  }

  /**
   * Wrap the eggs produce rootfs assembly in a fuse-overlayfs mount.
   *
   * Creates a temporary overlay over the source rootfs so that the
   * squashfs/dwarfs/erofs packing step sees a unified view without
   * modifying the source.
   *
   * @param sourceRootfs  Read-only source rootfs directory
   * @param workDir       Temporary work directory for overlay state
   * @returns             Path to the merged overlay (pass to mksquashfs/mkdwarfs/mkfs.erofs)
   */
  async wrapRootfs(sourceRootfs: string, workDir: string): Promise<{
    mergedPath: string
    mount: OverlayMount
    cleanup: () => Promise<void>
  }> {
    const upper = path.join(workDir, 'overlay-upper')
    const work = path.join(workDir, 'overlay-work')
    const merged = path.join(workDir, 'overlay-merged')

    const mount = await this.mount([sourceRootfs], upper, work, merged)

    const cleanup = async () => {
      await this.umount(mount)
    }

    return { mergedPath: merged, mount, cleanup }
  }
}
