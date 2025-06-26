/**
 * man-in-the-middle
 * 
 * All'interno di penguins-eggs/src/dhcpd-proxy/classes/proxy.ts
 * due socket
 * attivo a due socket
 * 
 */

import { Packet } from '../dhcpd-proxy/classes/packet.js';
import { DhcpMessageType } from '../dhcpd-proxy/lib/packet/message-types.js';
import { Socket, RemoteInfo, createSocket } from "dgram";
import { EventEmitter } from "events";
import type { IDhcpOptions } from '../interfaces/i-pxe.js';
import ansis from 'ansis';


export default class DHCPDProxy extends EventEmitter {
    // Due socket, come nell'implementazione originale funzionante
    private serverSocket: Socket; // Ascolta su porta 67 per i DISCOVER
    private proxySocket: Socket;  // Ascolta su porta 4011 per i REQUEST
    private options: IDhcpOptions; 

    constructor(opts: IDhcpOptions) {
        super();
        this.options = opts;
        
        if (!this.options.broadcast) {
            this.options.broadcast = '255.255.255.255';
        }
        
        this.serverSocket = createSocket({ type: "udp4", reuseAddr: true });
        this.proxySocket = createSocket({ type: "udp4", reuseAddr: true });

        this.setupListeners();
    }
    
    private setupListeners(): void {
        this.serverSocket.on("error", (err) => console.error(ansis.red.bold("DHCP Server (67) Error:"), err.stack));
        this.proxySocket.on("error", (err) => console.error(ansis.red.bold("DHCP Proxy (4011) Error:"), err.stack));

        this.serverSocket.on("message", (buffer: Buffer, remote: RemoteInfo) => {
            this.handleMessage(buffer, remote, 67);
        });

        this.proxySocket.on("message", (buffer: Buffer, remote: RemoteInfo) => {
            this.handleMessage(buffer, remote, 4011);
        });
    }

    private handleMessage(buffer: Buffer, remote: RemoteInfo, port: number): void {
        try {
            const packet = Packet.fromBuffer(buffer);
            if (packet.op !== 1) return;

            const messageType = packet.options[53] || 0;
            (packet as any).remote = remote;

            if (port === 67 && messageType === DhcpMessageType.DHCPDISCOVER) {
                this._handleDiscover(packet);
            } else if (port === 4011 && messageType === DhcpMessageType.DHCPREQUEST) {
                this._handleProxyRequest(packet);
            }

        } catch (err) {
            // Ignoriamo errori di parsing
        }
    }

    private _handleDiscover(packet: Packet): void {
        console.log(ansis.blue.bold(`\n-> DISCOVER (su porta 67) Ricevuto`));
        console.log(ansis.dim(`   └─ Da MAC: ${ansis.white(packet.chaddr)}`));

        if (packet.options[60]?.includes('PXEClient')) {
            console.log(ansis.cyan.bold(`<- Rilevato PXEClient! Invio OFFER per prendere il controllo...`));
            
            const offerPacket = new Packet(packet);
            offerPacket.op = 2; // BOOTREPLY
            offerPacket.siaddr = this.options.host;
            offerPacket.options[53] = DhcpMessageType.DHCPOFFER;
            offerPacket.options[54] = this.options.host;
            
            // Non offriamo un IP, lasciamo che lo faccia il router principale
            offerPacket.yiaddr = '0.0.0.0'; 

            this._send(this.serverSocket, offerPacket, this.options.broadcast, 68);
        }
    }

    private _handleProxyRequest(packet: Packet): void {
        console.log(ansis.yellow.bold(`\n-> REQUEST (su porta 4011) Ricevuto`));
        console.log(ansis.dim(`   └─ Da MAC: ${ansis.white(packet.chaddr)}`));
        console.log(ansis.cyan.bold(`<- Invio ACK finale con i dati di boot...`));
        
        const ackPacket = new Packet(packet);
        ackPacket.op = 2;
        ackPacket.siaddr = this.options.tftpserver;
        
        const arch = ackPacket.options[93] || packet.options[60];
        if (arch && (String(arch).includes('00007') || String(arch).includes('00009'))) {
            ackPacket.fname = this.options.efi64_filename;
        } else if (arch && String(arch).includes('00006')) {
            ackPacket.fname = this.options.efi32_filename;
        } else {
            ackPacket.fname = this.options.bios_filename;
        }
        
        console.log(ansis.dim(`   ├─ Architettura rilevata: ${ansis.white(ackPacket.fname.includes('efi') ? 'UEFI' : 'BIOS')}`));
        console.log(ansis.dim(`   └─ File di boot: ${ansis.white(ackPacket.fname)}`));

        ackPacket.options[53] = DhcpMessageType.DHCPACK;
        ackPacket.options[54] = this.options.host;
        
        // In questo ACK finale, il client ha già un IP, non dobbiamo specificarlo
        this._send(this.proxySocket, ackPacket, this.options.broadcast, 68);
    }
    
    public listen(): void {
        this.serverSocket.bind(67, '0.0.0.0', () => {
            this.serverSocket.setBroadcast(true);
            console.log(ansis.green.inverse(`\n DHCP Server (67) in ascolto \n`));
        });
        
        this.proxySocket.bind(4011, '0.0.0.0', () => {
            this.proxySocket.setBroadcast(true);
            console.log(ansis.green.inverse(`\n DHCP Proxy (4011) in ascolto \n`));
        });
    }
    
    private _send(socket: Socket, packet: Packet, ip: string, port: number): void {
        const buffer = packet.toBuffer();
        const typeName = DhcpMessageType[packet.options[53]] || 'UNKNOWN';
        socket.send(buffer, 0, buffer.length, port, ip, (err, bytes) => {
            if (err) {
                console.error(ansis.red.bold(`[PROXY-ERROR] Errore invio ${typeName}:`), err);
            } else {
                 console.log(ansis.green(`   ✔︎ ${typeName} inviata a ${ip}:${port} (${bytes} bytes)`));
            }
        });
    }
}
