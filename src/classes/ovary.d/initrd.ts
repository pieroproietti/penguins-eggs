/**
 * ./src/classes/ovary.d/initrd.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

// packages
import mustache from 'mustache'
import fs from 'fs'
import path from 'node:path'

// classes
import { exec } from '../../lib/utils.js'
import Ovary from '../ovary.js'
import Utils from '../utils.js'
import Diversions from '../diversions.js'

// _dirname
const __dirname = path.dirname(new URL(import.meta.url).pathname)

/**
 * initrdAlpine
 */
export async function initrdAlpine(this: Ovary) {
    Utils.warning(`creating ${path.basename(this.initrd)} Alpine on (ISO)/live`)
    let initrdImg = Utils.initrdImg()
    initrdImg = initrdImg.slice(Math.max(0, initrdImg.lastIndexOf('/') + 1))
    const pathConf = path.resolve(__dirname, `../../../mkinitfs/live.conf`)
    const prefix = this.settings.config.snapshot_prefix
    const log = `> ${this.settings.iso_work}${prefix}mkinitfs.log.txt 2>&1`
    const cmd = `mkinitfs -c ${pathConf} -o ${this.settings.iso_work}live/${initrdImg} ${this.kernel} ${log}`
    await exec(cmd, this.echo)
}


/**
 * initrdArch
 */
export async function initrdArch(this: Ovary) {
    Utils.warning(`creating ${path.basename(this.initrd)} using mkinitcpio on (ISO)/live`)

    let dirConf = 'arch'
    let tool = 'archiso'
    let hookSrc = '/usr/lib/initcpio/hooks/archiso_pxe_http'
    let hookDest = '/etc/initcpio/hooks/archiso_pxe_http'
    let edit = `sed -i 's/export copytoram="y"/# export copytoram="y"/' ${hookDest}`
    if (Diversions.isManjaroBased(this.distroId)) {
        dirConf = 'manjaro'
        tool = 'miso'
        hookSrc = `/etc/initcpio/hooks/miso_pxe_http`
        hookDest = hookSrc
        edit = `sed -i 's/copytoram="y"/# copytoram="y"/' ${hookDest}`
        if (this.distroId === "Biglinux" || this.distroId === "Bigcommunity") {
            dirConf = 'biglinux'
        }
    }

    const restore = fs.existsSync(hookDest)
    const pathConf = path.resolve(__dirname, `../../../mkinitcpio/${dirConf}`)
    const fileConf = pathConf + '/live.conf'
    let hookSaved = `/tmp/${path.basename(hookSrc)}`
    if (hookSrc !== hookDest) {
        await exec(`cp ${hookSrc} ${hookDest}`)
    }
    await exec(`cp ${hookSrc} ${hookSaved}`)
    await exec(edit, this.echo)
    const prefix = this.settings.config.snapshot_prefix
    const log = `> ${this.settings.iso_work}${prefix}mkinitcpio.log.txt 2>&1`
    let cmd = `mkinitcpio -c ${fileConf} -g ${this.settings.iso_work}live/${path.basename(this.initrd)} -k ${this.kernel} ${log}`
    await exec(cmd, this.echo)
    await exec(`rm -f ${hookDest}`)
    if (restore) {
        await exec(`cp ${hookSaved} ${hookDest}`)
    }
    await exec(`rm -f ${hookSaved}`)
}


/**
 * Creates an initrd image for Debian/Ubuntu with LUKS support using mkinitramfs within a chroot environment.
 * Includes necessary modules (dm-crypt, loop) and tools (losetup) for unlocking LUKS volumes from files.
 * @param this - Ovary instance context
 * @param verbose - Whether to show verbose output
 */
