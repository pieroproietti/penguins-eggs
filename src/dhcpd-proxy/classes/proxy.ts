/**
 * proxy.ts
 *
 * implement DHCPProxy
 *
 * author: Piero Proietti <piero.proietti@gmail.com>
 * refactored for modern TypeScript
 */

import { Packet } from "./packet.js";
import { DhcpMessageType } from "../lib/packet/message-types.js";
import { Socket, RemoteInfo, createSocket } from "dgram";
import { EventEmitter } from "events";

// Definiamo un'interfaccia per le opzioni del costruttore
interface DHCPProxyOptions {
    broadcast: string;
}

// Rendiamo la nostra classe un EventEmitter per gestire gli eventi in modo pulito
// e la componiamo con un Socket, invece di estenderla. Questo è un pattern più robusto.
export default class DHCPProxy extends EventEmitter {
    private socket: Socket;
    private broadcast: string;

    constructor(opts: DHCPProxyOptions) {
        super();
        this.broadcast = opts.broadcast || '255.255.255.255';
        this.socket = createSocket("udp4");

        this.socket.on("error", (err) => {
            console.error("DHCPProxy Socket Error:", err);
            this.emit('error', err); // Rilanciamo l'errore
        });

        this.socket.on("message", (buffer: Buffer, remote: RemoteInfo) => {
            try {
                const packet = Packet.fromBuffer(buffer);
                if (packet.op === 1) { // BOOTREQUEST
                    const messageType = packet.options[53] || 0;
                    const typeName = DhcpMessageType[messageType] || 'UNKNOWN';

                    console.log(
                        `Proxy: Got ${typeName} from ${remote.address}:${remote.port} (${packet.chaddr})`
                    );

                    const eventName = typeName.replace("DHCP", "").toLowerCase();
                    // Aggiungiamo le info remote al pacchetto per poter rispondere
                    (packet as any).remote = remote; 
                    this.emit(eventName, packet);
                }
            } catch (err) {
                console.error("Error parsing DHCP packet:", err);
            }
        });
    }

    /**
     * Avvia il server proxy in ascolto.
     * Questo sostituisce la vecchia logica di bind.
     */
    public listen(port: number = 67, address: string = '0.0.0.0', cb?: () => void): void {
        this.socket.bind(port, address, () => {
            this.socket.setBroadcast(true);
            console.log(`DHCPProxy listening on ${address}:${port}`);
            if (cb) {
                cb();
            }
        });
    }

    /**
     * Invia una risposta DHCP.
     * Metodo privato usato internamente.
     */
    private _send(packet: Packet, ip: string, port: number): void {
        const buffer = packet.toBuffer();
        const typeName = DhcpMessageType[packet.options[53]] || 'UNKNOWN';

        console.log(
            `Proxy: Sending ${typeName} to ${ip}:${port} (${packet.chaddr})`
        );

        this.socket.send(buffer, 0, buffer.length, port, ip, (err, bytes) => {
            const eventName = typeName.replace("DHCP", "").toLowerCase();
            if (err) {
                this.emit(`${eventName}Error`, err, packet);
            } else {
                this.emit(`${eventName}Sent`, bytes, packet);
            }
        });
    }

    // --- Metodi pubblici per la gestione dei messaggi DHCP ---

    public offer(packet: Packet, params?: any): void {
        // La logica di risposta rimane la stessa
        if (params) {
            packet.yiaddr = params.yiaddr;
            packet.siaddr = params.siaddr;
            packet.options = { ...packet.options, ...params.options };
        }
        packet.op = 2; // BOOTREPLY
        packet.options[53] = DhcpMessageType.DHCPOFFER;
        
        const remote = (packet as any).remote;
        this._send(packet, this.broadcast, remote.port);
    }

    public ack(packet: Packet, params?: any): void {
        if (params) {
            packet.yiaddr = params.yiaddr;
            packet.siaddr = params.siaddr;
            packet.options = { ...packet.options, ...params.options };
        }
        packet.op = 2; // BOOTREPLY
        packet.options[53] = DhcpMessageType.DHCPACK;
        
        const remote = (packet as any).remote;
        // L'ACK viene inviato all'indirizzo del client se disponibile, altrimenti broadcast
        const targetIp = packet.ciaddr && packet.ciaddr !== '0.0.0.0' ? packet.ciaddr : this.broadcast;
        this._send(packet, targetIp, remote.port);
    }

    public nak(packet: Packet, params?: any): void {
        packet.op = 2; // BOOTREPLY
        packet.options[53] = DhcpMessageType.DHCPNAK;
        const remote = (packet as any).remote;
        this._send(packet, this.broadcast, remote.port);
    }

    // Aggiungi qui gli altri metodi come `inform` se necessario...
}