/**
 * penguins-eggs
 * 
 * Kernel management utilities
 * Handle vmlinuz and initramfs detection across different distributions
 */

import fs from 'node:fs'
import path from 'path'
import Distro from '../distro.js'
import Diversions from '../diversions.js'
import Utils from '../utils.js'

/**
 * Kernel utilities for managing vmlinuz and initramfs paths
 */
export default class Kernel {
    /**
     * Ricava path per vmlinuz
     * 
     * Normalmente cerca BOOT_IMAGE nei parametri del kernel
     * BOOT_IMAGE=/boot/vmlinuz-5.16.0-3-amd64 root=UUID=... ro quiet splash
     * 
     * Se non è presente, come nel caso di Franco, cerca initrd e ricostruisce vmlinuz
     * ro root=UUID=... initrd=boot\initrd.img-5.15.0-0.bpo.3-amd64
     * 
     * @param kernel - Versione specifica del kernel (opzionale)
     * @returns Path al file vmlinuz
     */
    static vmlinuz(kernel = ''): string {
        let vmlinuz = ''
        /**
         * metodo /proc/cmdline
         */
        if (!Utils.isContainer()) {
            vmlinuz = this._vmlinuxFromCmdline()
        } else {
            vmlinuz = this._vmLinuxFromFiles(kernel)
        }

        if (!fs.existsSync(vmlinuz)) {
            console.log(`file ${vmlinuz} does not exist!`)
            process.exit()
        }
        return vmlinuz
    }

    
    /**
     * ricava path per vmlinuz
     * Normalmente cerca BOOT_IMAGE
     * BOOT_IMAGE=/boot/vmlinuz-5.16.0-3-amd64 root=UUID=13768873-d6ba-4ae5-9e14-b5011f5aa31c ro quiet splash resume=UUID=beafb9b4-c429-4e1f-a268-4270b63a14e6
     * se non è presente, come nel caso di Franco, cerca initrd e ricostruisce vmlinuz
     * ro root=UUID=3dc0f202-8ac8-4686-9316-dddcec060c48 initrd=boot\initrd.img-5.15.0-0.bpo.3-amd64 // Conidi
     */
    private static _vmlinuxFromCmdline() {
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
        if (vmlinuz.indexOf('@')) {
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

        /** 
         * If vmlinuz not found
         */
        if (vmlinuz === '') {
            let version = 'linux'
            if (distro.familyId === 'debian') {
                cmdline.forEach(cmd => {
                    if (cmd.includes('initrd.img')) {
                        version = cmd.substring(cmd.indexOf('initrd.img') + 10)
                    }
                })
            } else if (distro.distroId === 'Manjaro') {
                cmdline.forEach(cmd => {
                    if (cmd.includes('initrd.img')) {
                        version = cmd.substring(cmd.indexOf('initrd.img') + 10)
                    }
                })
            }
            vmlinuz = '/boot/vmlinuz-' + version
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
            // Auto-detection
            const kernelModulesPath = this.getKernelModulesPath()
            const kernels = this.getAvailableKernels(kernelModulesPath)
            const latestKernel = kernels[kernels.length - 1]
            kernel = latestKernel
        }

        if (distro.familyId === "archlinux") {
            initramfs = this.getArchInitramfs(kernel, distro)
        } else if (distro.familyId === "alpine") {
            initramfs = '/boot/initramfs-lts'
        } else {
            // Debian/Ubuntu/derivatives
            const possiblePaths = [
                `/boot/initrd.img-${kernel}`,
                `/boot/initramfs-${kernel}.img`,
                `/boot/initramfs-${kernel}`,
                `/boot/initrd-${kernel}` // opensuse
            ]

            for (const path of possiblePaths) {
                if (fs.existsSync(path)) {
                    initramfs = path
                    break
                }
            }
        }

        if (!fs.existsSync(initramfs)) {
            console.error(`ERROR: initramfs file ${initramfs} does not exist!`)
            this.listAvailableInitramfs()
            process.exit(1)
        }

        return initramfs
    }

/**
     * 
     * @param kernel 
     * @returns 
     */
    private static _vmLinuxFromFiles(kernel = ''): string {
        const distro = new Distro()
        let vmlinuz = ''

        if (kernel === '') {
            // Auto-detection del kernel dai moduli disponibili
            vmlinuz = this.detectKernelFromModules(distro)
        } else {
            // Kernel specificato manualmente
            vmlinuz = this.getSpecificKernelPath(kernel, distro)
        }

        // Validazione finale
        if (!fs.existsSync(vmlinuz)) {
            console.error(`ERROR: file ${vmlinuz} does not exist!`)
            console.error('Available kernels in /boot:')
            this.listAvailableKernels()
            process.exit(1)
        }

        return vmlinuz
    }

    /**
     * Rileva automaticamente il kernel dai moduli disponibili
     */
    private static detectKernelFromModules(distro: Distro): string {
        const kernelModulesPath = this.getKernelModulesPath()
        const kernels = this.getAvailableKernels(kernelModulesPath)

        if (kernels.length === 0) {
            throw new Error(`No kernels found in ${kernelModulesPath}`)
        }

        if (distro.familyId === "archlinux") {
            return this.getArchLinuxKernelPath(distro, kernelModulesPath, kernels)
        } else if (distro.familyId === "alpine") {
            return `/boot/vmlinuz-lts`
        } else {
            // Per Debian/Ubuntu usa l'ultimo kernel disponibile
            const latestKernel = kernels[kernels.length - 1]
            return `/boot/vmlinuz-${latestKernel}`
        }
    }

    /**
     * Ottiene il path per un kernel specifico
     */
    private static getSpecificKernelPath(kernel: string, distro: Distro): string {
        if (distro.familyId === "archlinux") {
            return this.getArchLinuxSpecificKernel(kernel, distro)
        } else if (distro.familyId === "alpine") {
            return `vmlinuz-lts`
        } else {
            return `/boot/vmlinuz-${kernel}`
        }
    }

    /**
     * Trova la directory dei moduli del kernel
     */
    private static getKernelModulesPath(): string {
        const possiblePaths = ['/usr/lib/modules', '/lib/modules']

        for (const path of possiblePaths) {
            if (fs.existsSync(path)) {
                return path
            }
        }

        throw new Error('No kernel modules directory found')
    }

    /**
     * Ottiene la lista dei kernel disponibili, ordinati
     */
    private static getAvailableKernels(modulesPath: string): string[] {
        try {
            const kernels = fs.readdirSync(modulesPath)
            return kernels.sort()
        } catch (error) {
            throw new Error(`Cannot read kernel modules from ${modulesPath}: ${error}`)
        }
    }

    /**
     * Gestisce il rilevamento del kernel per Arch Linux
     */
    private static getArchLinuxKernelPath(distro: Distro, modulesPath: string, kernels: string[]): string {
        if (Diversions.isManjaroBased(distro.distroId)) {
            return this.getManjaroKernelPath(kernels)
        } else {
            return this.getStandardArchKernelPath(kernels[0])
        }
    }

    /**
     * Gestisce il path del kernel per Manjaro
     */
    private static getManjaroKernelPath(kernels: string[]): string {
        const latestKernel = kernels[kernels.length - 1]
        const versionMatch = latestKernel.match(/^(\d+)\.(\d+)\./)

        if (!versionMatch) {
            throw new Error(`Cannot parse Manjaro kernel version from: ${latestKernel}`)
        }

        const [, major, minor] = versionMatch
        return `/boot/vmlinuz-${major}.${minor}-x86_64`
    }

    /**
     * Gestisce il path del kernel standard per Arch Linux
     */
    private static getStandardArchKernelPath(firstKernel: string): string {
        const kernelTypeMap = [
            { pattern: '-lts', name: 'linux-lts' },
            { pattern: '-hardened', name: 'linux-hardened' },
            { pattern: '-zen', name: 'linux-zen' }
        ]

        // Cerca un tipo specifico di kernel
        for (const { pattern, name } of kernelTypeMap) {
            if (firstKernel.includes(pattern)) {
                return `/boot/vmlinuz-${name}`
            }
        }

        // Default: kernel linux standard
        return '/boot/vmlinuz-linux'
    }

    /**
     * Gestisce il kernel specifico per Arch Linux
     */
    private static getArchLinuxSpecificKernel(kernel: string, distro: Distro): string {
        if (Diversions.isManjaroBased(distro.distroId)) {
            const versionMatch = kernel.match(/^(\d+)\.(\d+)\./)
            if (versionMatch) {
                const [, major, minor] = versionMatch
                return `/boot/vmlinuz-${major}.${minor}-x86_64`
            }
        }

        // Cerca i kernel Arch in ordine di preferenza
        const archKernelCandidates = [
            '/boot/vmlinuz-linux',
            '/boot/vmlinuz-linux-lts',
            '/boot/vmlinuz-linux-rt'
        ]

        for (const candidate of archKernelCandidates) {
            if (fs.existsSync(candidate)) {
                return candidate
            }
        }

        // Se nessun candidato è trovato, prova con il pattern originale
        return `/boot/vmlinuz-${kernel}`
    }

    /**
     * Gestisce initramfs per Arch Linux
     */
    private static getArchInitramfs(kernel: string, distro: Distro): string {
        if (Diversions.isManjaroBased(distro.distroId)) {
            const versionMatch = kernel.match(/^(\d+)\.(\d+)\./)
            if (versionMatch) {
                const [, major, minor] = versionMatch
                return `/boot/initramfs-${major}.${minor}-x86_64.img`
            }
        }

        // Standard Arch initramfs paths
        const archInitramfsCandidates = [
            '/boot/initramfs-linux.img',
            '/boot/initramfs-linux-lts.img',
            '/boot/initramfs-linux-rt.img',
            '/boot/initramfs-linux-zen.img',
            '/boot/initramfs-linux-hardened.img'
        ]

        for (const candidate of archInitramfsCandidates) {
            if (fs.existsSync(candidate)) {
                return candidate
            }
        }

        // Fallback generico
        return `/boot/initramfs-${kernel}.img`
    }

    /**
     * Lista i kernel disponibili in /boot per debugging
     */
    private static listAvailableKernels(): void {
        try {
            const bootFiles = fs.readdirSync('/boot')
                .filter(f => f.startsWith('vmlinuz'))
                .sort()

            if (bootFiles.length > 0) {
                bootFiles.forEach(file => console.error(`  - ${file}`))
            } else {
                console.error('  No vmlinuz files found in /boot')
            }
        } catch (error) {
            console.error('  Cannot read /boot directory')
        }
    }

    /**
     * Lista gli initramfs disponibili in /boot per debugging
     */
    private static listAvailableInitramfs(): void {
        try {
            const bootFiles = fs.readdirSync('/boot')
                .filter(f => f.startsWith('initrd') || f.startsWith('initramfs'))
                .sort()

            if (bootFiles.length > 0) {
                console.error('Available initramfs files in /boot:')
                bootFiles.forEach(file => console.error(`  - ${file}`))
            } else {
                console.error('  No initramfs files found in /boot')
            }
        } catch (error) {
            console.error('  Cannot read /boot directory')
        }
    }

    /**
     * Ottiene informazioni sul kernel corrente
     */
    static getCurrentKernelInfo(): { version: string, vmlinuz: string, initramfs: string } {
        try {
            const version = fs.readFileSync('/proc/version', 'utf8').trim()
            const kernelRelease = fs.readFileSync('/proc/sys/kernel/osrelease', 'utf8').trim()

            return {
                version: kernelRelease,
                vmlinuz: this.vmlinuz(kernelRelease),
                initramfs: this.initramfs(kernelRelease)
            }
        } catch (error) {
            throw new Error(`Cannot get current kernel info: ${error}`)
        }
    }
}