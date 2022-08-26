/**
 * calamares module packages
 */

export interface IPackages {
  backend: string
  operations: {
    remove: string[]
    try_install: string[]
  }
}
