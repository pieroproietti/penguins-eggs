'use strict'
import fs from 'fs'
import inquirer = require('inquirer')
import Utils from '../classes/utils'

export default async function getNetwork(initial: string): Promise<string> {

    const ifaces: string[] = fs.readdirSync('/sys/class/net/')

    return new Promise(function (resolve) {
        const questions: Array<Record<string, any>> = [
            {
                type: 'list',
                name: 'interface',
                message: 'Select the network interface: ',
                choices: ifaces
            },
            {
                type: 'list',
                name: 'addressType',
                message: 'Select the network type: ',
                choices: ['dhcp', 'static'],
                default: 'dhcp'
            },
            {
                type: 'input',
                name: 'address',
                message: 'Insert IP address: ',
                default: Utils.netAddress(),
                when: function (answers: any) {
                    return answers.addressType === 'static'
                }
            },
            {
                type: 'input',
                name: 'netMask',
                message: 'Insert netmask: ',
                default: Utils.netMasK(),
                when: function (answers: any) {
                    return answers.addressType === 'static'
                }
            },
            {
                type: 'input',
                name: 'gateway',
                message: 'Insert gateway: ',
                default: Utils.netGateway(),
                when: function (answers: any) {
                    return answers.addressType === 'static'
                }
            },
            {
                type: 'input',
                name: 'dns',
                message: 'Insert DNS: ',
                default: Utils.netDns(),
                when: function (answers: any) {
                    return answers.addressType === 'static'
                }
            }
        ]
        inquirer.prompt(questions).then(function (options) {
            resolve(JSON.stringify(options))
        })
    })
}
