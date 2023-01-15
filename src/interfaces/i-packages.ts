/**
 * calamares module packages
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