/**
 * simple-proxy.ts
 * Un proxy DHCP minimale che agisce come un mini-server DHCP completo
 * solo per i client PXE, per aggirare le protezioni di rete.
 * Basato sulla logica del test 'test-udp.ts' che ha funzionato.
 */

import { createSocket, Socket, RemoteInfo } from 'dgram';
import ansis from 'ansis';
import { Packet } from '../dhcpd-proxy/classes/packet.js';
import { DhcpMessageType } from '../dhcpd-proxy//lib/packet/message-types.js';
import type { IDhcpOptions } from '../dhcpd-proxy//interfaces/i-pxe.js';

// Un semplice Map in memoria per tracciare gli IP offerti
const offeredIPs = new Map<string, string>();

/**
 * La nostra unica funzione. Prende le opzioni e avvia il proxy.
 * @param options Le opzioni di configurazione PXE
 */
export function startSimpleProxy(options: IDhcpOptions): void {
  // 1. Creiamo la socket, esattamente come nel test funzionante
  const socket = createSocket({ type: 'udp4', reuseAddr: true });

  // 2. Impostiamo i listener
  socket.on('error', (err) => {
    console.error(ansis.red.bold(`ERRORE SOCKET: ${err.stack}`));
    socket.close();
  });

  socket.on('listening', () => {
    const address = socket.address();
    socket.setBroadcast(true);
    console.log(ansis.green.inverse(`\n Proxy DHCP (Mini-Server) in ascolto su ${address.address}:${address.port} \n`));
  });

  // 3. Il cuore della logica, nel listener 'message'
  socket.on('message', (buffer: Buffer, rinfo: RemoteInfo) => {
    try {
      const packet = Packet.fromBuffer(buffer);
      (packet as any).remote = rinfo;

      const messageType = packet.options[53] || 0;

      // Logica di gestione basata sul tipo di pacchetto
      if (packet.op === 1 && messageType === DhcpMessageType.DHCPDISCOVER) {
        handleDiscover(packet, options);
      } else if (packet.op === 1 && messageType === DhcpMessageType.DHCPREQUEST) {
        handleRequest(packet, options);
      }
    } catch (err) {
      // Ignoriamo errori di parsing
    }
  });

  // 4. Avviamo l'ascolto
  socket.bind(67, '0.0.0.0');

  // --- Funzioni Helper Interne ---

  function handleDiscover(packet: Packet, opts: IDhcpOptions): void {
    console.log(ansis.blue.bold(`\n-> DISCOVER Ricevuto`));
    console.log(ansis.dim(`   └─ Da MAC: ${ansis.white(packet.chaddr)}`));

    if (packet.options[60]?.includes('PXEClient')) {
      console.log(ansis.cyan.bold(`<- Rilevato PXEClient! Preparo un'offerta completa...`));
      
      const offerPacket = new Packet(packet);
      offerPacket.op = 2; // BOOTREPLY
      
      // NOTA: Questa è una logica di assegnazione IP molto basilare.
      // Prende l'IP del server e cambia l'ultimo ottetto.
      // Funziona per un test, ma non è robusta per più client.
      const ipParts = opts.host.split('.');
      ipParts[3] = (parseInt(ipParts[3]) + 10).toString(); // Es. 192.168.1.192 -> 192.168.1.202
      const offeredIp = ipParts.join('.');
      offeredIPs.set(packet.chaddr, offeredIp); // Salviamo l'offerta

      offerPacket.yiaddr = offeredIp; // Assegniamo l'IP
      offerPacket.siaddr = opts.tftpserver; // Next-server IP
      offerPacket.options[53] = DhcpMessageType.DHCPOFFER;
      offerPacket.options[54] = opts.host; // Ci identifichiamo come il server

      const arch = packet.options[93] || packet.options[60];
      if (arch && (String(arch).includes('00007') || String(arch).includes('00009'))) {
        offerPacket.fname = opts.efi64_filename;
      } else if (arch && String(arch).includes('00006')) {
        offerPacket.fname = opts.efi32_filename;
      } else {
        offerPacket.fname = opts.bios_filename;
      }

      console.log(ansis.dim(`   ├─ Offro IP: ${ansis.green(offeredIp)}`));
      console.log(ansis.dim(`   ├─ Next-Server: ${ansis.white(offerPacket.siaddr)}`));
      console.log(ansis.dim(`   └─ Filename: ${ansis.white(offerPacket.fname)}`));

      send(offerPacket, opts.broadcast, 68);
    }
  }

  function handleRequest(packet: Packet, opts: IDhcpOptions): void {
    const offeredIp = offeredIPs.get(packet.chaddr);
    // Rispondiamo solo se il client sta richiedendo l'IP che gli abbiamo offerto
    if (!offeredIp || (packet.options[50] && packet.options[50] !== offeredIp)) {
        return;
    }

    console.log(ansis.yellow.bold(`-> REQUEST per la nostra offerta ricevuto!`));
    console.log(ansis.dim(`   └─ Da MAC: ${ansis.white(packet.chaddr)}`));

    const ackPacket = new Packet(packet);
    ackPacket.op = 2;
    ackPacket.yiaddr = offeredIp;
    ackPacket.siaddr = opts.tftpserver;
    ackPacket.options[53] = DhcpMessageType.DHCPACK;
    ackPacket.options[54] = opts.host;

    // Aggiungiamo di nuovo il filename per sicurezza
    const arch = packet.options[93] || packet.options[60];
    if (arch && (String(arch).includes('00007') || String(arch).includes('00009'))) {
        ackPacket.fname = opts.efi64_filename;
    } else if (arch && String(arch).includes('00006')) {
        ackPacket.fname = opts.efi32_filename;
    } else {
        ackPacket.fname = opts.bios_filename;
    }

    console.log(ansis.cyan.bold(`<- Invio ACK finale...`));
    send(ackPacket, opts.broadcast, 68);
  }

  function send(packet: Packet, ip: string, port: number): void {
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