export async function initrdDebianLuks(this: Ovary, verbose = false) {
    Utils.warning(`creating ${this.initrd} for LUKS using mkinitramfs inside chroot`);

    // --- 1. Define Correct Paths ---
    const chrootPath = path.join(this.dotMnt, 'filesystem.squashfs');

    const unlockScriptName = 'ZZ-eggs-luks-unlock.sh';
    const srcUnlockScriptPath = path.join(__dirname, '../../../scripts', unlockScriptName); // Path on host

    // Paths *inside* the chroot (relative to '/')
    const chrootUnlockScriptDir = '/etc/initramfs-tools/scripts/live-premount';
    const chrootUnlockScriptPath = path.join(chrootUnlockScriptDir, unlockScriptName);
    const chrootCrypttabPath = '/etc/crypttab';
    const chrootTmpInitrdPath = `/tmp/${path.basename(this.initrd)}`; // Temporary output path INSIDE chroot
    const chrootModulesFilePath = '/etc/initramfs-tools/modules'; // Path to the modules FILE
    const chrootHooksDirPath = '/etc/initramfs-tools/hooks'; // Path to the hooks DIRECTORY

    // Paths *outside* the chroot
    const finalInitrdDestPath = path.join(this.settings.iso_work, 'live', path.basename(this.initrd)); // Final path on host ISO structure
    const logFilePath = path.join(this.settings.iso_work, `${this.settings.config.snapshot_prefix}mkinitramfs.log.txt`);

    // Host paths corresponding to chroot paths for file operations
    const hostCrypttabPath = path.join(chrootPath, chrootCrypttabPath);
    const hostModulesFilePath = path.join(chrootPath, chrootModulesFilePath);
    const hostHooksDirPath = path.join(chrootPath, chrootHooksDirPath);

    // Hook script details
    const hookScriptName = 'add-losetup-hook.sh';
    const srcHookPath = path.join(__dirname, '../../../scripts', hookScriptName); // Assumes hook is in scripts dir
    const hostHookPath = path.join(hostHooksDirPath, hookScriptName); // Final destination on host fs (inside chroot structure)

    let originalModulesContent = ''; // To store original content for cleanup
    let modulesModified = false;
    let hookAdded = false;
    let dummyCrypttabCreated = false;

    try {
        // --- 2. Prepare Chroot Environment ---
        Utils.warning("Preparing chroot environment...");

        // --- 2.1 Copy unlock script into chroot ---
        const hostDestUnlockScriptDir = path.join(chrootPath, chrootUnlockScriptDir); // Real path on host filesystem
        const hostDestUnlockScriptPath = path.join(chrootPath, chrootUnlockScriptPath);
        await exec(`mkdir -p "${hostDestUnlockScriptDir}"`);
        await exec(`cp "${srcUnlockScriptPath}" "${hostDestUnlockScriptPath}"`);
        await exec(`chmod +x "${hostDestUnlockScriptPath}"`);
        Utils.success(`Copied and set executable: ${chrootUnlockScriptPath} (inside chroot)`);


        // --- 2.2 Manage dummy crypttab inside chroot ---
        if (!fs.existsSync(hostCrypttabPath)) {
            Utils.warning("Creating dummy /etc/crypttab inside chroot...");
            dummyCrypttabCreated = true;
            let crypttabContent = "# <target name> <source device> <key file> <options>\n";
            crypttabContent += "cryptroot UUID=none none luks,discard\n";
            fs.writeFileSync(hostCrypttabPath, crypttabContent, 'utf-8');
        } else {
            Utils.warning("/etc/crypttab already exists inside chroot, leaving it untouched.");
        }


        // --- 2.3 Add Modules dm-crypt, loop in /etc/initramfs-tools/modules ---
        Utils.warning(`Temporarily adding dm-crypt and loop to ${hostModulesFilePath}`);
        if (fs.existsSync(hostModulesFilePath)) {
            originalModulesContent = fs.readFileSync(hostModulesFilePath, 'utf-8'); // Backup original
            let modulesContent = originalModulesContent;
            if (!modulesContent.includes('dm-crypt')) {
                 modulesContent += 'dm-crypt\n';
            }
            if (!modulesContent.includes('loop')) {
                 modulesContent += 'loop\n';
            }
            if (modulesContent !== originalModulesContent) {
                fs.writeFileSync(hostModulesFilePath, modulesContent, 'utf-8');
                modulesModified = true;
                Utils.success("Modules added.");
            } else {
                 Utils.warning("Modules already present in file.");
            }
        } else {
             Utils.warning(`${hostModulesFilePath} does not exist. Creating and adding modules.`);
             originalModulesContent = ''; // Mark as created from scratch
             fs.writeFileSync(hostModulesFilePath, 'dm-crypt\nloop\n', 'utf-8');
             modulesModified = true; // Needs cleanup (removal or restoring empty)
        }


        // --- 2.4 Add hook add-losetup-hook.sh ---
        Utils.warning(`Adding losetup hook script to ${hostHooksDirPath}`);
        if (!fs.existsSync(srcHookPath)) {
            Utils.error(`Hook script source not found: ${srcHookPath}`);
            throw new Error(`Hook script source not found: ${srcHookPath}`);
        }
        await exec(`mkdir -p "${hostHooksDirPath}"`); // Ensure hooks dir exists
        await exec(`cp "${srcHookPath}" "${hostHookPath}"`);
        await exec(`chmod +x "${hostHookPath}"`);
        hookAdded = true;
        Utils.success(`Copied and set executable hook: ${hostHookPath}`);


        // --- 3. Execute mkinitramfs INSIDE Chroot ---
        Utils.warning(`Running mkinitramfs inside chroot: ${chrootPath}`);
        const mkinitramfsCmd = `mkinitramfs -v -o "${chrootTmpInitrdPath}" ${this.kernel}`;
        const chrootCmd = `chroot "${chrootPath}" /bin/bash -c "${mkinitramfsCmd}" > "${logFilePath}" 2>&1`;

        await exec(chrootCmd, this.echo);
        Utils.success(`mkinitramfs completed. Log: ${logFilePath}`);


        // --- 4. Move Result ---
        const hostTmpInitrdPath = path.join(chrootPath, chrootTmpInitrdPath); // Real path on host
        if (fs.existsSync(hostTmpInitrdPath)) {
            Utils.warning(`Moving generated initrd from ${hostTmpInitrdPath} to ${finalInitrdDestPath}`);
            await exec(`mv "${hostTmpInitrdPath}" "${finalInitrdDestPath}"`);
            Utils.success(`Initrd moved successfully.`);
        } else {
            Utils.error(`Generated initrd not found at ${hostTmpInitrdPath}. Build failed!`);
            throw new Error("mkinitramfs did not produce the expected output file.");
        }

    } catch (error) {
        Utils.error(`Error during LUKS initrd generation: ${error}`);
        if (error instanceof Error && error.message.includes('mkinitramfs inside chroot failed')) {
             Utils.warning(`Please check the mkinitramfs log for details: ${logFilePath}`);
        }
        throw error; // Re-throw the error after logging
    } finally {
        // --- 5. Cleanup ---
        Utils.warning("Cleaning up temporary modifications...");

        // 5.1 Cleanup dummy crypttab
        if (dummyCrypttabCreated) {
            try {
                await exec(`rm -f "${hostCrypttabPath}"`);
                Utils.success("Cleaned up dummy /etc/crypttab.");
            } catch (cleanupError) {
                Utils.warning(`Failed to cleanup dummy /etc/crypttab: ${cleanupError}`);
            }
        }

        // 5.2 Cleanup modules file
        if (modulesModified) {
            try {
                if (originalModulesContent === '') {
                     // If we created the file, remove it
                     await exec(`rm -f "${hostModulesFilePath}"`);
                     Utils.success(`Removed created ${hostModulesFilePath}.`);
                } else {
                     // Otherwise, restore original content
                    fs.writeFileSync(hostModulesFilePath, originalModulesContent, 'utf-8');
                    Utils.success(`Restored original ${hostModulesFilePath}.`);
                }
            } catch (cleanupError) {
                Utils.warning(`Failed to restore/remove ${hostModulesFilePath}: ${cleanupError}`);
            }
        }

        // 5.3 Cleanup hook script
        if (hookAdded) {
            try {
                await exec(`rm -f "${hostHookPath}"`);
                Utils.success(`Removed hook script ${hostHookPath}.`);
            } catch (cleanupError) {
                Utils.warning(`Failed to remove hook script ${hostHookPath}: ${cleanupError}`);
            }
        }
    }

    Utils.warning(`Finished creating LUKS initrd: ${finalInitrdDestPath}`);
}

