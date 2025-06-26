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
    // Manteniamo in memoria l'offerta originale per rispondere alla richiesta successiva
    private clientOffers: Map<string, Packet> = new Map();

    constructor(opts: IDhcpOptions) {
        super();
        this.options = opts;
        if (!this.options.broadcast) this.options.broadcast = '255.255.255.255';
        this.socket = createSocket({ type: "udp4", reuseAddr: true });
        this.setupListeners();
    }
    
    private setupListeners(): void {
        this.socket.on("error", (err) => console.error(ansis.red.bold("DHCP Proxy Error:"), err.stack));

        this.socket.on("message", (buffer: Buffer, remote: RemoteInfo) => {
            try {
                const packet = Packet.fromBuffer(buffer);
                (packet as any).remote = remote;

                const messageType = packet.options[53] || 0;

                if (packet.op === 1 && messageType === DhcpMessageType.DHCPDISCOVER) {
                    this._handleDiscover(packet);
                } else if (packet.op === 2 && messageType === DhcpMessageType.DHCPOFFER) {
                    this._handleOffer(packet);
                } else if (packet.op === 1 && messageType === DhcpMessageType.DHCPREQUEST) {
                    this._handleRequest(packet);
                }

            } catch (err) {
                console.error(ansis.red.bold(`Error parsing packet:`), err);
            }
        });
    }

    // Quando vediamo un DISCOVER, ci limitiamo a registrarlo.
    private _handleDiscover(packet: Packet): void {
        console.log(ansis.blue.bold(`\n-> DISCOVER Ricevuto`));
        console.log(ansis.dim(`   └─ Da MAC: ${ansis.white(packet.chaddr)}`));
    }
    
    // Quando vediamo un OFFER (dal router), creiamo la nostra offerta.
    private _handleOffer(packet: Packet): void {
        // Ignoriamo le offerte che non sono per client PXE (identificati dall'opzione 60)
        if (!packet.options[60]?.includes('PXEClient')) {
            return;
        }

        console.log(ansis.magenta.bold(`-> OFFER del Router Intercettato`));
        console.log(ansis.dim(`   └─ IP Offerto: ${ansis.green(packet.yiaddr)} per ${ansis.white(packet.chaddr)}`));
        
        // Salviamo l'offerta del router per usarla dopo nella fase di ACK
        this.clientOffers.set(packet.chaddr, new Packet(packet));

        // CREIAMO UN PACCHETTO OFFERTA NUOVO, non modifichiamo quello del router
        const pxeOffer = new Packet(packet);

        // CI SPACCIAMO PER IL SERVER
        pxeOffer.siaddr = this.options.tftpserver;
        pxeOffer.options[54] = this.options.host; // IMPORTANTISSIMO: Il Server ID è il nostro IP
        
        const arch = packet.options[93] || packet.options[60];
        if (arch && (String(arch).includes('00007') || String(arch).includes('00009'))) {
            pxeOffer.fname = this.options.efi64_filename;
        } else if (arch && String(arch).includes('00006')) {
            pxeOffer.fname = this.options.efi32_filename;
        } else {
            pxeOffer.fname = this.options.bios_filename;
        }
        
        console.log(ansis.cyan.bold(`<- Invio la NOSTRA Offerta PXE...`));
        console.log(ansis.dim(`   ├─ Next-Server: ${ansis.white(pxeOffer.siaddr)}`));
        console.log(ansis.dim(`   └─ Filename: ${ansis.white(pxeOffer.fname)}`));

        this._send(pxeOffer, this.options.broadcast, 68);
    }

    // NUOVO: Gestiamo la richiesta finale del client che ora è indirizzata a noi
    private _handleRequest(packet: Packet): void {
        // Rispondiamo solo se il client sta chiedendo specificamente a noi
        if (packet.options[54] !== this.options.host) {
            return;
        }

        console.log(ansis.yellow.bold(`-> REQUEST per NOI ricevuto`));
        console.log(ansis.dim(`   └─ Da MAC: ${ansis.white(packet.chaddr)}`));

        const originalOffer = this.clientOffers.get(packet.chaddr);
        if (!originalOffer) {
            console.log(ansis.red.bold(`   ! Errore: non trovo un'offerta precedente per questo client.`));
            return;
        }
        
        const ackPacket = new Packet(packet);
        ackPacket.op = 2; // BOOTREPLY
        ackPacket.yiaddr = originalOffer.yiaddr; // Usiamo l'IP dell'offerta originale del router
        ackPacket.siaddr = this.options.tftpserver;
        
        // Uniamo le opzioni: quelle del router, quelle richieste dal client, e le nostre
        ackPacket.options = { ...originalOffer.options, ...ackPacket.options };
        ackPacket.options[53] = DhcpMessageType.DHCPACK;
        ackPacket.options[54] = this.options.host; // Confermiamo che siamo noi il server

        const arch = ackPacket.options[93] || ackPacket.options[60];
        if (arch && (String(arch).includes('00007') || String(arch).includes('00009'))) {
            ackPacket.fname = this.options.efi64_filename;
        } else if (arch && String(arch).includes('00006')) {
            ackPacket.fname = this.options.efi32_filename;
        } else {
            ackPacket.fname = this.options.bios_filename;
        }
        
        console.log(ansis.cyan.bold(`<- Invio ACK finale con dati PXE...`));
        this._send(ackPacket, this.options.broadcast, 68);
    }
    
    public listen(): void {
        // Ascoltiamo solo sulla porta 67, ma ora siamo molto più intelligenti
        this.socket.bind(67, '0.0.0.0', () => {
            this.socket.setBroadcast(true);
            console.log(ansis.green.inverse(`\n DHCP Proxy "Man-in-the-Middle" in ascolto su porta 67 \n`));
        });
    }
    
    private _send(packet: Packet, ip: string, port: number): void {
        const buffer = packet.toBuffer();
        const typeName = DhcpMessageType[packet.options[53]] || 'UNKNOWN';
        this.socket.send(buffer, 0, buffer.length, port, ip, (err, bytes) => {
            if (err) {
                console.error(ansis.red.bold(`[PROXY-ERROR] Errore invio ${typeName}:`), err);
            } else {
                 console.log(ansis.green(`   ✔︎ ${typeName} inviata a ${ip}:${port} (${bytes} bytes)`));
            }
        });
    }
}
