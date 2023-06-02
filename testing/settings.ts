#!/usr/bin/pnpx ts-node
/**
 * run with: pnpx ts-node
 * #!/usr/bin/pnpx ts-node
 */

interface Iinstance {
  id: string      // 'before_bootloader_mkdirs'
  moduce: string  // 'contextualprocess',
  config: string  // 'before_bootloader_mkdirs_context.conf'
}

interface ISettings {
  "modules-search": string[]
  "instances": [
    instance: Iinstance
  ]
  "sequence": [
    { show: string[] },
    { exec: string[] },
    { show: string[] },
  ]
  "branding": string,
  "prompt-install": boolean
  "dont-chroot": boolean
  "oem-setup": boolean
  "disable-cancel": boolean
  "disable-cancel-during-exec": boolean
}



import Utils from '../src/classes/utils'
import fs from 'fs'
import yaml from 'js-yaml'

Utils.titles('settings')



main()

async function main() {
  const settingsVar: string = fs.readFileSync('/etc/calamares/settings.conf', 'utf8')
  const settingsYaml = yaml.load(settingsVar) as ISettings

  // console.log()
  // console.log(settingsYaml.sequence[0])

  console.log()
  const sequence = settingsYaml.sequence[1]
  console.log(sequence)

  // console.log()
  // console.log(settingsYaml.sequence[2])
}


/*
const p = {
  'modules-search': ['local'],
  instances: [
    {
      id: 'before_bootloader_mkdirs',
      module: 'contextualprocess',
      config: 'before_bootloader_mkdirs_context.conf'
    },
    {
      id: 'before_bootloader',
      module: 'contextualprocess',
      config: 'before_bootloader_context.conf'
    },
    {
      id: 'after_bootloader',
      module: 'contextualprocess',
      config: 'after_bootloader_context.conf'
    },
    {
      id: 'logs',
      module: 'shellprocess',
      config: 'shellprocess_logs.conf'
    },
    {
      id: 'bug-LP#1829805',
      module: 'shellprocess',
      config: 'shellprocess_bug-LP#1829805.conf'
    },
    {
      id: 'add386arch',
      module: 'shellprocess',
      config: 'shellprocess_add386arch.conf'
    }
  ],
  sequence: [{ show: [Array] }, { exec: [Array] }, { show: [Array] }],
  branding: 'sample',
  'prompt-install': true,
  'dont-chroot': false,
  'oem-setup': false,
  'disable-cancel': false,
  'disable-cancel-during-exec': false
}
*/