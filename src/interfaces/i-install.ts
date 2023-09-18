/**
 * penguins-eggs
 * interface: i-install.ts
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
export interface IInstall {
  distroTemplate: boolean
  efi: boolean
  calamares: boolean
  configurationInstall: boolean
  configurationRefresh: boolean
  prerequisites: boolean
  needApt: boolean
}
