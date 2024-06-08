import { IPacket, IDhcpOptions } from '../src/interfaces/i-pxe.ts'
declare module 'node-proxy-dhcpd' {
    export class dhcpd {
        constructor(opts: IDhcpOptions);
        pre_init: (pkt: IPacket) => void;
        discover: (pkt: IPacket) => void;
        request: (pkt: IPacket) => void;
        inform: (pkt: IPacket) => void;
        proxy_request: (pkt: IPacket) => IPacket;
    }
}
