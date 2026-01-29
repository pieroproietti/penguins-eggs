/**
 * ./src/interfaces/i-installer.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

export interface IInstaller {
  configRoot: string
  modules: string
  multiarch: string
  multiarchModules: string
  name: string

  template: string
  templateModules: string
  templateMultiarch: string
}
