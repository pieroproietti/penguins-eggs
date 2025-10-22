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

        // --- 2.1 Copy boot-encrypted-root.sh
        {
            const bootEncryptedRootName = 'boot-encrypted-root.sh'; // Corrected to lowercase zz-
            const srcbootEncryptedRootPath = path.join(__dirname, '../../../scripts', bootEncryptedRootName);
            const chrootbootEncryptedRootDir = '/etc/initramfs-tools/scripts/live-premount';
            const chrootbootEncryptedRootPath = path.join(chrootbootEncryptedRootDir, bootEncryptedRootName);
            const hostDestbootEncryptedRootDir = path.join(chrootPath, chrootbootEncryptedRootDir);
            const hostDestbootEncryptedRootPath = path.join(chrootPath, chrootbootEncryptedRootPath);

            if (!fs.existsSync(srcbootEncryptedRootPath)) {
                throw new Error(`Unlock script source not found: ${srcbootEncryptedRootPath}`);
            }
            await exec(`mkdir -p "${hostDestbootEncryptedRootDir}"`);
            await exec(`cp "${srcbootEncryptedRootPath}" "${hostDestbootEncryptedRootPath}"`);
            await exec(`chmod +x "${hostDestbootEncryptedRootPath}"`);
            Utils.success(`Copied unlock script to ${chrootbootEncryptedRootPath}`);
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

        // --- 2.3 Add hook ---
        await addHook('add-losetup-hook.sh', chrootPath)
        await addHook('add-switchroot-hook.sh', chrootPath)
        await addHook('add-udevadm-hook.sh', chrootPath); 
        await addHook('add-blkid-hook.sh', chrootPath);
        await addHook('add-rsync-hook.sh', chrootPath);
        
        // --- 2.4 Add modules ---
        addModules('overlay', chrootPath)

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


/**
 * 
 * @param module 
 * @param chrootPath 
 */
async function addHook(hookScriptName: string, chrootPath: string) {
    const srcHookPath = path.join(__dirname, '../../../scripts', hookScriptName);
    const chrootHooksDirPath = '/etc/initramfs-tools/hooks';
    const hostHooksDirPath = path.join(chrootPath, chrootHooksDirPath);
    const hostHookPath = path.join(hostHooksDirPath, hookScriptName);

    Utils.warning(`Adding required ${hookScriptName} hook script to ${hostHooksDirPath}`);
    if (!fs.existsSync(srcHookPath)) {
        // Assicurati che il file add-switchroot-hook.sh esista in ../../../scripts
        throw new Error(`switch_root hook script source not found: ${srcHookPath}`);
    }
    // Directory dovrebbe già esistere dal passo precedente, ma mkdir -p è sicuro
    await exec(`mkdir -p "${hostHooksDirPath}"`);
    await exec(`cp "${srcHookPath}" "${hostHookPath}"`);
    await exec(`chmod +x "${hostHookPath}"`);
    Utils.success(`Copied and set executable hook: ${hostHookPath}`);
}

/**
 * 
 * @param module 
 * @param chrootPath 
 */
function addModules(module: string, chrootPath: string) {

    const chrootModulesFilePath = '/etc/initramfs-tools/modules'; // Relative inside chroot
    const hostModulesFilePath = path.join(chrootPath, chrootModulesFilePath); // Absolute on host fs
    let modulesContent = '';
    let needsUpdate = false;

    if (fs.existsSync(hostModulesFilePath)) {
        modulesContent = fs.readFileSync(hostModulesFilePath, 'utf-8');
    } else {
        Utils.warning(`Creating ${hostModulesFilePath} as it does not exist.`);
        // Ensure newline at the end if creating from scratch
        modulesContent = '\n';
    }

    if (!modulesContent.includes(`\n${module}\n`)) { // Check precisely for the module name on its own line
        Utils.warning(`Adding '${module}' module to ${hostModulesFilePath}`);
        // Add to the end, ensuring newline before if needed
        if (!modulesContent.endsWith('\n')) {
            modulesContent += '\n';
        }
        modulesContent += `${module}\n`;
        needsUpdate = true;
    } else {
        Utils.info(`'${module}' module already listed.`);
    }

    if (needsUpdate) {
        fs.writeFileSync(hostModulesFilePath, modulesContent, 'utf-8');
        Utils.success(`Updated ${hostModulesFilePath} with 'overlay'.`);
    }
}    
