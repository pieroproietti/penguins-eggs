/**
 * ./src/interfaces/i-xkb-model.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

export interface IXkbModel {
  code: string
  description: string
}

export interface IXkbLayout {
  code: string
  description: string
}

export interface IXkbVariant {
  code: string
  description: string
  lang: string
}

export interface IXkbOption {
  code: string
  description: string
}
