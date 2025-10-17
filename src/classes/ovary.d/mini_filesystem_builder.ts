/**
 * ./src/classes/ovary.d/mini-filesystem-builder.ts
 * 
 * Crea un filesystem.squashfs COMODO e COMPLETO per bootstrap
 * Non ci limitiamo - meglio avere tutto e debuggare facilmente!
 */

import fs from 'fs'
import path from 'path'
import Ovary from '../ovary.js'
import Utils from '../utils.js'
import { exec } from '../../lib/utils.js'

const __dirname = path.dirname(new URL(import.meta.url).pathname)

/**
 * Crea il mini-filesystem completo
 */
export async function createMiniFilesystem(
  this: Ovary,
  outputSquashfs: string
): Promise<void> {
  Utils.warning('Creating comfortable bootstrap filesystem...')

  const workDir = '/tmp/mini-filesystem'

  try {
    // Pulisci
    if (fs.existsSync(workDir)) {
      await exec(`rm -rf ${workDir}`)
    }

    // Crea struttura base
    Utils.warning('Creating directory structure...')
    const dirs = [
      'bin', 'sbin', 'lib', 'lib64', 'lib/x86_64-linux-gnu',
      'usr/bin', 'usr/sbin', 'usr/lib', 'usr/lib/x86_64-linux-gnu',
      'etc', 'dev', 'proc', 'sys', 'run', 'tmp', 'var/tmp',
      'mnt/live-media', 'mnt/root-img', 'mnt/real-root',
      'root',  // Home di root
      'live'
    ]

    for (const dir of dirs) {
      fs.mkdirSync(path.join(workDir, dir), { recursive: true })
    }

    // Binari essenziali - VERI, non busybox!
    Utils.warning('Installing essential binaries...')
    const essentialBinaries = [
      // Shell e core
      '/bin/bash',
      '/bin/sh',
      
      // Filesystem tools
      '/bin/mount',
      '/bin/umount',
      '/bin/mkdir',
      '/bin/rmdir',
      
      // File operations
      '/bin/ls',
      '/bin/cat',
      '/bin/cp',
      '/bin/mv',
      '/bin/rm',
      '/bin/ln',
      '/bin/chmod',
      '/bin/chown',
      
      // Text tools
      '/bin/grep',
      '/bin/sed',
      '/usr/bin/less',
      '/usr/bin/nano',
      
      // System info
      '/bin/ps',
      '/usr/bin/free',
      '/usr/bin/top',
      '/bin/df',
      '/usr/bin/lsblk',
      '/usr/bin/file',
      
      // Crypto
      '/sbin/cryptsetup',
      
      // Kernel modules
      '/bin/kmod'
    ]

    for (const binary of essentialBinaries) {
      if (fs.existsSync(binary)) {
        const destPath = binary.replace(/^\//, '')
        const dest = path.join(workDir, destPath)
        fs.mkdirSync(path.dirname(dest), { recursive: true })
        await exec(`cp ${binary} ${dest}`).catch(() => {
          Utils.warning(`Could not copy ${binary}`)
        })
      }
    }

    // Symlink per kmod
    Utils.warning('Creating kmod symlinks...')
    const kmodLinks = ['modprobe', 'lsmod', 'rmmod', 'insmod', 'depmod']
    for (const link of kmodLinks) {
      await exec(`ln -sf /bin/kmod ${workDir}/sbin/${link}`).catch(() => {})
    }

    // Symlink sh -> bash
    await exec(`ln -sf bash ${workDir}/bin/sh`).catch(() => {})

    // Copia TUTTE le librerie necessarie
    Utils.warning('Copying all required libraries (this takes a moment)...')
    
    // Trova tutti i binari copiati e copia le loro librerie
    const copiedBinaries = await exec(`find ${workDir}/bin ${workDir}/sbin ${workDir}/usr/bin ${workDir}/usr/sbin -type f -executable 2>/dev/null`, { 
      capture: true 
    }).catch(() => ({ data: '' }))

    if (copiedBinaries.data) {
      for (const binary of copiedBinaries.data.split('\n').filter(b => b)) {
        await copyLibraries(workDir, binary, workDir)
      }
    }

    // Copia i moduli kernel
    const kernelVersion = (await exec('uname -r', { capture: true })).data.trim()
    Utils.warning(`Copying kernel modules for ${kernelVersion}...`)
    await copyKernelModules(workDir, kernelVersion)

    // Crea bashrc minimale per usabilità
    const bashrc = `# Mini-filesystem bashrc
export PS1='\\[\\033[01;32m\\]bootstrap\\[\\033[00m\\]:\\[\\033[01;34m\\]\\w\\[\\033[00m\\]\\$ '
export PATH=/bin:/sbin:/usr/bin:/usr/sbin
export TERM=linux
alias ll='ls -la'
alias l='ls -l'
`
    fs.writeFileSync(path.join(workDir, 'root/.bashrc'), bashrc)

    // Crea lo script init
    Utils.warning('Creating init script...')
    const initScript = generateInitScript()
    fs.writeFileSync(path.join(workDir, 'sbin/init'), initScript)
    fs.chmodSync(path.join(workDir, 'sbin/init'), 0o755)

    // Crea device nodes essenziali
    Utils.warning('Creating device nodes...')
    await exec(`mknod ${workDir}/dev/console c 5 1`).catch(() => {})
    await exec(`mknod ${workDir}/dev/null c 1 3`).catch(() => {})
    await exec(`mknod ${workDir}/dev/zero c 1 5`).catch(() => {})
    await exec(`mknod ${workDir}/dev/random c 1 8`).catch(() => {})

    // Comprimi in squashfs
    Utils.warning('Creating squashfs (may take a minute)...')
    if (fs.existsSync(outputSquashfs)) {
      fs.unlinkSync(outputSquashfs)
    }

    await exec(`mksquashfs ${workDir} ${outputSquashfs} -comp zstd -b 1M`)

    const stats = fs.statSync(outputSquashfs)
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2)

    Utils.success(`✓ Comfortable bootstrap filesystem created: ${sizeMB} MB`)
    Utils.success('  Full bash, real mount, nano editor, and all debugging tools included!')

  } catch (error) {
    Utils.error(`Failed to create mini filesystem: ${error}`)
    throw error
  } finally {
    // Cleanup
    if (fs.existsSync(workDir)) {
      await exec(`rm -rf ${workDir}`).catch(() => {})
    }
  }
}

