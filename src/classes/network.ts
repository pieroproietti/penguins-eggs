/**
 * ./src/classes/network.ts
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import { Netmask } from 'netmask'
import os from 'node:os'

/**
 *
 */
export default class Network {
  address = ''
  cidr = ''
  family = ''
  internal = false
  mac = ''
  netmask = ''
  o = {} as Netmask

  /**
   *
   */
  constructor() {
    const interfaces = os.networkInterfaces()
    const address = ''
    if (interfaces !== undefined) {
      for (const devName in interfaces) {
        const iface = interfaces[devName]
        if (iface !== undefined) {
          for (const alias of iface) {
            if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
              // take just the first!
              if (this.address === '') {
                this.address = alias.address
              }

              if (this.cidr === '' && alias.cidr !== null) {
                this.cidr = alias.cidr
              }

              if (this.family === '') {
                this.family = alias.family
              }

              if (this.mac === '') {
                this.mac = alias.mac
              }

              if (this.netmask === '') {
                this.netmask = alias.netmask
              }
            }
          }
        }
      }

      /**
       * valori da netmask
       */
      this.o = new Netmask(this.cidr)
    }
  }

  base() {
    return this.o.base
  }

  bitmask() {
    this.o.bitmask
  }

  broadcast() {
    return this.o.broadcast
  }

  contains() {
    return this.o.contains
  }

  first() {
    return this.o.first
  }

  forEach() {
    return this.o.forEach
  }

  hostmask() {
    return this.o.hostmask
  }

  last() {
    return this.o.last
  }

  maskLong() {
    return this.o.maskLong
  }

  netLong() {
    return this.o.netLong
  }

  next() {
    return this.o.next
  }

  size() {
    return this.o.size
  }

  toString() {
    return this.o.toString
  }
}
