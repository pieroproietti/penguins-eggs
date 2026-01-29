/**
 * ./src/interfaces/i-settings.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

interface Iinstance {
  config: string // 'before_bootloader_mkdirs_context.conf'
  id: string // 'before_bootloader_mkdirs'
  moduce: string // 'contextualprocess',
}

/**
 *
 */
export interface ISettings {
  branding: string
  'disable-cancel': boolean
  'disable-cancel-during-exec': boolean
  'dont-chroot': boolean
  instances: [instance: Iinstance]
  'modules-search': string[]
  'oem-setup': boolean
  'prompt-install': boolean
  sequence: [{ show: string[] }, { exec: string[] }, { show: string[] }]
}
