// All'interno di penguins-eggs/src/dhcpd-proxy/classes/proxy.ts

import { Packet } from './packet.js';
import { DhcpMessageType } from '../lib/packet/message-types.js';
import { Socket, RemoteInfo, createSocket } from "dgram";
import { EventEmitter } from "events";
import type { IDhcpOptions } from '../interfaces/i-pxe.js'; // Importiamo le opzioni

export default class DHCPDProxy extends EventEmitter {
    private socket: Socket;
    // Salviamo le opzioni ricevute
    private options: IDhcpOptions; 

    constructor(opts: IDhcpOptions) { // Il costruttore ora accetta le opzioni PXE
        super();
        this.options = opts; // E le salva
        this.socket = createSocket("udp4");

        this.socket.on("error", (err) => {
            console.error("DHCPProxy Socket Error:", err);
            this.emit('error', err);
        });

        this.socket.on("message", (buffer: Buffer, remote: RemoteInfo) => {
            try {
                const packet = Packet.fromBuffer(buffer);
                if (packet.op !== 1) return; // Ignora tutto ciò che non è una richiesta dal client

                const messageType = packet.options[53] || 0;
                const typeName = DhcpMessageType[messageType] || 'UNKNOWN';
                const eventName = typeName.replace("DHCP", "").toLowerCase();
                
                (packet as any).remote = remote;

                // Emettiamo l'evento per chi fosse interessato al logging esterno...
                this.emit(eventName, packet);

                // ...MA ora gestiamo anche la logica internamente!
                this._handlePacket(messageType, packet);

            } catch (err) {
                console.error("Error parsing DHCP packet:", err);
            }
        });
    }

    /**
     * Dispatcher interno per gestire i diversi tipi di pacchetti DHCP
     */
    private _handlePacket(messageType: DhcpMessageType, packet: Packet) {
        switch (messageType) {
            case DhcpMessageType.DHCPDISCOVER:
                this._handleDiscover(packet);
                break;
            case DhcpMessageType.DHCPOFFER:
                this._handleOffer(packet);
                break;
            case DhcpMessageType.DHCPREQUEST:
                this._handleRequest(packet);
                break;
        }
    }

    private _handleDiscover(packet: Packet) {
        console.log(`[PROXY-LOG] -> Rilevato DISCOVER da ${packet.chaddr}`);
        // Non facciamo nulla, aspettiamo l'offerta del DHCP principale
    }
    
    private _handleOffer(packet: Packet) {
        console.log(`[PROXY-LOG] -> Rilevato OFFER per ${packet.chaddr}`);
        console.log(`[PROXY-LOG] <- Modifico e invio ACK con dati PXE...`);
        
        packet.siaddr = this.options.tftpserver; // Usa le opzioni salvate
        // TODO: Aggiungere logica per scegliere tra BIOS e UEFI
        packet.fname = this.options.bios_filename;
        
        this.ack(packet); // Il metodo ack() che avevamo già scritto si occupa dell'invio
    }

    private _handleRequest(packet: Packet) {
        console.log(`[PROXY-LOG] -> Rilevato REQUEST da ${packet.chaddr}`);
        console.log(`[PROXY-LOG] <- Invio ACK di conferma con dati PXE...`);
        
        packet.siaddr = this.options.tftpserver;
        // TODO: Aggiungere logica per scegliere tra BIOS e UEFI
        packet.fname = this.options.bios_filename;
        
        this.ack(packet);
    }

    public listen(port: number = 67, address: string = '0.0.0.0', cb?: () => void): void {
        this.socket.bind(port, address, () => {
            this.socket.setBroadcast(true);
            console.log(`DHCPProxy listening on ${address}:${port}`);
            if (cb) cb();
        });
    }

    private ack(packet: Packet): void {
        packet.op = 2; // BOOTREPLY
        packet.options[53] = DhcpMessageType.DHCPACK;
        const remote = (packet as any).remote;
        const targetIp = packet.ciaddr && packet.ciaddr !== '0.0.0.0' ? packet.ciaddr : this.options.broadcast;
        this._send(packet, targetIp, remote.port);
    }
    
    private _send(packet: Packet, ip: string, port: number): void {
        const buffer = packet.toBuffer();
        const typeName = DhcpMessageType[packet.options[53]] || 'UNKNOWN';
        console.log(`[PROXY-LOG] <- Invio ${typeName} a ${ip}:${port} (${packet.chaddr})`);
        this.socket.send(buffer, 0, buffer.length, port, ip, (err, bytes) => {
            if (err) {
                console.error(`[PROXY-ERROR] Errore invio:`, err);
            }
        });
    }
}
