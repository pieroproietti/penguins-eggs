/**
 * ./src/classes/compressors.ts
 * penguins-eggs v.25.7.x / ECMAScript 2020
 * author: Piero Proietti (modified by Hossein Seilani)
 * license: MIT
 */

import { exec } from 'child_process';
import { promisify } from 'util';

/**
 * [CHANGE 1] Convert shell execution to async/await using promisify
 * Previously shx.exec was used which executes commands synchronously. 
 * Using execAsync allows us to await the completion of shell commands, 
 * making populate() and check() truly asynchronous, avoiding race conditions 
 * and ensuring reliability when checking compressors.
 */
const execAsync = promisify(exec);

export type Compressor = 'error' | 'gzip' | 'lz4' | 'lzma' | 'lzo' | 'xz' | 'zstd';

export default class Compressors {
  dest = '/tmp/eggs-mksquash-dest';
  source = '/tmp/eggs-mksquash-test';

  /**
   * [CHANGE 2] Define precise type for isEnabled and initialize all compressor flags
   * This provides TypeScript type safety, prevents undefined values, and ensures
   * that all compressors have a default enabled/disabled state. Previously, 
   * initialization was less strict, which could lead to runtime errors.
   */
  isEnabled: Record<Compressor, boolean> = {
    error: false,
    gzip: true,
    lz4: false,
    lzma: false,
    lzo: false,
    xz: false,
    zstd: false
  };

  /**
   * [CHANGE 3] Add debug flag
   * This allows optional logging of errors during checks, giving developers
   * visibility into why a compressor might be considered unavailable, while
   * keeping the default behavior silent to avoid confusing standard users.
   */
  debug = false;

  /**
   * Return fast compression command based on available compressors.
   * [CHANGE 4] Use helper method getCompressor to avoid repeating logic
   * across multiple methods (fast, pendrive). This reduces code duplication
   * and ensures consistent selection of compressors.
   */
  fast(): string {
    return this.getCompressor(['zstd', 'lz4', 'gzip'], '3');
  }

  /**
   * Return maximum compression command for the current CPU architecture.
   * [CHANGE 5] Dynamic selection of filter for ARM/x86 and improved readability.
   * This ensures that the resulting compressed files are optimized for the architecture.
   */
  max(): string {
    const filter = process.arch === 'arm64' ? 'arm' : 'x86';
    const options = '-b 1M -no-duplicates -no-recovery -always-use-fragments';
    return `xz -Xbcj ${filter} ${options}`;
  }

  /**
   * Return compression command suitable for pendrive usage.
   * [CHANGE 6] Use getCompressor to maintain consistent logic with fast() and
   * allow specifying compression level for zstd. Reduces repeated code and
   * improves maintainability.
   */
  pendrive(level = '15'): string {
    return this.getCompressor(['zstd', 'lz4', 'gzip'], level);
  }

  /**
   * Return standard compression command.
   * This is a fixed, safe option with moderate compression.
   */
  standard(): string {
    return 'xz -b 1M';
  }

  /**
   * Populate isEnabled flags by checking each compressor.
   * [CHANGE 7] Loop through all compressors instead of checking them one by one.
   * This reduces repetitive code, ensures all compressors are tested, and makes 
   * future maintenance easier if more compressors are added.
   */
  async populate() {
    await this.prepareCheck();

    const compressors: Compressor[] = ['error', 'lzma', 'lzo', 'lz4', 'xz', 'zstd'];
    for (const comp of compressors) {
      this.isEnabled[comp] = await this.check(comp);
    }

    await this.removeCheck();
  }

  /**
   * [CHANGE 8] New method added: status()
   * Provides the user/developer a simple way to see which compressors are available
   * and enabled. Improves UX by exposing internal state without accessing private fields.
   */
  status() {
    return this.isEnabled;
  }

  /**
   * Check if a given compressor is supported by mksquashfs.
   * [CHANGE 9] Use execAsync to run the shell command asynchronously and wait for completion.
   * [CHANGE 10] Log errors only if debug mode is enabled. This prevents confusing
   * silent failures while giving developers visibility when needed.
   */
  private async check(compressor: Compressor): Promise<boolean> {
    let result = false;
    try {
      const { stderr } = await execAsync(
        `mksquashfs ${this.source} ${this.dest} -comp ${compressor} -no-xattrs -ef ${this.dest}`
      );
      result = stderr === '';
    } catch (err) {
      if (this.debug) console.error(`[check] compressor=${compressor}`, err);
    }
    return result;
  }

  /**
   * Prepare the temporary source folder for compressor checks.
   * [CHANGE 11] Security improvement: Validate that source and dest paths
   * are under /tmp/eggs-mksquash-* to prevent accidental deletion of important directories.
   * [CHANGE 12] Use execAsync for asynchronous directory creation and removal.
   */
  private async prepareCheck() {
    if (!this.source.startsWith('/tmp/eggs-mksquash')) throw new Error('Invalid source path');
    if (!this.dest.startsWith('/tmp/eggs-mksquash')) throw new Error('Invalid dest path');

    await execAsync(`rm -rf ${this.source}`);
    await execAsync(`mkdir -p ${this.source}`);
  }

  /**
   * Remove temporary source folder and destination file after checks.
   * [CHANGE 13] Use async removal to ensure consistency with prepareCheck and
   * avoid blocking the event loop.
   */
  private async removeCheck() {
    await execAsync(`rm -rf ${this.source}`);
    await execAsync(`rm -f ${this.dest}`);
  }

  /**
   * Helper method to select the first available compressor from a preferred list.
   * [CHANGE 14] Consolidates logic for fast() and pendrive() to reduce code duplication.
   * Allows optional compression level for zstd.
   * This ensures a consistent compressor selection strategy across the class.
   */
  private getCompressor(preferred: Compressor[], level?: string): string {
    for (const comp of preferred) {
      if (this.isEnabled[comp]) {
        if (comp === 'zstd' && level) return `zstd -b 1M -Xcompression-level ${level}`;
        return comp;
      }
    }
    return 'gzip'; // fallback if no preferred compressor is enabled
  }
}
