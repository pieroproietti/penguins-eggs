/**
 * ./src/krill/prepare.d/welcome.tsx
 * penguins-eggs v.25.7.x / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 * https://stackoverflow.com/questions/23876782/how-do-i-split-a-typescript-class-into-multiple-files
 */

import React from 'react'
import {confirm} from './confirm.js'

import Network from '../../components/network.js'
import { INet } from '../../../interfaces/index.js'
import Prepare from '../prepare.js'
import Utils from '../../../classes/utils.js'

import selectInterface from '../../lib/select_interface.js'
import selectAddressType from '../../lib/select_address_type.js'
import getAddress from '../../lib/get_address.js'
import getNetmask from '../../lib/get_netmask.js'
import getGateway from '../../lib/get_gateway.js'
import getDomain from '../../lib/get_domain.js'
import getDns from '../../lib/get_dns.js'


import fs from 'fs'



/**
   * Network
   */
export async function network(this: Prepare): Promise<INet> {
    const i = {} as INet

    const ifaces: string[] = fs.readdirSync('/sys/class/net/')
    i.iface = await Utils.iface()
    i.addressType = 'dhcp'
    i.address = Utils.address()
    i.netmask = Utils.netmask()
    i.gateway = Utils.gateway()
    i.dns = Utils.getDns()
    i.domain = Utils.getDomain()
    let dnsString = ''
    for (let c = 0; c < i.dns.length; c++) {
        dnsString += i.dns[c].trim()
        if (c < i.dns.length - 1) {
            dnsString += '; '
        }
    }

    let networkElem: JSX.Element
    while (true) {
        networkElem = <Network iface={i.iface} addressType={i.addressType} address={i.address} netmask={i.netmask} gateway={i.gateway} domain={i.domain} dns={dnsString} />
        if (await confirm(networkElem, "Confirm Network datas?")) {
            break
        }

        i.iface = await selectInterface(i.iface, ifaces)
        i.addressType = await selectAddressType()
        if (i.addressType === 'static') {
            i.address = await getAddress(i.address)
            i.netmask = await getNetmask(i.netmask)
            i.gateway = await getGateway(i.gateway)
            i.domain = await getDomain(i.domain)
            if (i.domain.at(0) !== '.') {
                i.domain = '.' + i.domain
            }
            i.dns = (await getDns(dnsString)).split(';')
            dnsString = ''
            for (let c = 0; c < i.dns.length; c++) {
                dnsString += i.dns[c].trim()
                if (c < i.dns.length - 1) {
                    dnsString += '; '
                }
            }
        }
    }
    return i
}
