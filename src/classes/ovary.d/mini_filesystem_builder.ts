/**
 * ./src/classes/ovary.d/mini-filesystem-builder.ts
 * 
 * Crea un filesystem.squashfs MINIMO che:
 * 1. Live-boot lo trova e boota felice
 * 2. Contiene solo script + cryptsetup + busybox
 * 3. Sblocca root.img e passa al vero filesystem
 */

import fs from 'fs'
import path from 'path'
import Ovary from '../ovary.js'
import Utils from '../utils.js'
import { exec } from '../../lib/utils.js'

const __dirname = path.dirname(new URL(import.meta.url).pathname)

/**
 * Crea il mini-filesystem che funge da trampolino
 */
export async function createMiniFilesystem(
  this: Ovary,
  outputSquashfs: string
): Promise<void> {
  Utils.warning('Creating minimal trampoline filesystem...')

  const workDir = '/tmp/mini-filesystem'
  const scriptsDir = path.join(__dirname, '../../../scripts')

  try {
    // Pulisci
    if (fs.existsSync(workDir)) {
      await exec(`rm -rf ${workDir}`)
    }

    // Crea struttura base
    Utils.warning('Creating directory structure...')
    const dirs = [
      'bin', 'sbin', 'lib', 'lib64',
      'usr/bin', 'usr/sbin', 'usr/lib',
      'etc', 'dev', 'proc', 'sys', 'run', 'tmp',
      'mnt/root-img', 'mnt/real-root',
      'live'  // Per compatibilità live-boot
    ]

    for (const dir of dirs) {
      fs.mkdirSync(path.join(workDir, dir), { recursive: true })
    }

    // Installa busybox (tutto in uno)
    Utils.warning('Installing busybox...')
    await exec(`cp /bin/busybox ${workDir}/bin/`)
    
    // Crea symlink per tutti i comandi busybox
    const busyboxCmds = (await exec('busybox --list', { capture: true })).data
      .split('\n')
      .filter(cmd => cmd.trim())

    for (const cmd of busyboxCmds) {
      await exec(`ln -sf /bin/busybox ${workDir}/bin/${cmd}`).catch(() => {})
    }

    // Installa cryptsetup
    Utils.warning('Installing cryptsetup...')
    await exec(`cp /sbin/cryptsetup ${workDir}/sbin/`)

    // Copia librerie necessarie
    Utils.warning('Copying libraries...')
    await copyLibraries(workDir, '/sbin/cryptsetup')
    await copyLibraries(workDir, '/bin/busybox')

    // Copia i moduli necessari
    const kernelVersion = (await exec('uname -r', { capture: true })).data.trim()
    await copyKernelModules(workDir, kernelVersion)

    // Crea lo script init principale
    Utils.warning('Creating init script...')
    const initScript = await generateInitScript()
    fs.writeFileSync(path.join(workDir, 'init'), initScript)
    fs.chmodSync(path.join(workDir, 'init'), 0o755)

    // Crea device nodes essenziali
    Utils.warning('Creating device nodes...')
    await exec(`mknod ${workDir}/dev/console c 5 1`).catch(() => {})
    await exec(`mknod ${workDir}/dev/null c 1 3`).catch(() => {})

    // Comprimi in squashfs
    Utils.warning('Creating squashfs...')
    if (fs.existsSync(outputSquashfs)) {
      fs.unlinkSync(outputSquashfs)
    }

    await exec(`mksquashfs ${workDir} ${outputSquashfs} -comp zstd -b 1M -Xcompression-level 15`)

    const stats = fs.statSync(outputSquashfs)
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2)

    Utils.success(`✓ Mini filesystem created: ${sizeMB} MB`)
    Utils.success('  This will act as a trampoline to unlock the real system')

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
  binary: string
): Promise<void> {
  const lddOutput = (await exec(`ldd ${binary}`, { capture: true })).data
  
  const libs = lddOutput
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
      fs.mkdirSync(path.dirname(dest), { recursive: true })
      await exec(`cp -L ${lib} ${dest}`)
    }
  }

  // Copia anche il dynamic linker
  const linkers = [
    '/lib64/ld-linux-x86-64.so.2',
    '/lib/ld-linux.so.2'
  ]

  for (const linker of linkers) {
    if (fs.existsSync(linker)) {
      const dest = path.join(workDir, linker.replace(/^\//, ''))
      fs.mkdirSync(path.dirname(dest), { recursive: true })
      await exec(`cp -L ${linker} ${dest}`)
    }
  }
}

/**
 * 
 * @param workDir 
 * @param kernelVersion 
 * @returns 
 */
async function copyKernelModules(
  workDir: string,
  kernelVersion: string
): Promise<void> {
  Utils.warning('Copying kernel modules...')
  
  const modulesSource = `/lib/modules/${kernelVersion}`
  const modulesDest = path.join(workDir, `lib/modules/${kernelVersion}`)
  
  if (!fs.existsSync(modulesSource)) {
    Utils.warning(`Kernel modules not found for ${kernelVersion}`)
    return
  }
  
  fs.mkdirSync(modulesDest, { recursive: true })
  
  // Copia TUTTA la directory dei moduli
  Utils.warning('Copying all kernel modules...')
  await exec(`cp -r ${modulesSource}/* ${modulesDest}/`)
  
  Utils.success(`✓ Kernel modules copied`)
}

/**
 * Copia i moduli kernel minimo
 */
async function copyKernelModulesMini(
  workDir: string,
  kernelVersion: string
): Promise<void> {
  Utils.warning('Copying kernel modules...')
  
  const modulesSource = `/lib/modules/${kernelVersion}`
  const modulesDest = path.join(workDir, `lib/modules/${kernelVersion}`)
  
  if (!fs.existsSync(modulesSource)) {
    Utils.warning(`Kernel modules not found for ${kernelVersion}`)
    return
  }
  
  fs.mkdirSync(modulesDest, { recursive: true })
  
  // Copia solo i moduli essenziali per dm e crypto
  const essentialModules = [
    'kernel/drivers/md/dm-mod.ko*',
    'kernel/crypto/dm-crypt.ko*',
    'modules.order',
    'modules.builtin'
  ]
  
  for (const mod of essentialModules) {
    await exec(`find ${modulesSource} -name "${mod}" -exec cp {} ${modulesDest}/ \\;`).catch(() => {})
  }
  
  // Genera modules.dep
  await exec(`depmod -b ${workDir} ${kernelVersion}`).catch(() => {
    Utils.warning('Could not generate modules.dep')
  })
}
/**
 * Genera lo script init che sblocca e passa al vero sistema
 */
async function generateInitScript(): Promise<string> {
  return `#!/bin/sh
# Mini-init: Sblocca root.img e passa al vero filesystem

# Mount essenziali
mount -t proc proc /proc
mount -t sysfs sysfs /sys
mount -t devtmpfs devtmpfs /dev
mount -t tmpfs tmpfs /run

# Carica moduli kernel necessari
echo "Loading kernel modules..."
modprobe dm_mod 2>/dev/null || echo "Warning: dm_mod not loaded"
modprobe dm_crypt 2>/dev/null || echo "Warning: dm_crypt not loaded"
sleep 2

echo ""
echo "╔════════════════════════════════════════╗"
echo "║   Encrypted System Bootstrap           ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Aspetta che i device siano pronti
sleep 3

# Trova e monta il media live
echo "Searching for live media..."
mkdir -p /mnt/live-media

for dev in /dev/sr* /dev/sd* /dev/vd*; do
    [ -b "$dev" ] || continue
    
    if mount -o ro $dev /mnt/live-media 2>/dev/null; then
        if [ -f /mnt/live-media/live/root.img ]; then
            echo "Found live media on $dev"
            LIVE_MEDIA="/mnt/live-media"
            break
        fi
        umount /mnt/live-media 2>/dev/null
    fi
done

if [ -z "$LIVE_MEDIA" ]; then
    echo "ERROR: Could not find live media!"
    exec /bin/sh
fi

ROOT_IMG="$LIVE_MEDIA/live/root.img"

# Verifica LUKS
if ! cryptsetup isLuks "$ROOT_IMG"; then
    echo "ERROR: root.img is not a LUKS volume"
    exec /bin/sh
fi

echo ""
echo "Enter passphrase to unlock system (3 attempts):"
echo ""

# Copia in RAM
echo "Copying root.img to RAM..."
mkdir -p /run
cp "$ROOT_IMG" /run/root.img

# Sblocca
MAX_ATTEMPTS=3
ATTEMPT=1
UNLOCKED=0

while [ $ATTEMPT -le $MAX_ATTEMPTS ] && [ $UNLOCKED -eq 0 ]; do
    echo "Attempt $ATTEMPT of $MAX_ATTEMPTS:"
    
    if cryptsetup open /run/root.img live-root; then
        UNLOCKED=1
        echo "Unlocked successfully!"
    else
        [ $ATTEMPT -lt $MAX_ATTEMPTS ] && echo "Wrong passphrase. Try again."
        ATTEMPT=$((ATTEMPT + 1))
    fi
done

if [ $UNLOCKED -eq 0 ]; then
    echo "Failed to unlock. Dropping to shell."
    exec /bin/sh
fi

# Monta il volume decifrato
echo "Mounting decrypted volume..."
mkdir -p /mnt/root-img
mount -o ro /dev/mapper/live-root /mnt/root-img

# Monta il vero filesystem.squashfs
echo "Mounting real filesystem..."
mkdir -p /mnt/real-root
mount -o ro,loop /mnt/root-img/filesystem.squashfs /mnt/real-root

# Verifica
if [ ! -x /mnt/real-root/sbin/init ]; then
    echo "ERROR: No init found in real filesystem!"
    exec /bin/sh
fi

# Passa al vero sistema con switch_root
echo "Switching to real system..."
umount /proc /sys /dev

exec switch_root /mnt/real-root /sbin/init
`
}
