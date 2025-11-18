/**
 * ./src/classes/bootloaders.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import fs from 'node:fs'
import path from 'path'


/**
 * Bleach:
 */
export default class Bootloaders {


    /**
     * extractFromAppImage
     */
    static async extractFromAppImage() {
        const systemBootloadersPath = '/usr/lib/penguins-eggs/bootloaders';
        const tempBootloadersPath = '/tmp/eggs-bootloaders';

        console.log('Extracting bootloaders from AppImage...');

        try {
            // Crea directory temporanea
            if (!fs.existsSync(tempBootloadersPath)) {
                fs.mkdirSync(tempBootloadersPath, { recursive: true });
            }

            // Percorso ai bootloaders inclusi nell'AppImage
            const appImagePath = process.env.APPIMAGE;
            const includedBootloadersPath = '/usr/lib/penguins-eggs/bootloaders';

            // Usa unsquashfs per estrarre dall'AppImage
            const { spawnSync } = require('child_process');
            const result = spawnSync('unsquashfs', [
                '-f',
                '-d', tempBootloadersPath,
                appImagePath,
                includedBootloadersPath
            ]);

            if (result.status === 0) {
                // Crea symlink al percorso di sistema
                if (!fs.existsSync('/usr/lib/penguins-eggs')) {
                    fs.mkdirSync('/usr/lib/penguins-eggs', { recursive: true });
                }

                if (!fs.existsSync(systemBootloadersPath)) {
                    const extractedPath = path.join(tempBootloadersPath, includedBootloadersPath);
                    if (fs.existsSync(extractedPath)) {
                        fs.symlinkSync(extractedPath, systemBootloadersPath);
                        console.log('Bootloaders extracted and linked successfully');
                    }
                }
            } else {
                throw new Error('Failed to extract from AppImage');
            }

        } catch (error) {
            console.error('Failed to extract bootloaders:', error.message);

            // Fallback: copia dai bootloaders inclusi nel filesystem dell'AppImage
            await this.fallbackCopyBootloaders();
        }
    }

    private async fallbackCopyBootloaders() {
        const systemBootloadersPath = '/usr/lib/penguins-eggs/bootloaders';

        try {
            // Cerca i bootloaders nei percorsi possibili dell'AppImage
            const possiblePaths = [
                path.join(__dirname, '..', '..', 'usr', 'lib', 'penguins-eggs', 'bootloaders'),
                path.join(process.cwd(), 'usr', 'lib', 'penguins-eggs', 'bootloaders'),
                '/usr/lib/penguins-eggs/bootloaders' // già estratto
            ];

            for (const sourcePath of possiblePaths) {
                if (fs.existsSync(sourcePath)) {
                    if (!fs.existsSync('/usr/lib/penguins-eggs')) {
                        fs.mkdirSync('/usr/lib/penguins-eggs', { recursive: true });
                    }

                    // Copia ricorsiva
                    this.copyRecursiveSync(sourcePath, systemBootloadersPath);
                    console.log('Bootloaders copied from AppImage filesystem');
                    return;
                }
            }

            throw new Error('No bootloaders found in AppImage');

        } catch (error) {
            console.error('Fallback also failed:', error.message);
            throw error;
        }
    }

    /**
     * copyRecursiveSync(src, dest)
     * @param src 
     * @param dest 
     */
    private copyRecursiveSync(src, dest) {
        if (fs.statSync(src).isDirectory()) {
            if (!fs.existsSync(dest)) {
                fs.mkdirSync(dest, { recursive: true });
            }
            fs.readdirSync(src).forEach(item => {
                this.copyRecursiveSync(path.join(src, item), path.join(dest, item));
            });
        } else {
            fs.copyFileSync(src, dest);
        }
    }
}