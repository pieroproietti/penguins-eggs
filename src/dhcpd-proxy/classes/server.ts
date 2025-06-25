/**
 * server.ts
 *
 * Implementa un server DHCP completo.
 *
 * author: Piero Proietti <piero.proietti@gmail.com>
 * refactored for modern TypeScript
 */

import { Packet } from "./packet.js";
import { DhcpMessageType } from "../lib/packet/message-types.js";
import { Socket, RemoteInfo, createSocket } from "dgram";
import { EventEmitter } from "events";

// Interfaccia per le opzioni del costruttore
interface DHCPServerOptions {
    broadcast: string;
}

// Applichiamo lo stesso pattern di 'proxy.ts'
export default class DHCPServer extends EventEmitter {
    private socket: Socket;
    private broadcast: string;

    constructor(opts: DHCPServerOptions) {
        super();
        this.broadcast = opts.broadcast || '255.255.255.255';
        this.socket = createSocket("udp4");

        this.socket.on("error", (err) => {
            console.error("DHCPServer Socket Error:", err);
            this.emit('error', err);
        });

        this.socket.on("message", (buffer: Buffer, remote: RemoteInfo) => {
            try {
                const packet = Packet.fromBuffer(buffer);
                if (packet.op === 1) { // BOOTREQUEST
                    const messageType = packet.options[53] || 0;
                    const typeName = DhcpMessageType[messageType] || 'UNKNOWN';

                    console.log(
                        `Server: Got ${typeName} from ${remote.address}:${remote.port} (${packet.chaddr})`
                    );

                    const eventName = typeName.replace("DHCP", "").toLowerCase();
                    (packet as any).remote = remote;
                    this.emit(eventName, packet, packet.options[50] || null);
                }
            } catch (err) {
                console.error("Error parsing DHCP packet:", err);
            }
        });
    }

    /**
     * Avvia il server in ascolto.
     */
    public listen(port: number = 67, address: string = '0.0.0.0', cb?: () => void): void {
        this.socket.bind(port, address, () => {
            this.socket.setBroadcast(true);
            console.log(`DHCPServer listening on ${address}:${port}`);
            if (cb) {
                cb();
            }
        });
    }

    /**
     * Invia una risposta DHCP.
     * Metodo privato usato internamente.
     */
    private _send(packet: Packet, ip: string): void {
        const buffer = packet.toBuffer();
        const typeName = DhcpMessageType[packet.options[53]] || 'UNKNOWN';
        const targetPort = 68; // I client DHCP ascoltano sulla porta 68

        console.log(
            `Server: Sending ${typeName} to ${ip}:${targetPort} (${packet.chaddr})`
        );

        this.socket.send(buffer, 0, buffer.length, targetPort, ip, (err, bytes) => {
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
        if (params) {
            packet.yiaddr = params.yiaddr;
            packet.siaddr = params.siaddr;
            packet.options = { ...packet.options, ...params.options };
        }
        packet.op = 2; // BOOTREPLY
        packet.options[53] = DhcpMessageType.DHCPOFFER
        this._send(packet, this.broadcast);
    }

    public ack(packet: Packet, params?: any): void {
        if (params) {
            packet.yiaddr = params.yiaddr;
            packet.siaddr = params.siaddr;
            packet.options = { ...packet.options, ...params.options };
        }
        packet.op = 2; // BOOTREPLY
        packet.options[53] = DhcpMessageType.DHCPACK
        this._send(packet, this.broadcast);
    }

    public nak(packet: Packet, params?: any): void {
        packet.op = 2; // BOOTREPLY
        packet.options[53] = DhcpMessageType.DHCPNAK;
        const targetIp = (packet as any).remote?.address || this.broadcast;
        this._send(packet, targetIp);
    }

    // Aggiungi qui gli altri metodi come `inform` se necessario...
}