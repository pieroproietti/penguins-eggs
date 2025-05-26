/**
 * ./src/classes/utils.d/network.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * Network configuration utilities - IP, DNS, gateway detection
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

import dns from 'dns'
import os from 'os'
import shx from 'shelljs'
import { Netmask } from 'netmask'

export default class Network {
   /**
    * return the name of network device
    */
   static async iface(): Promise<string> {
      // return shx.exec(`ifconfig | awk 'FNR==1 { print $1 }' | tr --d :`, { silent: true }).stdout.trim()
      const interfaces: any = Object.keys(os.networkInterfaces())
      let netDeviceName = ''
      for (const k in interfaces) {
         if (interfaces[k] != 'lo') {
            netDeviceName = interfaces[k]
         }
      }
      return netDeviceName
   }

   /**
    * address
    */
   static address(): string {
      const interfaces = os.networkInterfaces()
      let address = ''
      if (interfaces !== undefined) {
         for (const devName in interfaces) {
            const iface = interfaces[devName]
            if (iface !== undefined) {
               for (const alias of iface) {
                  if (
                     alias.family === 'IPv4' &&
                     alias.address !== '127.0.0.1' &&
                     !alias.internal
                  ) {
                     // take just the first!
                     if (address === '') {
                        address = alias.address
                     }
                  }
               }
            }
         }
      }
      return address
   }

   /**
    * netmask
    */
   static netmask(): string {
      const interfaces = os.networkInterfaces()
      let netmask = ''
      if (interfaces !== undefined) {
         for (const devName in interfaces) {
            const iface = interfaces[devName]
            if (iface !== undefined) {
               for (const alias of iface) {
                  if (
                     alias.family === 'IPv4' &&
                     alias.address !== '127.0.0.1' &&
                     !alias.internal
                  ) {
                     // take just the first!
                     if (netmask === '') {
                        netmask = alias.netmask
                     }
                  }
               }
            }
         }
      }
      return netmask
   }

   /**
    * cidr
    */
   static cidr(): string {
      const interfaces = os.networkInterfaces()
      let cidr = ''
      if (interfaces !== undefined) {
         for (const devName in interfaces) {
            const iface = interfaces[devName]
            if (iface !== undefined) {
               for (const alias of iface) {
                  if (
                     alias.family === 'IPv4' &&
                     alias.address !== '127.0.0.1' &&
                     !alias.internal
                  ) {
                     // take just the first!
                     if (cidr === '') {
                        if (alias.cidr !== null) {
                           cidr = alias.cidr
                        }
                     }
                  }
               }
            }
         }
      }
      return cidr
   }

   /**
    *
    * broadcast
   */
   static broadcast(): string {
      let n = new Netmask(Network.cidr())
      return n.broadcast
   }

   /**
    * dns
    */
   static getDns(): string[] {
      return dns.getServers()
   }

   /**
    * getDomain
    */
   static getDomain(): string {
      return shx.exec('domainname', { silent: true }).stdout.trim()
      // return shx.exec(`route -n | grep 'UG[ \t]' | awk '{print $2}'`, { silent: true }).stdout.trim()
   }

   /**
    * @returns gateway
    */
   static gateway(): string {
      return shx.exec(`ip r | grep 'default' | awk '{print $3}'`, { silent: true }).stdout.trim()
      //return shx.exec(`route -n | grep 'UG[ \t]' | awk '{print $2}'`, { silent: true }).stdout.trim()
   }
}