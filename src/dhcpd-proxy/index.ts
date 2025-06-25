/**
 * etrick/src/index.ts
 * * Entry point for the 'etrick' library.
 */

// Esportiamo le classi come "export nominativi".
// Questo è un approccio più robusto e meno ambiguo
// rispetto a 'export default' quando si lavora tra diversi moduli.
export { default as DHCPDProxy } from './classes/proxy.js';
export { default as DHCPServer } from './classes/server.js';
export { Packet } from './classes/packet.js';
export { DhcpMessageType } from './lib/packet/message-types.js';
export {
  IDhcpd, 
  IDhcpOptions, 
  IPacket,
  IProxy, 
  IServer, 
  ITftpOptions, 
} from './interfaces/i-pxe.js'
