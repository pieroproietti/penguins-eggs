// All'interno di penguins-eggs/src/dhcpd-proxy/classes/proxy.ts

import { Packet } from './packet.js';
import { DhcpMessageType } from '../lib/packet/message-types.js';
import { Socket, RemoteInfo, createSocket } from "dgram";
import { EventEmitter } from "events";
import type { IDhcpOptions } from '../interfaces/i-pxe.js';
import ansis from 'ansis';

export default class DHCPDProxy extends EventEmitter {
    // Abbiamo ancora due socket, ma la logica di ascolto sarà perfezionata.
    private serverSocket: Socket;
    private proxySocket: Socket;
    private options: IDhcpOptions; 

    constructor(opts: IDhcpOptions) {
        super();
        this.options = opts;
        
        // ===================================================================
        // Iniziamo con la logica che SAPPIAMO FUNZIONARE, dal test-udp.ts
        // ===================================================================
        this.serverSocket = createSocket({ type: "udp4", reuseAddr: true });

        this.serverSocket.on("error", (err) => {
            console.error(ansis.red.bold("DHCP Server (67) Socket Error:"), err.stack);
            this.serverSocket.close();
        });

        // Questo è il cuore pulsante.
        this.serverSocket.on("message", (buffer: Buffer, remote: RemoteInfo) => {
            console.log(ansis.bgGreen.black.bold('\n PACCHETTO INTERCETTATO SULLA RETE! \n'));
            try {
                const packet = Packet.fromBuffer(buffer);
                // Da qui in poi, usiamo la nostra logica di gestione esistente
                if (packet.op !== 1) return;

                const messageType = packet.options[53] || 0;
                (packet as any).remote = remote;
                this._handlePacket(messageType, packet);

            } catch (err) {
                console.error(ansis.red.bold("Error parsing DHCP packet on port 67:"), err);
            }
        });

        // Configurazione della seconda socket per la porta 4011 (logica invariata)
        this.proxySocket = createSocket({ type: "udp4", reuseAddr: true });
        this.proxySocket.on("error", (err) => console.error(ansis.red.bold("DHCP Proxy (4011) Error:"), err));
        this.proxySocket.on("message", (buffer: Buffer, remote: RemoteInfo) => {
             try {
                const packet = Packet.fromBuffer(buffer);
                if (packet.op !== 1) return;
                const messageType = packet.options[53];
                if (messageType === DhcpMessageType.DHCPREQUEST) {
                    this._handleProxyRequest(packet, remote);
                }
            } catch (err) {
                console.error(ansis.red.bold("Error parsing DHCP packet on port 4011:"), err);
            }
        });
    }

    public listen(): void {
        this.serverSocket.bind(67, '0.0.0.0', () => {
            const address = this.serverSocket.address();
            console.log(ansis.green.inverse(`\n DHCP Server (67) in ascolto su ${address.address}:${address.port} \n`));
            try {
                this.serverSocket.setBroadcast(true);
            } catch (err) {
                console.error('Impossibile attivare broadcast su porta 67:', err);
            }
        });
        
        this.proxySocket.bind(4011, '0.0.0.0', () => {
            const address = this.proxySocket.address();
            console.log(ansis.green.inverse(`\n DHCP Proxy (4011) in ascolto su ${address.address}:${address.port} \n`));
             try {
                this.proxySocket.setBroadcast(true);
            } catch (err) {
                console.error('Impossibile attivare broadcast su porta 4011:', err);
            }
        });
    }

    // --- Tutta la logica di gestione dei pacchetti (_handlePacket, _handleDiscover, etc.)
    // --- rimane esattamente come l'avevamo scritta. È corretta.
    private _handlePacket(messageType: DhcpMessageType, packet: Packet) { /* ... */ }
    private _handleDiscover(packet: Packet, remote: RemoteInfo) { /* ... */ }
    private _handleProxyRequest(packet: Packet, remote: RemoteInfo) { /* ... */ }
    private _send(socket: Socket, packet: Packet, ip: string, port: number) { /* ... */ }
}
