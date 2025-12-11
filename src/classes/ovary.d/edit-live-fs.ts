/**
 * ./src/classes/ovary.d/edit-live-fs.ts
 * penguins-eggs v.25.12.5 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import fs from 'fs'
import os from 'os'
import path from 'node:path'
import {shx} from '../../lib/utils.js'
import Ovary from '../ovary.js'
import Utils from '../utils.js'
import Pacman from '../pacman.js'
import Systemctl from '../systemctl.js'
import { exec } from '../../lib/utils.js'

const __dirname = path.dirname(new URL(import.meta.url).pathname)

export async function editLiveFs(this: Ovary, clone = false) {
    if (this.verbose) console.log('Ovary: editLiveFs (Essential/Back-to-Basics)')

    const workDir = this.settings.work_dir.merged

    // Flag clone (standard eggs)
    if (clone) {
        await exec(`mkdir -p ${workDir}/etc/penguins-eggs.d`, this.echo)
        await exec(`touch ${workDir}/etc/penguins-eggs.d/is_clone`, this.echo)
    }

    if (Pacman.packageIsInstalled('epoptes')) {
        const file = `${workDir}/etc/default/epoptes-client`
        const text = `SERVER=${os.hostname}.local\n`
        fs.writeFileSync(file, text)
    }

    if (this.familyId === 'debian') {
        const text = 'UMASK=0077\n'
        const file = '/etc/initramfs-tools/conf.d/eggs-safe-initramfs.conf'
        Utils.write(file, text)
    }

    // Truncate logs
    let cmd = `find ${workDir}/var/log -name "*gz" -print0 | xargs -0r rm -f`
    await exec(cmd, this.echo)
    cmd = `find ${workDir}/var/log/ -type f -exec truncate -s 0 {} \\;`
    await exec(cmd, this.echo)

    // =========================================================================
    // FIX SYSVINIT (Minimal & Clean)
    // =========================================================================
    if (Utils.isSysvinit()) {
        if (this.verbose) console.log('SysVinit detected: Applying ESSENTIAL fixes only...');
        
        // 1. D-BUS FIX (Indispensabile per evitare il boot freeze)
        // Crea machine-id e directory, impedisce cancellazione.
        await patchInitScripts(workDir, this.verbose);
        
        // 2. GETTY FIX (Indispensabile se manca il binario)
        // Assicura che /sbin/getty esista (spesso c'è solo agetty)
        await fixGettyBinary(workDir, this.verbose);
        
        // 3. TTY NODES (Indispensabile per velocità/race-conditions)
        // Crea /dev/ttyX staticamente
        await createTtyNodes(workDir, this.verbose); 
        
        // NOTA: Non tocchiamo più inittab o rc.local. 
        // Lasciamo che live-config gestisca il login/autologin standard.
        // Questo dovrebbe permettere ai prompt di cryptsetup di apparire.
    }
    // =========================================================================

    // Fix Symlinks
    const varRun = `${workDir}/var/run`
    if (fs.existsSync(varRun) && !fs.lstatSync(varRun).isSymbolicLink()) {
         await exec(`rm -rf ${varRun}`, this.echo)
         await exec(`ln -s /run ${varRun}`, this.echo)
    }

    const varLock = `${workDir}/var/lock`
    if (fs.existsSync(varLock) && !fs.lstatSync(varLock).isSymbolicLink()) {
         await exec(`rm -rf ${varLock}`, this.echo)
         await exec(`ln -s /run/lock ${varLock}`, this.echo)
    }

    // Pmount fix
    if (this.settings.config.pmount_fixed && fs.existsSync(`${workDir}/etc/pmount.allow`)) {
        await exec(`sed -i 's:#/dev/sd\[a-z\]:/dev/sd\[a-z\]:' ${workDir}/etc/pmount.allow`, this.echo)
    }

    // SSH fix
    if (fs.existsSync(`${workDir}/etc/ssh/sshd_config`)) {
        await exec(`sed -i '/PermitRootLogin/d' ${workDir}/etc/ssh/sshd_config`)
        await exec(`sed -i '/PasswordAuthentication/d' ${workDir}/etc/ssh/sshd_config`)
        if (this.settings.config.ssh_pass) {
            await exec(`echo 'PasswordAuthentication yes' | tee -a ${workDir}/etc/ssh/sshd_config`, this.echo)
        } else {
            await exec(`echo 'PermitRootLogin prohibit-password' | tee -a ${workDir}/etc/ssh/sshd_config`, this.echo)
            await exec(`echo 'PasswordAuthentication no' | tee -a ${workDir}/etc/ssh/sshd_config`, this.echo)
        }
    }

    await exec(`rm ${workDir}/etc/fstab`, this.echo)
    await exec(`touch ${workDir}/etc/fstab`, this.echo)

    // Machine ID cleanup
    if (fs.existsSync(`${workDir}/etc/machine-id`)) {
        await exec(`rm -f ${workDir}/etc/machine-id`, this.echo)
        await exec(`touch ${workDir}/etc/machine-id`, this.echo)
    }
    if (fs.existsSync(`${workDir}/var/lib/dbus/machine-id`)) {
         await exec(`rm -f ${workDir}/var/lib/dbus/machine-id`, this.echo)
    }
    
    // Grub fonts
    if (fs.existsSync(`${workDir}/boot/grub/fonts/unicode.pf2`)) {
        shx.cp(`${workDir}/boot/grub/fonts/unicode.pf2`, `${workDir}/boot/grub/fonts/UbuntuMono16.pf2`)
    }

    shx.rm(`${workDir}/etc/resolv.conf`)

    // Systemd cleanup
    if (Utils.isSystemd()) {
        const systemdctl = new Systemctl(this.verbose)
        if (await systemdctl.isEnabled('remote-cryptsetup.target')) await systemdctl.disable('remote-cryptsetup.target', workDir, true)
        await exec(`rm -f ${workDir}/etc/NetworkManager/system-connections/*`, this.echo)
    }
}

async function fixGettyBinary(workDir: string, verbose: boolean) {
    const sbin = `${workDir}/sbin`;
    // Se c'è agetty ma manca getty, creiamo il symlink. Live-config usa spesso 'getty'.
    if (!fs.existsSync(`${sbin}/getty`) && fs.existsSync(`${sbin}/agetty`)) {
        if (verbose) console.log('Symlinking agetty to getty...');
        await exec(`ln -s agetty ${sbin}/getty`);
    }
}

async function createTtyNodes(workDir: string, verbose: boolean) {
    // Creiamo i device node statici per aiutare udev ed evitare race conditions
    for (let i = 1; i <= 6; i++) {
        const tty = `${workDir}/dev/tty${i}`;
        if (!fs.existsSync(tty)) {
            await exec(`mknod -m 620 ${tty} c 4 ${i}`);
            await exec(`chown root:tty ${tty}`);
        }
    }
}

async function patchInitScripts(workDir: string, verbose: boolean) {
    const dbusScript = `${workDir}/etc/init.d/dbus`;
    if (fs.existsSync(dbusScript)) {
        let content = fs.readFileSync(dbusScript, 'utf8');
        let modified = false;

        // Fix D-Bus Header (Creazione ID e Dir se mancano)
        const dbusFix = `
### EGGS-FIX-START
[ ! -d /proc/1 ] && mount -t proc proc /proc
mkdir -p /run/dbus /var/lib/dbus
[ ! -e /var/run/dbus ] && ln -s /run/dbus /var/run/dbus
if ! mkdir -p /var/lib/dbus 2>/dev/null; then mount -t tmpfs -o size=1m tmpfs /var/lib/dbus; fi
if [ ! -s /var/lib/dbus/machine-id ]; then
  if [ -f /proc/sys/kernel/random/uuid ]; then cat /proc/sys/kernel/random/uuid | tr -d '-' > /var/lib/dbus/machine-id;
  else echo "00000000000000000000000000000001" > /var/lib/dbus/machine-id; fi
fi
[ ! -s /etc/machine-id ] && cp /var/lib/dbus/machine-id /etc/machine-id 2>/dev/null
[ ! -s /etc/machine-id ] && mount --bind /var/lib/dbus/machine-id /etc/machine-id
### EGGS-FIX-END
`;
        if (!content.includes('EGGS-FIX-START')) {
            content = content.replace('#!/bin/sh', `#!/bin/sh\n${dbusFix}`);
            modified = true;
        }
        
        // Sabotage Prevention (Regex Robusta)
        const sabotageRegex = /rm\s+-f\s+["']?\$\{?MACHINEID\}?["']?/g;
        if (sabotageRegex.test(content)) {
             content = content.replace(sabotageRegex, ': # EGGS-PATCH: Prevent deletion');
             modified = true;
        }

        if (modified) fs.writeFileSync(dbusScript, content, 'utf8');
    }
}