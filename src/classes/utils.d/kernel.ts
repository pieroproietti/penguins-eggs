/**
 * penguins-eggs
 * 
 * Kernel management utilities
 * Handle vmlinuz and initramfs detection across different distributions
 */

import fs from 'node:fs'
import path from 'path'
import Distro from '../distro.js'
import Utils from '../utils.js'
import { execSync } from 'node:child_process'
import Diversions from '../diversions.js'


/**
 * Kernel utilities for managing vmlinuz and initramfs paths
 */
export default class Kernel {
    /**
     * Ricava path per vmlinuz
     * 
     * @returns Path al file vmlinuz
     */
    static vmlinuz(kernel = ''): string {
        let vmlinuz = ''

        if (!Utils.isContainer()) {
            vmlinuz = this.vmlinuxFromUname()
            if (vmlinuz === '') {
                vmlinuz = this.vmlinuxFromCmdline()
                if (vmlinuz === '') {
                    console.log('vmlinuz not found')
                    process.exit(1)
                }
            }
        } else {
            Utils.warning("cannot work on containers actually!")
            process.exit(1)
        }

        if (!fs.existsSync(vmlinuz)) {
            console.log(`file ${vmlinuz} does not exist!`)
            process.exit(1)
        }
        return vmlinuz
    }


    /**
     * Ricava path per initramfs/initrd
     * 
     * @param kernel - Versione del kernel
     * @returns Path al file initramfs
     */
    static initramfs(kernel = ''): string {
        const distro = new Distro()
        let initramfs = ''

        if (kernel === '') {
            if (!Utils.isContainer()) {
                kernel = execSync('uname -r').toString().trim();
            } else {
                Utils.warning("cannot work on containers actually!")
                process.exit(1)
            }
        }

        // rolling...
        if (distro.familyId === "alpine") {
            let suffix = kernel.substring(kernel.lastIndexOf('-'))
            initramfs = `/boot/initramfs${suffix}`

        } else if (distro.familyId === "archlinux" &&  (!Diversions.isManjaroBased(distro.distroId))) {
            let suffix = kernel.substring(kernel.lastIndexOf('-'))
            initramfs = `/boot/initramfs-linux${suffix}.img`

        } else if (distro.familyId === "archlinux" &&  (Diversions.isManjaroBased(distro.distroId))) {
            let version = kernel.split('.').slice(0, 2).join('.');
            initramfs = `/boot/initramfs-${version}-x86_64.img`

        } else {
            // Gestione generica per le altre distro (Debian, Fedora, SUSE, OpenMamba, cc.)
            const candidates = [
                `/boot/initrd.img-${kernel}`, // Debian, Ubuntu
                `/boot/initramfs-${kernel}.img`, // Fedora, RHEL
                `/boot/initramfs-${kernel}-1mamba-x86_64.img`, // Openmamba
                `/boot/initrd-${kernel}`, // openSUSE
                `/boot/initramfs-${kernel}`, // fallbacks
            ]

            for (const candidate of candidates) {
                if (fs.existsSync(candidate)) {
                    initramfs = candidate
                    break
                }
            }
        }

        if (!fs.existsSync(initramfs)) {
            console.error(`ERROR: initramfs file ${initramfs} does not exist!`)
            process.exit(1)
        }

        return initramfs
    }

    /**
     * ALL PRIVATE
     */


    /**
     * most of the distros:
     * debian, fedora, opensuse, rasberry
     */
    private static vmlinuxFromUname() {
        const kernelVersion = execSync('uname -r').toString().trim()
        let kernelPath = `/boot/vmlinuz-${kernelVersion}`
        if (fs.existsSync(kernelPath)) {
            return kernelPath
        } else {
            return ''
        }
    }

    /**
     * vmlinuxFromCmdline
     * raspbery /proc/cmdline dont contain it
     */
    private static vmlinuxFromCmdline() {
        let distro = new Distro()
        let vmlinuz = ''

        // Find vmlinuz in /proc/cmdline
        const cmdline = fs.readFileSync('/proc/cmdline', 'utf8').split(" ")
        cmdline.forEach(cmd => {
            if (cmd.includes('BOOT_IMAGE')) {
                vmlinuz = cmd.substring(cmd.indexOf('=') + 1)

                // patch per fedora BOOT_IMAGE=(hd0,gpt2)/vmlinuz-6.9.9-200.fc40.x86_64
                if (vmlinuz.includes(")")) {
                    vmlinuz = cmd.substring(cmd.indexOf(')') + 1)
                }
                if (!fs.existsSync(vmlinuz)) {
                    if (fs.existsSync(`/boot/${vmlinuz}`)) {
                        vmlinuz = `/boot/${vmlinuz}`
                    }
                }
            }
        })

        // btrfs: eg: /@root/boot/vmlinuz
        //if (vmlinuz.indexOf('@')) {
        if (vmlinuz.includes('@')) {
            let subvolumeEnd = vmlinuz.indexOf('/', vmlinuz.indexOf('@'))
            vmlinuz = vmlinuz.substring(subvolumeEnd)
        }

        /**
         * Take always /boot/vmlinuz if exists
         */
        if (path.dirname(vmlinuz) === '/') {
            if (fs.existsSync(`/boot${vmlinuz}`)) {
                vmlinuz = `/boot${vmlinuz}`
            }
        }
        return vmlinuz
    }
}