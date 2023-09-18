/**
 * penguins-eggs
 * interface: i-xkd-model.ts
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
export interface IXkbModel {
    code: string,
    description: string
}

export interface IXkbLayout {
    code: string,
    description: string
}

export interface IXkbVariant {
    code: string,
    lang: string,
    description: string
}

export interface IXkbOption {
    code: string
    description: string
}
