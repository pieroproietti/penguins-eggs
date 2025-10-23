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
import { checkPrime } from 'node:crypto'


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
export async function luksRootInitrd(this: Ovary, verbose = false) {
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
        Utils.warning(`Generating required hook scripts`)
        await addHook('/usr/sbin/losetup', chrootPath);
        await addHook('/usr/bin/rsync',    chrootPath);        
        
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
        throw error; // Re-throw error
    }

    Utils.warning(`Finished creating LUKS initrd: ${finalInitrdDestPath}`);
}

/**
 * Genera e installa uno script hook di initramfs-tools nel chroot.
 * Copia il comando specificato nella sua directory di destinazione
 * standard (/bin o /sbin) all'interno dell'initramfs.
 * @param cmdPath Path assoluto del comando da copiare *nel chroot* (es. '/usr/sbin/losetup')
 * @param chrootPath Path assoluto alla radice del chroot
 */
async function addHook(cmdPath: string, chrootPath: string) {
    const chrootHooksDirPath = '/etc/initramfs-tools/hooks';
    const hostHooksDirPath = path.join(chrootPath, chrootHooksDirPath);
    const cmd = path.basename(cmdPath); // es. 'losetup'
    const hookScriptName = `add-${cmd}-hook.sh`; // es. 'add-losetup-hook.sh'
    const hostHookPath = path.join(hostHooksDirPath, hookScriptName);

    if (!fs.existsSync(cmdPath)) {
        Utils.error(`Dont' exists ${cmdPath}`)
        process.exit()
    }

    let destDir = "/sbin"; // Default a /sbin per i comandi di amministrazione

    // Determina la destinazione corretta
    if (cmdPath.includes('/usr/bin') || cmdPath.includes('/bin')) {
        destDir = "/bin"; // Comandi utente
    } else if (cmdPath.includes('/usr/sbin') || cmdPath.includes('/sbin')) {
        destDir = "/sbin"; // Comandi amministrativi
    }

    // Crea la riga di comando per l'hook
    const copyLine = `copy_exec ${cmdPath} ${destDir} || echo "WARNING: Failed to copy ${cmdPath} to ${destDir}" >&2`;

    // Crea il contenuto boilerplate dello script hook
    const hookContent = `#!/bin/sh
# Hook: ${hookScriptName}
# Generato automaticamente da penguins-eggs
# Copia ${cmdPath} in ${destDir}

PREREQ=""
case $1 in prereqs) echo "\${PREREQ}"; exit 0;; esac

. /usr/share/initramfs-tools/hook-functions

echo "EGGS-HOOK: Esecuzione hook ${hookScriptName}..."
${copyLine}

exit 0
`;

    try {
        await exec(`mkdir -p "${hostHooksDirPath}"`);
        // Scrive il file e lo rende eseguibile (mode 0o755)
        fs.writeFileSync(hostHookPath, hookContent, { mode: 0o755, encoding: 'utf-8' });
        // console.log(hookContent)
        Utils.success(`Generated and set executable hook: ${hookScriptName}`);
    } catch (err: any) {
        Utils.error(`Failed to write hook script ${hostHookPath}: ${err.message}`);
        process.exit(1)
        throw err; // Lancia l'errore per fermare il processo
    }
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
