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
  release: string
  sequence: {
    repositories: {
      sources_list: string[]
      sources_list_d: string[]
      update: boolean
      upgrade: boolean
    }
    cmds: string[]
    packages: string[]
    packages_python: string[]
    accessories: string[]
  }
  finalize: {
    customize: boolean
    cmds: string[]
  }
  reboot: boolean
}
