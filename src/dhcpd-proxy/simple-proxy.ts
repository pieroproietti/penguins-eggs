/**
 * simple-proxy.ts
 * Un proxy DHCP minimale che agisce come un mini-server DHCP completo
 * solo per i client PXE, per aggirare le protezioni di rete.
 */

import ansis from 'ansis'
import { createSocket, RemoteInfo, Socket } from 'dgram'

import type { IDhcpOptions } from '../dhcpd-proxy//interfaces/i-pxe.js'

import { DhcpMessageType } from '../dhcpd-proxy//lib/packet/message-types.js'
import { Packet } from '../dhcpd-proxy/classes/packet.js'

// Un semplice Map in memoria per tracciare gli IP offerti
const offeredIPs = new Map<string, string>()

/**
 * La nostra unica funzione. Prende le opzioni e avvia il proxy.
 * @param options Le opzioni di configurazione PXE
 */
export function startSimpleProxy(options: IDhcpOptions): void {
  const socket = createSocket({ reuseAddr: true, type: 'udp4' })

  socket.on('error', (err) => {
    console.error(ansis.red.bold(`ERRORE SOCKET: ${err.stack}`))
    socket.close()
  })

  socket.on('listening', () => {
    const address = socket.address()
    socket.setBroadcast(true)
    console.log(ansis.green.inverse(`\n Proxy DHCP listening su ${address.address}:${address.port}. CTRL-C to end!\n`))
  })

  socket.on('message', (buffer: Buffer, rinfo: RemoteInfo) => {
    try {
      const packet = Packet.fromBuffer(buffer)
      ;(packet as any).remote = rinfo
      const messageType = packet.options[53] || 0

      if (packet.op === 1 && messageType === DhcpMessageType.DHCPDISCOVER) {
        handleDiscover(packet, options)
      } else if (packet.op === 1 && messageType === DhcpMessageType.DHCPREQUEST) {
        handleRequest(packet, options)
      }
    } catch {
      // Ignoriamo errori di parsing
    }
  })

  socket.bind(67, '0.0.0.0')

  // --- Funzioni Helper Interne ---

  function setBootFilename(packet: Packet, opts: IDhcpOptions): string {
    const isIpxe = packet.options[77] && packet.options[77].toString().includes('iPXE')
    const arch = packet.options[93] || packet.options[60]
    const isUefi64 = arch && (String(arch).includes('00007') || String(arch).includes('00009'))

    // LOGICA DI ASSEGNAZIONE PRECISA
    if (isIpxe && isUefi64) {
      // CASO 1: Il client è iPXE e anche UEFI. Offriamo lo script!
      console.log(ansis.magenta.bold(`<- Rilevato client iPXE su UEFI! Offro script autoexec...`))
      return `http://${opts.host}/autoexec.ipxe`
    }

    if (isUefi64) {
      // CASO 2: Il client è UEFI ma non è ancora iPXE. Offriamo il bootloader iPXE per UEFI.
      return opts.efi64_filename
    }

    // CASO 3: Il client è BIOS. Offriamo il bootloader iPXE per BIOS.
    // (Aggiunta logica per altri tipi di architettura se necessario)
    return opts.bios_filename
  }

  function handleDiscover(packet: Packet, opts: IDhcpOptions): void {
    console.log(ansis.blue.bold(`\n-> DISCOVER Ricevuto`))
    console.log(ansis.dim(`   └─ Da MAC: ${ansis.white(packet.chaddr)}`))

    if (packet.options[60]?.includes('PXEClient')) {
      console.log(ansis.cyan.bold(`<- Rilevato PXEClient! Preparo un'offerta completa...`))

      const offerPacket = new Packet(packet)
      offerPacket.op = 2 // BOOTREPLY

      const ipParts = opts.host.split('.')
      ipParts[3] = (Number.parseInt(ipParts[3]) + 10).toString()
      const offeredIp = ipParts.join('.')
      offeredIPs.set(packet.chaddr, offeredIp)

      offerPacket.yiaddr = offeredIp
      offerPacket.siaddr = opts.tftpserver
      offerPacket.options[53] = DhcpMessageType.DHCPOFFER
      offerPacket.options[54] = opts.host

      // Imposta il filename usando la nuova funzione logica
      offerPacket.fname = setBootFilename(packet, opts)

      console.log(ansis.dim(`   ├─ Offro IP: ${ansis.green(offeredIp)}`))
      console.log(ansis.dim(`   ├─ Next-Server: ${ansis.white(offerPacket.siaddr)}`))
      console.log(ansis.dim(`   └─ Filename: ${ansis.white(offerPacket.fname)}`))

      send(offerPacket, opts.broadcast, 68)
    }
  }

  function handleRequest(packet: Packet, opts: IDhcpOptions): void {
    const offeredIp = offeredIPs.get(packet.chaddr)
    if (!offeredIp || (packet.options[50] && packet.options[50] !== offeredIp)) {
      return
    }

    console.log(ansis.yellow.bold(`-> REQUEST per la nostra offerta ricevuto!`))
    console.log(ansis.dim(`   └─ Da MAC: ${ansis.white(packet.chaddr)}`))

    const ackPacket = new Packet(packet)
    ackPacket.op = 2
    ackPacket.yiaddr = offeredIp
    ackPacket.siaddr = opts.tftpserver
    ackPacket.options[53] = DhcpMessageType.DHCPACK
    ackPacket.options[54] = opts.host

    // Imposta il filename usando la stessa logica
    ackPacket.fname = setBootFilename(packet, opts)

    console.log(ansis.cyan.bold(`<- Invio ACK finale...`))
    send(ackPacket, opts.broadcast, 68)
  }

  function send(packet: Packet, ip: string, port: number): void {
    const buffer = packet.toBuffer()
    const typeName = DhcpMessageType[packet.options[53]] || 'UNKNOWN'
    socket.send(buffer, 0, buffer.length, port, ip, (err, bytes) => {
      if (err) {
        console.error(ansis.red.bold(`[PROXY-ERROR] Errore invio ${typeName}:`), err)
      } else {
        console.log(ansis.green(`   ✔︎ ${typeName} inviata a ${ip}:${port} (${bytes} bytes)`))
      }
    })
  }
}
