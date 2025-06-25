/* packet.ts
 *
 * author: Piero Proietti <piero.proietti@gmail.com>
 * refactored for modern TypeScript
 */
import { readIp, readMacAddress } from "../lib/utils.js";
import get_convert from "../lib/packet/converters.js";
import { Buffer } from 'buffer'; // Import Buffer type

// Definiamo un'interfaccia per le opzioni, così il codice è più pulito
interface DhcpOptions {
    [key: number]: any;
}

// Mettiamo 'export' direttamente davanti alla classe
export class Packet {
    // Aggiunto '!' per il "Definite Assignment Assertion"
    op!: number;
    htype!: number;
    hlen!: number;
    hops!: number;
    xid!: number;
    secs!: number;
    flags!: number;
    ciaddr!: string;
    yiaddr!: string;
    siaddr!: string;
    giaddr!: string;
    chaddr!: string;
    sname!: string;
    fname!: string;
    options!: DhcpOptions;

    constructor(init: Partial<Packet>) { // Usiamo Partial<Packet> per l'inizializzazione
        Object.assign(this, init);
    }

    // --- METODI STATICI (prima erano funzioni esterne) ---

    /**
     * Crea un oggetto Packet da un Buffer
     * @param b Il Buffer da cui leggere
     * @returns Un'istanza di Packet
     */
    public static fromBuffer(b: Buffer): Packet {
        const ret: any = {
            op: b[0],
            htype: b[1],
            hlen: b.readUInt8(2),
            hops: b.readUInt8(3),
            xid: b.readUInt32BE(4),
            secs: b.readUInt16BE(8),
            flags: b.readUInt16BE(10),
            ciaddr: readIp(b, 12),
            yiaddr: readIp(b, 16),
            siaddr: readIp(b, 20),
            giaddr: readIp(b, 24),
            chaddr: readMacAddress(b.slice(28, 28 + b.readUInt8(2))),
            sname: stripBinNull(b.toString("ascii", 44, 108)),
            fname: stripBinNull(b.toString("ascii", 108, 236)),
            options: {},
        };

        let i = 240;
        while (i < b.length && b[i] !== 255) {
            const optNum = b[i++];
            const optLen = b[i++];
            if (i + optLen > b.length) break; // Evita errori di out-of-bounds
            
            const converter = get_convert(optNum);
            const optVal = converter.decode(b.slice(i, i + optLen), optNum);
            ret.options[optNum] = optVal;
            i += optLen;
        }
        return new Packet(ret);
    }


    // --- METODI DI ISTANZA (quelli che restituiscono 'this' e toBuffer) ---

    public getRequestedIPAddress(): string {
        return this.options[50];
    }
    
    // ... tutti i tuoi metodi "builder" che restituiscono 'this' vanno qui
    // Esempio:
    public op_set(op: number): this {
        this.op = op;
        return this;
    }
    // ...e così via per htype, hlen, xid, etc.

    /**
     * Converte l'oggetto Packet in un Buffer
     * @returns Il Buffer DHCP
     */
    public toBuffer(): Buffer {
        const buffer = Buffer.alloc(512); // Usare Buffer.alloc è più sicuro
        buffer.fill(0);

        buffer[0] = this.op;
        buffer[1] = this.htype;
        buffer.writeUInt8(this.hlen, 2);
        buffer.writeUInt8(this.hops, 3);
        buffer.writeUInt32BE(this.xid, 4);
        buffer.writeUInt16BE(this.secs, 8);
        buffer.writeUInt16BE(this.flags, 10);

        let pos = 12;
        [this.ciaddr, this.yiaddr, this.siaddr, this.giaddr].forEach(addr => {
            (addr || "0.0.0.0").split(".").forEach(octet => {
                buffer.writeUInt8(parseInt(octet, 10), pos++);
            });
        });
        
        this.chaddr.split(":").forEach(hex => {
            buffer[pos++] = parseInt(hex, 16);
        });

        buffer.fill(0, pos, 236); // Pulisce il resto dell'header
        buffer.write(this.sname || '', 44, 64, "ascii");
        buffer.write(this.fname || '', 108, 128, "ascii");

        pos = 236;
        [99, 130, 83, 99].forEach(magicCookieByte => {
            buffer[pos++] = magicCookieByte;
        });

        pos = 240;
        for (const opt in this.options) {
            if (this.options.hasOwnProperty(opt)) {
                const value = this.options[opt];
                const converter = get_convert(parseInt(opt));
                pos = converter.encode(buffer, parseInt(opt), value, pos);
            }
        }
        buffer[pos++] = 255; // End Option

        return buffer.slice(0, pos);
    }
}

// Funzione helper, può rimanere qui o essere spostata in un file di utility
function stripBinNull(str: string): string {
    const pos = str.indexOf("\u0000");
    return pos === -1 ? str : str.substr(0, pos);
}
