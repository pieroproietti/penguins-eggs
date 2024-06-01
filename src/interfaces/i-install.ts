/**
 * ./src/interfaces/i-install.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

export interface IInstall {
  calamares: boolean
  configurationInstall: boolean
  configurationRefresh: boolean
  distroTemplate: boolean
  efi: boolean
  needApt: boolean
  prerequisites: boolean
}
