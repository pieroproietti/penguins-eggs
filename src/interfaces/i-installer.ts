/**
 * penguins-eggs
 * interface: i-installer.ts
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
export interface IInstaller {
  name: string
  configRoot: string
  modules: string
  multiarch: string
  multiarchModules: string

  template: string
  templateModules: string
  templateMultiarch: string
}
