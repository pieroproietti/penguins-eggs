/**
 * penguins-eggs
 * interface: i-packages.ts
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
