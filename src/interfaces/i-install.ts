/**
 * ./src/interfaces/i-install.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

export interface IInstall {
  addEfi: boolean
  calamares: boolean
  configurationInstall: boolean
  configurationRefresh: boolean
  distroTemplate: boolean
  needUpdate: boolean
  prerequisites: boolean
}
