/**
 * calamares module packages
 */

export interface IOperations {
  remove: string[]
  try_install: string[]
}

export interface IPackages {
  backend: string
  operations: IOperations
}
