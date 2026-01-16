/**
 * ./src/classes/ovary.d/create-xdg-autostart.ts
 * penguins-eggs v.25.12.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { IAddons } from '../../interfaces/index.js'
import { exec } from '../../lib/utils.js'
// classes
import Ovary from '../ovary.js'
import Pacman from '../pacman.js'
import PveLive from '../pve-live.js'

// Setup __dirname per moduli ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Crea la configurazione XDG Autostart e gestisce l'autologin universale
 */
export async function createXdgAutostart(this: Ovary, theme = 'eggs', myAddons: IAddons, myLinks: string[] = [], noicons = false) {
    if (this.verbose) {
        console.log('Ovary: createXdgAutostart (Native TS implementation)')
    }

    const mergedRoot = this.settings.work_dir.merged
    const newuser = this.settings.config.user_opt

    /**
     * Helper per gestire file e directory in modo nativo
     */
    const copyToMerged = (srcRelative: string, destRelative: string) => {
        const src = path.resolve(__dirname, srcRelative)
        const dest = path.join(mergedRoot, destRelative)
        if (fs.existsSync(src)) {
            fs.mkdirSync(path.dirname(dest), { recursive: true })
            fs.copyFileSync(src, dest)
        }
    }

    /**
     * 1. ICONE & ASSETS
     */
    const assets = ['eggs.png', 'krill.svg', 'leaves.svg']
    for (const asset of assets) copyToMerged(`../../../assets/${asset}`, `/usr/share/icons/${asset}`)

    copyToMerged('../../../assets/penguins-eggs.desktop', '/usr/share/applications/penguins-eggs.desktop')

    /**
     * 2. INSTALLER & POLKIT
     */
    let installerLink = 'install-system.desktop'

    if (Pacman.calamaresExists()) {
        copyToMerged(`../../../addons/${theme}/theme/applications/install-system.desktop`, '/usr/share/applications/install-system.desktop')
        const policyPath = '/usr/share/polkit-1/actions/io.calamares.calamares.policy'
        copyToMerged('../../../assets/calamares/io.calamares.calamares.policy', policyPath)
        const fullPolicyPath = path.join(mergedRoot, policyPath)
        if (fs.existsSync(fullPolicyPath)) {
            let policy = fs.readFileSync(fullPolicyPath, 'utf8')
            policy = policy.replaceAll(/<(allow_any|allow_inactive|allow_active)>.*?<\/\1>/g, '<$1>yes</$1>')
            fs.writeFileSync(fullPolicyPath, policy, 'utf8')
        }
    } else if (Pacman.packageIsInstalled('live-installer')) {
        installerLink = 'penguins-live-installer.desktop'
        copyToMerged('../../../assets/penguins-live-installer.desktop', '/usr/share/applications/penguins-live-installer.desktop')
    } else if (Pacman.packageIsInstalled('ubiquity')) {
        installerLink = 'penguins-ubiquity-installer.desktop'
        copyToMerged('../../../assets/penguins-ubiquity-installer.desktop', '/usr/share/applications/penguins-ubiquity-installer.desktop')
    } else {
        installerLink = 'penguins-krill.desktop'
        copyToMerged('../../../assets/penguins-krill.desktop', '/usr/share/applications/penguins-krill.desktop')
    }

    /**
     * 3. ADDONS
     */
    if (myAddons.adapt) copyToMerged('../../../addons/eggs/adapt/applications/eggs-adapt.desktop', '/usr/share/applications/eggs-adapt.desktop')
    if (myAddons.rsupport) {
        copyToMerged('../../../addons/eggs/rsupport/applications/eggs-rsupport.desktop', '/usr/share/applications/eggs-rsupport.desktop')
        copyToMerged('../../../addons/eggs/rsupport/artwork/eggs-rsupport.png', '/usr/share/icons/eggs-rsupport.png')
    }

    if (myAddons.pve) {
        const pve = new PveLive(); pve.create(mergedRoot)
        copyToMerged('../../../addons/eggs/pve/artwork/eggs-pve.png', '/usr/share/icons/eggs-pve.png')
        copyToMerged('../../../addons/eggs/pve/applications/eggs-pve.desktop', '/usr/share/applications/eggs-pve.desktop')
    }

    /**
     * 4. SCRIPT AUTOSTART (Icone Desktop)
     */
    const autostartDir = path.join(mergedRoot, '/etc/xdg/autostart')
    copyToMerged('../../../assets/penguins-links-add.desktop', '/etc/xdg/autostart/penguins-links-add.desktop')

    const scriptPath = path.join(mergedRoot, '/usr/bin/penguins-links-add.sh')
    let scriptText = '#!/bin/sh\nDESKTOP=$(xdg-user-dir DESKTOP)\n'
    scriptText += 'while [ ! -d "$DESKTOP" ]; do sleep 1; DESKTOP=$(xdg-user-dir DESKTOP); done\n'
    scriptText += `cp /usr/share/applications/${installerLink} "$DESKTOP"\n`
    if (!noicons) scriptText += 'cp /usr/share/applications/penguins-eggs.desktop "$DESKTOP"\n'
    for (const link of myLinks) scriptText += `cp /usr/share/applications/${link}.desktop "$DESKTOP"\n`

    if (Pacman.packageIsInstalled('cosmic-session') || Pacman.packageIsInstalled('gdm3') || Pacman.packageIsInstalled('gdm')) {
        scriptText += 'chmod a+x "$DESKTOP"/*.desktop\n'
        scriptText += 'for f in "$DESKTOP"/*.desktop; do gio set "$f" metadata::trusted true 2>/dev/null; done\n'
    } else if (Pacman.packageIsInstalled('xfce4-session')) {
        scriptText += 'for f in "$DESKTOP"/*.desktop; do chmod +x "$f"; gio set -t string "$f" metadata::xfce-exe-checksum "$(sha256sum "$f" | awk "{print $1}")"; done\n'
    } else {
        scriptText += 'chmod +x "$DESKTOP"/*.desktop\n'
    }

    fs.mkdirSync(path.dirname(scriptPath), { recursive: true })
    fs.writeFileSync(scriptPath, scriptText, 'utf8')
    await exec(`chmod a+x ${scriptPath}`)

    /**
     * 5. LOGICA AUTOLOGIN UNIVERSALE (STRATEGIA BYPASS TTY)
     */
    
    // Sblocco utente (Shadow & PAM)
    try {
        await exec(`chroot ${mergedRoot} usermod -p "" ${newuser}`)
        await exec(`chroot ${mergedRoot} passwd -u ${newuser}`)
    } catch { if (this.verbose) console.log('Ovary: error unlocking') }

    const pamServices = ['common-auth', 'greetd', 'gdm-password', 'login']
    for (const s of pamServices) {
        const p = path.join(mergedRoot, `/etc/pam.d/${s}`)
        if (fs.existsSync(p)) {
            let c = fs.readFileSync(p, 'utf8')
            c = c.replaceAll(/pam_unix\.so(?!.*nullok)/g, 'pam_unix.so nullok')
            fs.writeFileSync(p, c, 'utf8')
        }
    }

    // CASO COSMIC/GREETD: Bypass totale del Display Manager
    if (Pacman.packageIsInstalled('greetd')) {
        // 1. Forza login automatico su TTY1 tramite Getty
        const gettyDir = path.join(mergedRoot, '/etc/systemd/system/getty@tty1.service.d')
        fs.mkdirSync(gettyDir, { recursive: true })
        const gettyConf = `[Service]\nExecStart=\nExecStart=-/sbin/agetty --autologin ${newuser} --noclear %I $TERM\n`
        fs.writeFileSync(path.join(gettyDir, 'override.conf'), gettyConf, 'utf8')

        // 2. Script che lancia la sessione (quello che fai a mano)
        const startScript = path.join(mergedRoot, '/usr/bin/eggs-start-cosmic')
        const startContent = `#!/bin/bash\nif [[ -z $DISPLAY && $(tty) == /dev/tty1 ]]; then\n  exec dbus-run-session cosmic-session\nfi\n`
        fs.writeFileSync(startScript, startContent, 'utf8')
        await exec(`chmod a+x ${startScript}`)

        // 3. Esegui lo script al login della shell
        const userHome = path.join(mergedRoot, 'home', newuser)
        if (!fs.existsSync(userHome)) fs.mkdirSync(userHome, { recursive: true })
        const profilePath = path.join(userHome, '.bash_profile')
        fs.writeFileSync(profilePath, `[[ -f /usr/bin/eggs-start-cosmic ]] && . /usr/bin/eggs-start-cosmic\n`, 'utf8')
        
        await exec(`chroot ${mergedRoot} chown -R ${newuser}:${newuser} /home/${newuser}`)
        await exec(`chroot ${mergedRoot} usermod -aG video,render,input,tty,audio ${newuser}`)

        // Disabilitiamo greetd per evitare che "rubi" il terminale
        try { await exec(`chroot ${mergedRoot} systemctl disable greetd`) } catch {}
    } 

    // Altri Display Manager
    else if (Pacman.packageIsInstalled('gdm3') || Pacman.packageIsInstalled('gdm')) {
        const gdmFile = fs.existsSync(path.join(mergedRoot, '/etc/gdm3/daemon.conf')) ? path.join(mergedRoot, '/etc/gdm3/daemon.conf') : path.join(mergedRoot, '/etc/gdm3/custom.conf')
        if (fs.existsSync(gdmFile)) {
            let c = fs.readFileSync(gdmFile, 'utf8')
            c = c.replace(/#?AutomaticLoginEnable=.*/, 'AutomaticLoginEnable=true').replace(/#?AutomaticLogin=.*/, `AutomaticLogin=${newuser}`)
            fs.writeFileSync(gdmFile, c, 'utf8')
        }
    }
    else if (Pacman.packageIsInstalled('sddm')) {
        const sddmConf = path.join(mergedRoot, '/etc/sddm.conf.d/eggs-autologin.conf')
        fs.mkdirSync(path.dirname(sddmConf), { recursive: true })
        fs.writeFileSync(sddmConf, `[Autologin]\nUser=${newuser}\nSession=cosmic\n`, 'utf8')
    }
    else if (Pacman.packageIsInstalled('lightdm')) {
        const lPath = path.join(mergedRoot, '/etc/lightdm/lightdm.conf')
        if (fs.existsSync(lPath)) {
            let c = fs.readFileSync(lPath, 'utf8')
            if (!c.includes('[Seat:*]')) c += '\n[Seat:*]\n'
            c = c.replaceAll(/autologin-user=.*/g, '').replace('[Seat:*]', `[Seat:*]\nautologin-user=${newuser}\nautologin-user-timeout=0`)
            fs.writeFileSync(lPath, c, 'utf8')
        }
    }

    if (this.verbose) console.log(`Ovary: Autologin and Desktop links configured for user: ${newuser}`)
}
