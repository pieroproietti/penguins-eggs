/**
 * ./src/interfaces/i-packages.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

interface operations {
  packages: string[]
}

export interface IPackages {
  backend: string
  operations: operations[]
}

/**
# Debian/Buster et others
# packages
---
backend: apt

operations:
- remove:
  - calamares
  - eggs
- try_install:
  - firefox-esr-$LOCALE

 */
