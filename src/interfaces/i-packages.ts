/**
 * ./src/interfaces/i-packages.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

interface TryRemove {
  packages: string[]
}

interface TryInstall {
  packages: string[]
}

interface Operations {
  try_remove: TryRemove
  try_install: TryInstall
}

export interface IPackages {
  backend: string
  operations: Operations
}