/**
 * Copia le librerie necessarie per un binario
 */
async function copyLibraries(
  workDir: string,
  binary: string,
  rootDir: string = ''
): Promise<void> {
  // Se il binario è già nel workDir, usa il path originale per ldd
  const binaryForLdd = binary.startsWith(workDir) 
    ? binary.replace(workDir, rootDir || '') 
    : binary

  if (!fs.existsSync(binaryForLdd)) {
    return
  }

  const lddOutput = await exec(`ldd ${binaryForLdd} 2>/dev/null`, { 
    capture: true 
  }).catch(() => ({ data: '' }))

  if (!lddOutput.data) return

  const libs = lddOutput.data
    .split('\n')
    .filter(line => line.includes('=>'))
    .map(line => {
      const match = line.match(/=> (.+?) \(/)
      return match ? match[1].trim() : null
    })
    .filter(lib => lib !== null)

  for (const lib of libs) {
    if (lib && fs.existsSync(lib)) {
      const dest = path.join(workDir, lib.replace(/^\//, ''))
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(path.dirname(dest), { recursive: true })
        await exec(`cp -L ${lib} ${dest}`).catch(() => {})
      }
    }
  }

  // Dynamic linker
  const linkers = [
    '/lib64/ld-linux-x86-64.so.2',
    '/lib/ld-linux.so.2',
    '/lib/ld-linux-aarch64.so.1'
  ]

  for (const linker of linkers) {
    if (fs.existsSync(linker)) {
      const dest = path.join(workDir, linker.replace(/^\//, ''))
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(path.dirname(dest), { recursive: true })
        await exec(`cp -L ${linker} ${dest}`).catch(() => {})
      }
    }
  }
}

/**
 * Copia tutti i moduli kernel
 */
async function copyKernelModules(
  workDir: string,
  kernelVersion: string
): Promise<void> {
  const modulesSource = `/lib/modules/${kernelVersion}`
  const modulesDest = path.join(workDir, `lib/modules/${kernelVersion}`)

  if (!fs.existsSync(modulesSource)) {
    Utils.warning(`Kernel modules not found for ${kernelVersion}`)
    return
  }

  fs.mkdirSync(modulesDest, { recursive: true })

  // Copia tutti i moduli
  await exec(`cp -r ${modulesSource}/* ${modulesDest}/`)

  Utils.success(`✓ All kernel modules copied`)
}

/**
 * Genera lo script init
 */
function generateInitScript(): string {
  return `#!/bin/bash
# Bootstrap init - Sblocca root.img cifrato

# Mount essenziali
mount -t proc proc /proc
mount -t sysfs sysfs /sys
mount -t devtmpfs devtmpfs /dev
mount -t tmpfs tmpfs /run
mount -t tmpfs tmpfs /tmp

# Carica moduli
echo "Loading kernel modules..."
modprobe dm_mod 2>/dev/null
modprobe dm_crypt 2>/dev/null
sleep 2

clear
echo ""
echo "╔════════════════════════════════════════╗"
echo "║   Encrypted System Bootstrap           ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Trova media live
echo "Searching for live media..."
sleep 3

for dev in /dev/sr* /dev/sd* /dev/vd*; do
    [ -b "$dev" ] || continue
    
    if mount -o ro $dev /mnt/live-media 2>/dev/null; then
        if [ -f /mnt/live-media/live/root.img ]; then
            echo "✓ Found live media on $dev"
            LIVE_MEDIA="/mnt/live-media"
            break
        fi
        umount /mnt/live-media 2>/dev/null
    fi
done

if [ -z "$LIVE_MEDIA" ]; then
    echo "✗ ERROR: Could not find live media!"
    echo "Dropping to shell for debugging..."
    exec /bin/bash
fi

ROOT_IMG="$LIVE_MEDIA/live/root.img"

# Verifica LUKS
if ! cryptsetup isLuks "$ROOT_IMG"; then
    echo "✗ ERROR: root.img is not a LUKS volume"
    exec /bin/bash
fi

echo ""
echo "Found encrypted root.img"
echo "Enter passphrase to unlock (3 attempts):"
echo ""

# Sblocca (direttamente dal CD, senza copiare)
MAX_ATTEMPTS=3
ATTEMPT=1

while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
    echo "Attempt $ATTEMPT of $MAX_ATTEMPTS:"
    
    if cryptsetup open "$ROOT_IMG" live-root; then
        echo ""
        echo "✓ Unlocked successfully!"
        break
    fi
    
    if [ $ATTEMPT -lt $MAX_ATTEMPTS ]; then
        echo "✗ Wrong passphrase. Try again."
        ATTEMPT=$((ATTEMPT + 1))
    else
        echo "✗ Failed after $MAX_ATTEMPTS attempts"
        echo "Dropping to shell for debugging..."
        exec /bin/bash
    fi
done

# Monta volume decifrato
echo ""
echo "Mounting decrypted volume..."
if ! mount -t ext4 -o ro /dev/mapper/live-root /mnt/root-img; then
    echo "✗ ERROR: Failed to mount decrypted volume"
    echo "Dropping to shell for debugging..."
    exec /bin/bash
fi

# Monta il vero filesystem
echo "Mounting real filesystem..."
if ! mount -t squashfs -o ro,loop /mnt/root-img/filesystem.squashfs /mnt/real-root; then
    echo "✗ ERROR: Failed to mount real filesystem"
    echo "Dropping to shell for debugging..."
    umount /mnt/root-img
    cryptsetup close live-root
    exec /bin/bash
fi

# Verifica init
if [ ! -x /mnt/real-root/sbin/init ]; then
    echo "✗ ERROR: No init found in real filesystem"
    exec /bin/bash
fi

# Switch root
echo "✓ Switching to real system..."
echo ""
sleep 1

# Monta filesystem nel nuovo root
mount --move /dev /mnt/real-root/dev
mount --move /proc /mnt/real-root/proc
mount --move /sys /mnt/real-root/sys
mount --move /run /mnt/real-root/run

# Passa al sistema reale
exec switch_root /mnt/real-root /sbin/init
`
}
