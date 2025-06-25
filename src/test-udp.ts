/**
 * test-udp.ts
 * * Lo script più semplice possibile per verificare se Node.js
 * riceve traffico UDP sulla porta 67.
 */
import { createSocket } from 'dgram';

console.log('--- Avvio Test di Ascolto UDP ---');

const server = createSocket({ type: 'udp4', reuseAddr: true });

server.on('error', (err) => {
  console.error(`ERRORE SOCKET: ${err.stack}`);
  server.close();
});

server.on('message', (msg, rinfo) => {
  // SE VEDI QUESTO MESSAGGIO, ABBIAMO VINTO.
  console.log('***************************************');
  console.log('*** PACCHETTO RICEVUTO! ***');
  console.log('***************************************');
  console.log(`Ricevuto messaggio da ${rinfo.address}:${rinfo.port}`);
  console.log(`Lunghezza: ${msg.length} bytes`);
});

server.on('listening', () => {
  const address = server.address();
  console.log(`Socket in ascolto su ${address.address}:${address.port}`);
  try {
    // Tentiamo di impostare il broadcast, potrebbe fallire ma ci proviamo
    server.setBroadcast(true);
    console.log('Modalità broadcast attivata.');
  } catch (err) {
    console.error('Impossibile attivare il broadcast:', err);
  }
});

// Ci mettiamo in ascolto su tutte le interfacce (0.0.0.0) sulla porta DHCP (67)
server.bind(67, '0.0.0.0');
