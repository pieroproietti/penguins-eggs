/**
 * penguins-eggs
 * interface: i-net.ts
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
export interface INet {
  iface: string
  addressType: string
  address: string
  netmask: string
  gateway: string
  domain: string
  dns: string[]
}
