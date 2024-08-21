/*
Present code gives an error:

error TS2665: Invalid module name in augmentation. Module 'node-proxy-dhcpd' resolves to an untyped module at '/home/artisan/penguins-eggs/node_modules/.pnpm/node-proxy-dhcpd@0.0.5/node_modules/node-proxy-dhcpd/dist/index.js', which cannot be augmented.

2 declare module 'node-proxy-dhcpd' {
                 ~~~~~~~~~~~~~~~~~~


Found 1 error in src/declarations.d.ts:2

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
*/

declare module 'node-proxy-dhcpd'
