/**
 * ./src/interfaces/i-net.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

export interface INet {
  address: string
  addressType: string
  dns: string[]
  domain: string
  gateway: string
  iface: string
  netmask: string
}
