/**
 * ./src/interfaces/i-materia.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import { stringify } from 'node:querystring'

export interface IRepos {
  key: string
  lines: string[]
  name: string
}

export interface IMateria {
  author: string

  description: string
  distributions: string[]
  name: string
  reboot: boolean
  release: string
  sequence: {
    repositories: {
      sources_list: string[]
      sources_list_d: string[]
      update: boolean
      upgrade: boolean
    }
    preinst: string[]
    packages: string[]
    packages_no_install_recommends: string[]
    packages_python: string[]
    debs: boolean
    accessories: string[]
    try_accessories: string[]
    try_packages: string[]
    try_packages_no_install_recommends: string[]
  }
  customize: {
    dirs: boolean
    scripts: string[]
  }
}
