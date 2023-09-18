/**
 * penguins-eggs
 * interface: i-settings.ts
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
interface Iinstance {
  id: string      // 'before_bootloader_mkdirs'
  moduce: string  // 'contextualprocess',
  config: string  // 'before_bootloader_mkdirs_context.conf'
}

/**
 * 
 */
export interface ISettings {
  "modules-search": string[]
  "instances": [
    instance: Iinstance
  ]
  "sequence": [
      { show: string[]},
      { exec: string[]},
      { show: string[]}
    ]
  "branding": string,
  "prompt-install": boolean
  "dont-chroot": boolean
  "oem-setup": boolean
  "disable-cancel": boolean
  "disable-cancel-during-exec": boolean
}
