import fs from 'node:fs'
import Pacman from '../../pacman.js'
import yaml from 'js-yaml'
import { exec } from '../../../lib/utils.js'
import { ICalamaresPartitions } from '../../../interfaces/calamares/i-calamares-partitions.js'

/**
 *
 */
export async function customizePartitions() {
  const filePartition = '/etc/calamares/modules/partition.conf'
  const partition = yaml.load(fs.readFileSync(filePartition, 'utf8')) as ICalamaresPartitions

  
  // detect filesystem type
  let test = await exec(`df -T / | awk 'NR==2 {print $2}'`, { capture: true, echo: false })
  partition.defaultFileSystemType = test.data.trim()

  /**
   * Determino i filesystem disponibili
   */
  partition.availableFileSystemTypes = ['ext4']

  if (Pacman.packageIsInstalled('progs') ||
    Pacman.packageIsInstalled('btrfsprogs')) {
    partition.availableFileSystemTypes.push('btrfs')
  }

  if (Pacman.packageIsInstalled('xfsprogs')) {
    partition.availableFileSystemTypes.push('xfs')
  }

  if (Pacman.packageIsInstalled('f2fs-tools')) {
    partition.availableFileSystemTypes.push('f2fs')
  }

  fs.writeFileSync(filePartition, yaml.dump(partition), 'utf-8')
  
}
