export interface INet {
    name: string;
    dhcp: boolean;
    address: string;
    netmask: string;
    gateway: string;
    domainName: string;
    dnsAddress: string;
}
