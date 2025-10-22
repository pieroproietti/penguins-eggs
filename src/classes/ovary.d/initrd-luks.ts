/**
 * ./src/classes/ovary.d/initrd-luks.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

// packages
import fs from 'fs'
import path from 'node:path'

// classes
import { exec } from '../../lib/utils.js'
import Ovary from '../ovary.js'
import Utils from '../utils.js'


// _dirname
const __dirname = path.dirname(new URL(import.meta.url).pathname)


/**
 * Creates a streamlined initrd image for Debian/Ubuntu with LUKS support using mkinitramfs within a temporary chroot.
 * Copies the necessary unlock script, ensures losetup is included via a hook, and wraps /scripts/live for debugging.
 * Assumes live-boot and cryptsetup packages are installed in the chroot.
 * No cleanup of /etc modifications is performed as the chroot is temporary.
 * @param this - Ovary instance context
 * @param verbose - Whether to show verbose output
 */
export async function initrdDebianLuks(this: Ovary, verbose = false) {
    console.log();
    console.log('===========================================================================');
    console.log(`Creating ${this.initrd} for LUKS using mkinitramfs`);
    console.log('===========================================================================');

    // --- Core Paths & Config ---
    const chrootPath = path.join(this.dotMnt, 'filesystem.squashfs');
    const kernelVersion = this.kernel;
    const initrdBaseName = path.basename(this.initrd);
    const logBaseName = `${this.settings.config.snapshot_prefix}mkinitramfs.log.txt`;
    const finalInitrdDestPath = path.join(this.settings.iso_work, 'live', initrdBaseName); // Define final destination early for logging

    try {
        // --- 2. Prepare Chroot Environment ---
        Utils.warning("Preparing chroot environment...");
        Utils.info("Assuming 'live-boot', 'live-boot-initramfs-tools', 'cryptsetup' are installed in chroot.");

        // --- 2.1 Copy zz-eggs-luks-unlock.sh script ---
        {
            const unlockScriptName = 'zz-eggs-luks-unlock.sh'; // Corrected to lowercase zz-
            const srcUnlockScriptPath = path.join(__dirname, '../../../scripts', unlockScriptName);
            const chrootUnlockScriptDir = '/etc/initramfs-tools/scripts/live-premount';
            const chrootUnlockScriptPath = path.join(chrootUnlockScriptDir, unlockScriptName);
            const hostDestUnlockScriptDir = path.join(chrootPath, chrootUnlockScriptDir);
            const hostDestUnlockScriptPath = path.join(chrootPath, chrootUnlockScriptPath);

            if (!fs.existsSync(srcUnlockScriptPath)) {
                throw new Error(`Unlock script source not found: ${srcUnlockScriptPath}`);
            }
            await exec(`mkdir -p "${hostDestUnlockScriptDir}"`);
            await exec(`cp "${srcUnlockScriptPath}" "${hostDestUnlockScriptPath}"`);
            await exec(`chmod +x "${hostDestUnlockScriptPath}"`);
            Utils.success(`Copied unlock script to ${chrootUnlockScriptPath}`);
        }

        // --- 2.2 Create dummy /etc/crypttab if needed ---
        {
            const chrootCrypttabPath = '/etc/crypttab';
            const hostCrypttabPath = path.join(chrootPath, chrootCrypttabPath);
            if (!fs.existsSync(hostCrypttabPath)) {
                Utils.warning("Creating dummy /etc/crypttab for mkinitramfs hook...");
                const crypttabContent = "# Dummy entry to ensure cryptsetup is included\ncryptroot UUID=none none luks\n";
                fs.writeFileSync(hostCrypttabPath, crypttabContent, 'utf-8');
                // We might still want to clean this up, even if chroot is temp, to avoid side effects if reused
                // Consider adding a cleanup step outside the try/finally if needed
            } else {
                Utils.info("/etc/crypttab already exists.");
            }
        }

        // --- 2.3 Add losetup hook ---
        {
            const hookScriptName = 'add-losetup-hook.sh';
            const srcHookPath = path.join(__dirname, '../../../scripts', hookScriptName);
            const chrootHooksDirPath = '/etc/initramfs-tools/hooks';
            const hostHooksDirPath = path.join(chrootPath, chrootHooksDirPath);
            const hostHookPath = path.join(hostHooksDirPath, hookScriptName);

            Utils.warning(`Adding required losetup hook script to ${hostHooksDirPath}`);
            if (!fs.existsSync(srcHookPath)) {
                throw new Error(`Losetup hook script source not found: ${srcHookPath}`);
            }
            await exec(`mkdir -p "${hostHooksDirPath}"`);
            await exec(`cp "${srcHookPath}" "${hostHookPath}"`);
            await exec(`chmod +x "${hostHookPath}"`);
            Utils.success(`Copied and set executable hook: ${hostHookPath}`);
        }

        // --- 3. Execute mkinitramfs INSIDE Chroot ---
        {
            Utils.warning(`Running mkinitramfs for kernel ${kernelVersion} inside chroot...`);
            const chrootTmpInitrdPath = `/tmp/${initrdBaseName}`;
            const logFilePath = path.join(this.settings.iso_work, logBaseName);

            const mkinitramfsCmd = `mkinitramfs -v -o "${chrootTmpInitrdPath}" ${kernelVersion}`;
            const chrootCmd = `chroot "${chrootPath}" /bin/bash -c "${mkinitramfsCmd}" > "${logFilePath}" 2>&1`;

            await exec(chrootCmd, this.echo);
            Utils.success(`mkinitramfs completed. Log: ${logFilePath}`);
        }

        // --- 4. Move Result ---
        {
            const chrootTmpInitrdPath = `/tmp/${initrdBaseName}`; // Re-declare for scope
            const hostTmpInitrdPath = path.join(chrootPath, chrootTmpInitrdPath);

            if (fs.existsSync(hostTmpInitrdPath)) {
                Utils.info(`Moving generated initrd to ${finalInitrdDestPath}`);
                await exec(`mv "${hostTmpInitrdPath}" "${finalInitrdDestPath}"`);
                Utils.success(`Initrd moved successfully.`);
            } else {
                Utils.error(`Generated initrd not found at ${hostTmpInitrdPath}. Build failed!`);
                throw new Error("mkinitramfs did not produce the expected output file.");
            }
        }

    } catch (error) {
        Utils.error(`Error during LUKS initrd generation: ${error}`);
        const logFilePath = path.join(this.settings.iso_work, logBaseName); // Re-declare for scope
        if (error instanceof Error && error.message.includes('mkinitramfs inside chroot failed')) {
            Utils.warning(`Check mkinitramfs log: ${logFilePath}`);
        }
        // Cleanup dummy crypttab might still be desirable here if needed
        // const hostCrypttabPath = path.join(chrootPath, '/etc/crypttab');
        // if (fs.existsSync(hostCrypttabPath) && ...) { /* rm if dummy */ }
        throw error; // Re-throw error
    }

    Utils.warning(`Finished creating LUKS initrd: ${finalInitrdDestPath}`);
}