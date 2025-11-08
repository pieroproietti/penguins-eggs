/**
 * ./src/classes/network.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */


import { Netmask } from 'netmask'
import os from 'node:os'
import dns from 'node:dns' // new change [1]

export default class Network {
  address = ''
  cidr = ''
  family = ''
  internal = false
  mac = ''
  netmask = ''
  o: Netmask | null = null
  interfaceName = '' // new change [2]

  constructor() {
    const interfaces = os.networkInterfaces()

    if (!interfaces) {
      console.warn('⚠️ No network interfaces found.') // new change [3]
      return
    }

    // new change [4] — priority list for preferred interfaces
    const preferred = ['eth0', 'enp', 'wlan0', 'en0']
    const keys = Object.keys(interfaces).sort((a, b) => {
      const pa = preferred.some(p => a.includes(p)) ? -1 : 1
      const pb = preferred.some(p => b.includes(p)) ? -1 : 1
      return pa - pb
    })

    for (const devName of keys) {
      const iface = interfaces[devName]
      if (!iface) continue

      for (const alias of iface) {
        if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
          this.interfaceName = devName // new change [5]
          this.address ||= alias.address
          this.cidr ||= alias.cidr ?? `${alias.address}/${this.netmaskToPrefix(alias.netmask)}`
          this.family ||= alias.family
          this.mac ||= alias.mac
          this.netmask ||= alias.netmask
          break
        }
      }
      if (this.address) break
    }

    if (!this.cidr) {
      console.warn('⚠️ CIDR not detected; fallback calculation may be inaccurate.') // new change [6]
    }

    if (this.cidr) {
      try {
        this.o = new Netmask(this.cidr)
      } catch (err) {
        console.error('❌ Failed to parse CIDR:', err)
      }
    }
  }

  // Convert netmask to prefix length, e.g. 255.255.255.0 → /24
  private netmaskToPrefix(mask: string): number {
    // new change [7]
    return mask
      .split('.')
      .map(octet => parseInt(octet, 10).toString(2))
      .join('')
      .split('1').length - 1
  }

  base() { return this.o?.base ?? '' }
  broadcast() { return this.o?.broadcast ?? '' }
  first() { return this.o?.first ?? '' }
  last() { return this.o?.last ?? '' }
  size() { return this.o?.size ?? 0 }
  toString() { return this.o?.toString() ?? '' }

  // new change [8] — check for internet connectivity
  async hasInternetConnection(): Promise<boolean> {
    return new Promise(resolve => {
      dns.lookup('google.com', err => {
        resolve(!err)
      })
    })
  }

  // new change [9] — print readable info in terminal
  printInfo(): void {
    console.log('🌐 Network Information:')
    console.log('---------------------------')
    console.log(`Interface: ${this.interfaceName}`)
    console.log(`Address:   ${this.address}`)
    console.log(`CIDR:      ${this.cidr}`)
    console.log(`Family:    ${this.family}`)
    console.log(`MAC:       ${this.mac}`)
    console.log(`Netmask:   ${this.netmask}`)
    console.log(`Base IP:   ${this.base()}`)
    console.log(`Broadcast: ${this.broadcast()}`)
    console.log(`First IP:  ${this.first()}`)
    console.log(`Last IP:   ${this.last()}`)
    console.log(`Total IPs: ${this.size()}`)
  }
}
