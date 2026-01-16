/**
 * ./src/krill/modules/grubcfg.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * REFACTORED: Adds SELinux permissive mode for RHEL family
 */

import fs from 'node:fs'

import Utils from '../../../classes/utils.js'
import Sequence from '../../classes/sequence.js'
import { InstallationMode } from '../krill_enums.js'

/**
 * grubcfg
 * - open /etc/default/grub
 * - handle BTRFS/LUKS settings
 * - inject enforcing=0 for Fedora/RHEL to allow autorelabel on first boot
 */
export default async function grubcfg(this: Sequence) {
  const file = `${this.installTarget}/etc/default/grub`
  
  if (!fs.existsSync(file)) {
      console.warn(`Warning: ${file} not found. Skipping GRUB config.`)
      return
  }

  let content = ''
  const grubs = fs.readFileSync(file, 'utf8').split('\n')
  
  // Cache per la verifica della famiglia
  const isRhelFamily = ['almalinux', 'centos', 'fedora', 'rhel', 'rocky'].includes(this.distro.familyId)

  for (let line of grubs) {

    // 1. LOGICA ESISTENTE (BTRFS / LUKS)
    // Questa logica riscrive completamente la riga DEFAULT se necessario
    if (line.trim().startsWith('GRUB_CMDLINE_LINUX_DEFAULT=') && this.partitions.filesystemType === 'btrfs') {
        const uuid = Utils.uuid(this.devices.swap.name)
        if (this.partitions.installationMode === InstallationMode.Luks) {
            line = `GRUB_CMDLINE_LINUX_DEFAULT="resume=UUID=${uuid}"`
        } else {
            line = `GRUB_CMDLINE_LINUX_DEFAULT="quiet splash rootflags=subvol=@"`
        }
      }

    // 2. LOGICA SELINUX (RHEL/FEDORA)
    // Applichiamo la modifica sia se la riga è stata appena toccata, sia se è originale.
    // Fedora usa spesso anche GRUB_CMDLINE_LINUX (senza DEFAULT), quindi controlliamo entrambe.
    if (isRhelFamily && (line.trim().startsWith('GRUB_CMDLINE_LINUX_DEFAULT=') || line.trim().startsWith('GRUB_CMDLINE_LINUX=')) && // Se non c'è già il parametro, lo iniettiamo subito dopo la prima virgoletta
            !line.includes('enforcing=0')) {
                line = line.replace('="', '="enforcing=0 ')
                console.log(`- GRUB: injected enforcing=0 into ${line.split('=')[0]}`)
            }

    content += line + '\n'
  }

  fs.writeFileSync(file, content, 'utf-8')
}