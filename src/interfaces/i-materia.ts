/**
 * ./src/interfaces/i-materia.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
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
  finalize: {
    cmds: string[]
    customize: boolean
  }
  name: string
  reboot: boolean
  release: string
  sequence: {
    accessories: string[]
    cmds: string[]
    packages: string[]
    packages_python: string[]
    repositories: {
      sources_list: string[]
      sources_list_d: string[]
      update: boolean
      upgrade: boolean
    }
  }
}
