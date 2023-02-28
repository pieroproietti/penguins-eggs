import {stringify} from 'node:querystring'

export interface IRepos {
    name: string
    key: string
    lines: string[]
}

export interface IMateria {
  name: string
  author: string
  description: string
  release: string
  distributions: string[]
  sequence: {
    repositories: {
      sources_list: string[]
      sources_list_d: string []
      update: boolean
      upgrade: boolean
    },
    preinst: string[]
    dependencies: string[]
    packages: string[]
    packages_no_install_recommends: string[]
    try_packages: string[]
    try_packages_no_install_recommends: string[]
    debs: boolean
    packages_python: string[]
    accessories: string[]
    try_accessories: string[]
  }
  customize: {
    dirs: boolean
    hostname: boolean
    scripts: string[]
  }
  reboot: boolean
}
