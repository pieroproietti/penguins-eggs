// All'interno di penguins-eggs/src/dhcpd-proxy/classes/proxy.ts

import { Packet } from './packet.js';
import { DhcpMessageType } from '../lib/packet/message-types.js';
import { Socket, RemoteInfo, createSocket } from "dgram";
import { EventEmitter } from "events";
import type { IDhcpOptions } from '../interfaces/i-pxe.js';
import ansis from 'ansis';

export default class DHCPDProxy extends EventEmitter {
    private socket: Socket;
    private options: IDhcpOptions; 

    constructor(opts: IDhcpOptions) {
        super();
        this.options = opts;
        
        // MODIFICA CHIAVE: Creiamo una socket "riutilizzabile"
        this.socket = createSocket({ type: "udp4", reuseAddr: true });

        this.socket.on("error", (err) => {
            console.error(ansis.red.bold("DHCPProxy Socket Error:"), err);
            this.emit('error', err);
        });

        this.socket.on("message", (buffer: Buffer, remote: RemoteInfo) => {
            // ... la logica di gestione dei messaggi rimane invariata ...
            try {
                const packet = Packet.fromBuffer(buffer);
                if (packet.op !== 1) return;

                const messageType = packet.options[53] || 0;
                (packet as any).remote = remote;
                this._handlePacket(messageType, packet);

            } catch (err) {
                console.error(ansis.red.bold("Error parsing DHCP packet:"), err);
            }
        });
    }

    // ... la logica _handlePacket, _handleDiscover, etc. rimane invariata ...
    private _handlePacket(messageType: DhcpMessageType, packet: Packet) {
        switch (messageType) {
            case DhcpMessageType.DHCPDISCOVER: this._handleDiscover(packet); break;
            case DhcpMessageType.DHCPOFFER: this._handleOffer(packet); break;
            case DhcpMessageType.DHCPREQUEST: this._handleRequest(packet); break;
        }
    }

    private _handleDiscover(packet: Packet) {
        console.log(ansis.blue.bold(`\n-> DISCOVER Ricevuto`));
        console.log(ansis.dim(`   ├─ MAC: ${ansis.white(packet.chaddr)}`));
        console.log(ansis.dim(`   ├─ Da: ${ansis.white((packet as any).remote.address)}`));
        const vendor = packet.options[60] ? ansis.white(packet.options[60]) : ansis.gray('non specificato');
        console.log(ansis.dim(`   └─ Vendor Class: ${vendor}`));
    }
    
    private _handleOffer(packet: Packet) {
        console.log(ansis.magenta.bold(`-> OFFER Ricevuto`));
        console.log(ansis.dim(`   ├─ Per MAC: ${ansis.white(packet.chaddr)}`));
        console.log(ansis.dim(`   ├─ IP Offerto: ${ansis.green(packet.yiaddr)}`));
        console.log(ansis.dim(`   └─ Dal Server DHCP: ${ansis.white((packet as any).remote.address)}`));
        
        console.log(ansis.cyan.bold(`<- Invio ACK Modificato`));
        packet.siaddr = this.options.tftpserver;
        
        const arch = packet.options[93]; 
        if (arch === 7 || arch === 9) {
            packet.fname = this.options.efi64_filename;
            console.log(ansis.dim(`   ├─ Rilevata architettura UEFI 64-bit. File: ${ansis.white(packet.fname)}`));
        } else if (arch === 6) {
             packet.fname = this.options.efi32_filename;
            console.log(ansis.dim(`   ├─ Rilevata architettura UEFI 32-bit. File: ${ansis.white(packet.fname)}`));
        } else {
            packet.fname = this.options.bios_filename;
            console.log(ansis.dim(`   ├─ Architettura BIOS o non specificata. File: ${ansis.white(packet.fname)}`));
        }
        console.log(ansis.dim(`   └─ Next-Server (TFTP): ${ansis.white(packet.siaddr)}`));
        
        this.ack(packet);
    }

    private _handleRequest(packet: Packet) {
        console.log(ansis.yellow.bold(`-> REQUEST Ricevuto`));
        console.log(ansis.dim(`   ├─ Da MAC: ${ansis.white(packet.chaddr)}`));
        const requestedIp = packet.options[50] || packet.ciaddr;
        console.log(ansis.dim(`   └─ IP Richiesto: ${ansis.green(requestedIp)}`));
        this._handleOffer(packet);
    }
    
    // MODIFICA CHIAVE: Il metodo listen ora fa il bind a 0.0.0.0
    public listen(port: number = 67, cb?: () => void): void {
        const listenAddress = '0.0.0.0';
        this.socket.bind(port, listenAddress, () => {
            this.socket.setBroadcast(true);
            console.log(ansis.green.inverse(`\n DHCPProxy in ascolto su ${listenAddress}:${port} \n`));
            if (cb) cb();
        });
    }

    // ... la logica ack e _send rimane invariata ...
    private ack(packet: Packet): void {
        packet.op = 2;
        packet.options[53] = DhcpMessageType.DHCPACK;
        const remote = (packet as any).remote;
        const targetIp = packet.ciaddr && packet.ciaddr !== '0.0.0.0' ? packet.ciaddr : this.options.broadcast;
        this._send(packet, targetIp, remote.port);
    }
    
    private _send(packet: Packet, ip: string, port: number): void {
        const buffer = packet.toBuffer();
        const typeName = DhcpMessageType[packet.options[53]] || 'UNKNOWN';
        this.socket.send(buffer, 0, buffer.length, port, ip, (err, bytes) => {
            if (err) {
                console.error(ansis.red.bold(`[PROXY-ERROR] Errore invio:`), err);
            } else {
                 console.log(ansis.green(`   ✔︎ ${typeName} inviato a ${ip} (${bytes} bytes)`));
            }
        });
    }
}
