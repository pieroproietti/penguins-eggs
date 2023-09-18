/**
 * penguins-eggs
 * interface: i-initrd.ts
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
