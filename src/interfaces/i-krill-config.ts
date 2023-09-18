/**
 * penguins-eggs
 * interface: i-krill-config.ts
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

export interface IKrillConfig {
    language: string
    region: string
    zone: string
    keyboardModel: string
    keyboardLayout: string
    keyboardVariant: string
    keyboardOption: string
    installationDevice: string
    installationMode: string
    filesystemType: string
    userSwapChoice: string
    name: string
    fullname: string
    password: string
    rootPassword: string
    autologin: boolean
    hostname: string
    iface: string
    addressType: string
    address: string
    netmask: string
    gateway: string
    domain: string
    dns: string
}
