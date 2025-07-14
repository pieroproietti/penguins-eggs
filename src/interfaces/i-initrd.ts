/**
 * ./src/interfaces/i-initrd.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

export interface IInitrd {
  cryptoroot: boolean
  crypttab: boolean
  resume: boolean
  zz_resume_auto: boolean
}
