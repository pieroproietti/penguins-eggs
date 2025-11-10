/**
 * ./src/classes/incubation/customize/customize-partitions.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */


import fs from 'node:fs'
import Pacman from '../../pacman.js'
import yaml from 'js-yaml'
import { exec } from '../../../lib/utils.js'
import { ICalamaresPartitions } from '../../../interfaces/calamares/i-calamares-partitions.js'

/**
 * customize module partition
 * add/remove filesystem available
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
      Pacman.packageIsInstalled('btrfsprogs') ||
      Pacman.packageIsInstalled('btrfs-progs')) {
        
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
