import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs'

const execAsync = promisify(exec);

export async function dracut(): Promise<string> {
    const { stdout: kernelVersion } = await execAsync('uname -r');
    const version = kernelVersion.trim();
    let initrdPath = `/boot/initramfs-${kernelVersion}.img`
    if (fs.existsSync(initrdPath)) {
        return initrdPath
    }
    return ''
}
