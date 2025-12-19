/**
 * ./src/classes/ovary.d/create-xdg-autostart.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */


// packages
import fs, { Dirent } from 'node:fs'
import path from 'node:path'
import  {shx} from '../../lib/utils.js'

// classes
import Ovary from '../ovary.js'
import Pacman from '../pacman.js'
import Utils from '../utils.js'
import Xdg from '../xdg.js'
import { exec } from '../../lib/utils.js'
import PveLive from '../pve-live.js'

import { IAddons } from '../../interfaces/index.js'

// _dirname
const __dirname = path.dirname(new URL(import.meta.url).pathname)

/**
   *
   */
export async function createXdgAutostart(this: Ovary, theme = 'eggs', myAddons: IAddons, myLinks: string[] = [], noicons = false) {
    if (this.verbose) {
        console.log('Ovary: createXdgAutostart')
    }

    const pathHomeLive = `/home/${this.settings.config.user_opt}`

    // VOGLIO le icone
    // Copia icona penguins-eggs
    shx.cp(path.resolve(__dirname, '../../../assets/eggs.png'), '/usr/share/icons/')
    shx.cp(path.resolve(__dirname, '../../../assets/krill.svg'), '/usr/share/icons/')
    shx.cp(path.resolve(__dirname, '../../../assets/leaves.svg'), '/usr/share/icons/')

    /**
     * creazione dei link in /usr/share/applications
     */
    shx.cp(path.resolve(__dirname, '../../../assets/penguins-eggs.desktop'), '/usr/share/applications/')
    /**
     * Scrivania/install-system.desktop
     */
    let installerLink = 'install-system.desktop'
    if (Pacman.calamaresExists()) {
        // 1. Copia il lanciatore .desktop STANDARD (quello con pkexec)
        shx.cp(path.resolve(__dirname, `../../../addons/${theme}/theme/applications/install-system.desktop`), `${this.settings.work_dir.merged}/usr/share/applications/`)
        // 2. Copia la TUA policy Polkit per Calamares
        const policySource = path.resolve(__dirname, '../../../assets/calamares/io.calamares.calamares.policy')
        const policyDest = '/usr/share/polkit-1/actions/'
        shx.cp(policySource, policyDest)
        await exec(`sed -i 's/auth_admin/yes/' ${policyDest}io.calamares.calamares.policy`)
        
    } else if (Pacman.packageIsInstalled('live-installer')) {
        /**
         * LMD£ live-installer
         */
        const policySource = path.resolve(__dirname, '../../../assets/live-installer/com.github.pieroproietti.penguins-eggs.policy')
        const policyDest = '/usr/share/polkit-1/actions/com.github.pieroproietti.penguins-eggs.policy'
        shx.cp(policySource, policyDest)
        await exec(`sed -i 's/auth_admin/yes/' ${policyDest}`)

        // carico in filesystem.live packages-remove
        shx.cp(path.resolve(__dirname, '../../../assets/live-installer/filesystem.packages-remove'), `${this.settings.iso_work}/live/`)
        shx.touch(`${this.settings.iso_work}/live/filesystem.packages`)

        installerLink = 'penguins-live-installer.desktop'
        shx.cp(path.resolve(__dirname, '../../../assets/penguins-live-installer.desktop'), `${this.settings.work_dir.merged}/usr/share/applications/`)
    } else if (Pacman.packageIsInstalled('ubiquity')) {

        /**
         * UBUNTU ubiquity
         */
        const policySource = path.resolve(__dirname, '../../../assets/ubiquity-installer/com.github.pieroproietti.penguins-eggs.policy')
        const policyDest = '/usr/share/polkit-1/actions/com.github.pieroproietti.penguins-eggs.policy'
        shx.cp(policySource, policyDest)
        await exec(`sed -i 's/auth_admin/yes/' ${policyDest}`)

        // carico in filesystem.live packages-remove
        shx.cp(path.resolve(__dirname, '../../../assets/ubiquity-installer/filesystem.packages-remove'), `${this.settings.iso_work}/live/`)
        shx.touch(`${this.settings.iso_work}/live/filesystem.packages`)

        installerLink = 'penguins-ubiquity-installer.desktop'
        shx.cp(path.resolve(__dirname, '../../../assets/penguins-ubiquity-installer.desktop'), `${this.settings.work_dir.merged}/usr/share/applications/`)
    } else {
        installerLink = 'penguins-krill.desktop'
        shx.cp(path.resolve(__dirname, '../../../assets/penguins-krill.desktop'), `${this.settings.work_dir.merged}/usr/share/applications/`)
    }

    /**
     * flags
     */

    // adapt
    if (myAddons.adapt) {
        const dirAddon = path.resolve(__dirname, '../../../addons/eggs/adapt/')
        shx.cp(`${dirAddon}/applications/eggs-adapt.desktop`, `${this.settings.work_dir.merged}/usr/share/applications/`)
    }

    // pve
    if (myAddons.pve) {
        /**
         * create service pve-live
         */
        const pve = new PveLive()
        pve.create(this.settings.work_dir.merged)

        /**
         * adding a desktop link for pve
         */
        const dirAddon = path.resolve(__dirname, '../../../addons/eggs/pve')
        shx.cp(`${dirAddon}/artwork/eggs-pve.png`, `${this.settings.work_dir.merged}/usr/share/icons/`)
        shx.cp(`${dirAddon}/applications/eggs-pve.desktop`, `${this.settings.work_dir.merged}/usr/share/applications/`)
    }

    // rsupport
    if (myAddons.rsupport) {
        const dirAddon = path.resolve(__dirname, '../../../addons/eggs/rsupport')
        shx.cp(`${dirAddon}/applications/eggs-rsupport.desktop`, `${this.settings.work_dir.merged}/usr/share/applications/`)
        shx.cp(`${dirAddon}/artwork/eggs-rsupport.png`, `${this.settings.work_dir.merged}/usr/share/icons/`)
    }

    /**
     * configuro add-penguins-desktop-icons in /etc/xdg/autostart
     */

    const dirAutostart = `${this.settings.work_dir.merged}/etc/xdg/autostart`
    if (fs.existsSync(dirAutostart)) {
        // Creo l'avviatore xdg: DEVE essere add-penguins-links.desktop
        shx.cp(path.resolve(__dirname, '../../../assets/penguins-links-add.desktop'), dirAutostart)

        // create /usr/bin/penguins-links-add.sh
        const script = '/usr/bin/penguins-links-add.sh'
        let text = ''
        text += '#!/bin/sh\n'
        text += 'DESKTOP=$(xdg-user-dir DESKTOP)\n'
        text += 'while [ ! -d "$DESKTOP" ]; do\n'
        text += '  DESKTOP=$(xdg-user-dir DESKTOP)\n'
        text += '  sleep 1\n'
        text += 'done\n'
        text += `cp /usr/share/applications/${installerLink} "$DESKTOP"\n`
        if (Pacman.packageIsInstalled('lxde-core')) {
            if (!noicons) {
                text += lxdeLink('penguins-eggs.desktop', "Penguins' eggs", 'eggs')
            }

            if (myAddons.adapt) text += lxdeLink('eggs-adapt.desktop', 'Adapt', 'video-display')
            if (myAddons.pve) text += lxdeLink('eggs-pve.desktop', 'Proxmox VE', 'proxmox-ve')
            if (myAddons.rsupport) text += lxdeLink('eggs-rsupport.desktop', 'Remote assistance', 'remote-assistance')
        } else {
            if (!noicons) {
                text += 'cp /usr/share/applications/penguins-eggs.desktop "$DESKTOP"\n'
            }

            if (myLinks.length > 0) {
                for (const link of myLinks) {
                    text += `cp /usr/share/applications/${link}.desktop "$DESKTOP"\n`
                }
            }

            if (myAddons.adapt) text += 'cp /usr/share/applications/eggs-adapt.desktop "$DESKTOP"\n'
            if (myAddons.pve) text += 'cp /usr/share/applications/eggs-pve.desktop "$DESKTOP"\n'
            if (myAddons.rsupport) text += 'cp /usr/share/applications/eggs-rsupport.desktop "$DESKTOP"\n'
        }

        /**
         * enable desktop links
         */
        if (Pacman.packageIsInstalled('gdm3') || Pacman.packageIsInstalled('gdm')) {
            // GNOME
            text += 'test -f /usr/share/applications/penguins-eggs.desktop && cp /usr/share/applications/penguins-eggs.desktop "$DESKTOP"\n'
            text += 'test -f "$DESKTOP"/op && chmod a+x "$DESKTOP"/penguins-eggs.desktop\n'
            text += 'test -f "$DESKTOP"/penguins-eggs.desktop && gio set "$DESKTOP"/penguins-eggs.desktop metadata::trusted true\n'
            text += `test -f /usr/share/applications/${installerLink} && cp /usr/share/applications/${installerLink} "$DESKTOP"\n`
            text += `test -f "$DESKTOP"/${installerLink} && chmod a+x "$DESKTOP"/${installerLink}\n`
            text += `test -f "$DESKTOP"/${installerLink} && gio set "$DESKTOP"/${installerLink} metadata::trusted true\n`
        } else if (Pacman.packageIsInstalled('xfce4-session')) {
            text += `# xfce: enable-desktop-links\n`
            text += `for f in "$DESKTOP"/*.desktop; do chmod +x "$f"; gio set -t string "$f" metadata::xfce-exe-checksum "$(sha256sum "$f" | awk '{print $1}')"; done\n`
        } else {
            text += `# others: enable-desktop-links\n`
            text += 'chmod +x "$DESKTOP"/*.desktop\n'
        }

        fs.writeFileSync(script, text, 'utf8')
        await exec(`chmod a+x ${script}`, this.echo)
    }

    //await Xdg.autologin(await Utils.getPrimaryUser(), this.settings.config.user_opt, this.settings.work_dir.merged)
    await Xdg.autologin(this.settings.config.user_opt, this.settings.work_dir.merged)
}

/**
 * Creazione link desktop per lxde
 * @param name
 * @param icon
 * was private
 */
function lxdeLink(file: string, name: string, icon: string): string {

    const lnk = `lnk-${file}`

    let text = ''
    text += `echo "[Desktop Entry]" >$DESKTOP/${lnk}\n`
    text += `echo "Type=Link" >> $DESKTOP/${lnk}\n`
    text += `echo "Name=${name}" >> $DESKTOP/${lnk}\n`
    text += `echo "Icon=${icon}" >> $DESKTOP/${lnk}\n`
    text += `echo "URL=/usr/share/applications/${file}" >> $DESKTOP/${lnk}\n\n`

    return text
}

