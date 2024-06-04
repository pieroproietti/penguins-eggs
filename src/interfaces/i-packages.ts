/**
 * ./src/interfaces/i-packages.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

interface Try {
  packages: string[]
}

interface Operations {
  try_remove?: Try
  try_install?: Try
}

export interface IPackages {
  backend: string
  operations: Operations
}