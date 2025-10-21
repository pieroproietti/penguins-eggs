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
 * 
 * @param this 
 * @param verbose 
 */
export async function initrdDebianLuks(this: Ovary, verbose = false) {
    Utils.warning(`creating ${this.initrd} for LUKS using mkinitramfs inside chroot`);

    // --- 1. Define Correct Paths ---
    // 'target' is be the path where the root filesystem is mounted for the chroot
    // Example: /home/eggs/.mnt/filesystem (adjust based on your actual mount point)
    const chrootPath = path.join(this.dotMnt, 'filesystem.squashfs'); 

    const unlockScriptName = 'ZZ-eggs-luks-unlock.sh';
    const srcUnlockScriptPath = path.join(__dirname, '../../../scripts', unlockScriptName); // Path on host

    // Paths *inside* the chroot (relative to '/')
    const chrootUnlockScriptDir = '/etc/initramfs-tools/scripts/live-premount';
    const chrootUnlockScriptPath = path.join(chrootUnlockScriptDir, unlockScriptName)
    const chrootCrypttabPath = '/etc/crypttab'
    const chrootTmpInitrdPath = `/tmp/${path.basename(this.initrd)}`; // Temporary output path INSIDE chroot

    // Paths *outside* the chroot
    const finalInitrdDestPath = path.join(this.settings.iso_work, 'live', path.basename(this.initrd)); // Final path on host ISO structure
    const logFilePath = path.join(this.settings.iso_work, `${this.settings.config.snapshot_prefix}mkinitramfs.log.txt`);

    // --- 2. Prepare Chroot Environment ---
    Utils.warning("Preparing chroot environment...");

    // Copy unlock script into chroot
    const hostDestUnlockScriptDir = path.join(chrootPath, chrootUnlockScriptDir); // Real path on host filesystem
    const hostDestUnlockScriptPath = path.join(chrootPath, chrootUnlockScriptPath);
    try {
        await exec(`mkdir -p "${hostDestUnlockScriptDir}"`);
        await exec(`cp "${srcUnlockScriptPath}" "${hostDestUnlockScriptPath}"`);
        await exec(`chmod +x "${hostDestUnlockScriptPath}"`);
        Utils.success(`Copied and set executable: ${chrootUnlockScriptPath} (inside chroot)`);
    } catch (error) {
        Utils.error(`Failed to copy unlock script into chroot: ${error}`);
        throw error; // Stop execution if copy fails
    }

    // Manage dummy crypttab inside chroot
    const hostCrypttabPath = path.join(chrootPath, chrootCrypttabPath); // Real path on host filesystem
    let cleanIt = false;
    let crypttabContent = "";
    if (!fs.existsSync(hostCrypttabPath)) {
        Utils.warning("Creating dummy /etc/crypttab inside chroot...");
        cleanIt = true;
        crypttabContent += "# <target name> <source device> <key file> <options>\n";
        crypttabContent += "cryptroot UUID=none none luks,discard\n";
        fs.writeFileSync(hostCrypttabPath, crypttabContent, 'utf-8');
    } else {
         Utils.warning("/etc/crypttab already exists inside chroot, leaving it untouched.");
    }

    // --- 3  aggingi in /etc/initramfs-tools/module    
    // dm-crypt
    // loop

    // aggiung hook add-losetup-hook.sh
    const hookName = 'add-losetup-hook.sh'
    const srcHookPath = path.join(__dirname, '../../../scripts', hookName); // Path on host
    await exec(`cp "${srcHookPath}" "${hostDestHookPath}"`);
    await exec(`chmod +x "${hostDestHookPath}"`);

    // compe per 


    // --- 3. Execute mkinitramfs INSIDE Chroot ---
    Utils.warning(`Running mkinitramfs inside chroot: ${chrootPath}`);
    // Note: The output path (-o) is relative to the chroot's root ('/')
    const mkinitramfsCmd = `mkinitramfs -v -o "${chrootTmpInitrdPath}" ${this.kernel}`;
    // Execute the command via chroot
    const chrootCmd = `chroot "${chrootPath}" /bin/bash -c "${mkinitramfsCmd}" > "${logFilePath}" 2>&1`;

    try {
        await exec(chrootCmd, this.echo);
        Utils.success(`mkinitramfs completed. Log: ${logFilePath}`);
    } catch (error) {
        Utils.error(`mkinitramfs inside chroot failed. Check log: ${logFilePath}`);
        Utils.error(`Error details: ${error}`);
        // Attempt cleanup even if mkinitramfs fails
        if (cleanIt) {
            try {
                await exec(`rm -f "${hostCrypttabPath}"`);
                Utils.warning("Cleaned up dummy /etc/crypttab.");
            } catch (cleanupError) {
                Utils.warning(`Failed to cleanup dummy /etc/crypttab: ${cleanupError}`);
            }
        }
        throw error; // Stop execution
    }


    // --- 4. Move Result and Cleanup ---
    // Move the generated initrd from the chroot's /tmp to the final ISO destination
    const hostTmpInitrdPath = path.join(chrootPath, chrootTmpInitrdPath); // Real path on host
    if (fs.existsSync(hostTmpInitrdPath)) {
        Utils.warning(`Moving generated initrd from ${hostTmpInitrdPath} to ${finalInitrdDestPath}`);
        await exec(`mv "${hostTmpInitrdPath}" "${finalInitrdDestPath}"`);
        Utils.success(`Initrd moved successfully.`);
    } else {
         Utils.error(`Generated initrd not found at ${hostTmpInitrdPath}. Build failed!`);
         // Attempt cleanup anyway
        if (cleanIt) {
            try {
                await exec(`rm -f "${hostCrypttabPath}"`);
            } catch (cleanupError) {}
        }
         throw new Error("mkinitramfs did not produce the expected output file.");
    }

    // Cleanup dummy crypttab if we created it
    if (cleanIt) {
        try {
            await exec(`rm -f "${hostCrypttabPath}"`);
            Utils.warning("Cleaned up dummy /etc/crypttab.");
        } catch (cleanupError) {
             Utils.warning(`Failed to cleanup dummy /etc/crypttab: ${cleanupError}`);
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