/**
 * initrdDebian
 */
export async function initrdDebian(this: Ovary, verbose = false) {
    Utils.warning(`creating ${this.initrd} using mkinitramfs on (ISO)/live`)

    const prefix = this.settings.config.snapshot_prefix
    const destFinal = `${this.settings.iso_work}live/${path.basename(this.initrd)}`
    const log = `> ${this.settings.iso_work}${prefix}mkinitramfs.log.txt 2>&1`
    const target = path.join(this.dotMnt, 'filesystem.squashfs')
    const cmd = `mkinitramfs -v -o ${destFinal} ${this.kernel} ${log}`
    await exec(cmd, this.echo)

}

/*
* initrdDracut) Almalinux/Fedora/Openmamba/Opensuse/Rocky/
*/
export async function initrdDracut(this: Ovary) {
    Utils.warning(`creating ${path.basename(this.initrd)} using dracut on (ISO)/live`)
    const prefix = this.settings.config.snapshot_prefix
    const log = `> ${this.settings.iso_work}${prefix}dracut.log.txt 2>&1`

    const confdir = '--confdir ' + path.resolve(__dirname, `../../../dracut/dracut.conf.d`)
    const kmoddir = `--kmoddir /lib/modules/${this.kernel}`
    const initramfs = `${this.settings.iso_work}live/${path.basename(this.initrd)}`
    const cmd = `dracut --force ${confdir} ${kmoddir} ${initramfs} ${this.kernel} ${log}`
    console.log(cmd)
    await exec(cmd, this.echo)

    // clean per btrfs
    let clean = `../../../scripts/99clean ${this.kernel}`
    await exec(clean, this.echo)
}
