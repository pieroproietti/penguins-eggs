/**
 * converters.js
 *
 * used by dhcpd-proxy
 */
import {
  writeIp,
  readIp,
  writeInt32,
  readInt32,
  writeString,
  readString,
  writeInt8,
  readInt8,
  writeBytes,
  writeInt16,
  readInt16,
} from "../utils.js";

import sprintf from "../sprintf.js";

interface IStringIndex {
  [key: string]: any;
}

/**
 * converters
 */
const converters: IStringIndex = {
  // option 1: subnet mask
  1: {
    encode: writeIp,
    decode: readIp,
  },

  // option 2: time offset
  2: {
    encode: function encode(buf: any, num: any, value: any, offset: any) {
      buf[offset++] = num;
      buf[offset++] = 4;
      writeInt32(buf, value, offset);
      return offset + 4;
    },
    decode: function decode(buf: any) {
      return readInt32(buf, 0);
    },
  },

  // option 3: routers
  3: {
    decode: function decode(buf: any) {
      let i, numRecords, pos, records;
      numRecords = buf.length / 4;
      pos = 0;
      records = [];
      i = 0;
      while (i < numRecords) {
        records.push(
          sprintf(
            "%d.%d.%d.%d",
            buf[pos++],
            buf[pos++],
            buf[pos++],
            buf[pos++],
          ),
        );
        i++;
      }
      return records;
    },

    encode: function encode(buf: any, num: any, data: any, offset: any) {
      let routers;
      routers = data;
      buf[offset++] = num;
      buf[offset++] = routers.length * 4;
      routers.forEach(function (ip: any) {
        return ip.split(".").forEach(function (item: any) {
          buf[offset++] = item;
        });
      });
      return offset;
    },
  },

  // option 6: dns servers
  6: {
    decode: function (buf: any) {
      let i, numRecords, pos, records;
      numRecords = buf.length / 4;
      pos = 0;
      records = [];
      i = 0;
      while (i < numRecords) {
        records.push(
          sprintf(
            "%d.%d.%d.%d",
            buf[pos++],
            buf[pos++],
            buf[pos++],
            buf[pos++],
          ),
        );
        i++;
      }
      return records;
    },

    encode: function (buf: any, num: any, data: any, offset: any) {
      let routers;
      routers = data.split(",");
      buf[offset++] = num;
      buf[offset++] = routers.length * 4;
      routers.forEach(function (ip: any) {
        return ip.split(".").forEach(function (item: any) {
          buf[offset++] = item;
        });
      });
      return offset;
    },
  },

  /*
    // option 119: dns search list
    119: {
      encode: null,
      decode: null
    },
    */

  // option 12: hostname
  12: {
    encode: writeString,
    decode: readString,
  },

  // option 15: dns domain name
  15: {
    encode: writeString,
    decode: readString,
  },

  // option 28: broadcast address
  28: {
    encode: writeIp,
    decode: readIp,
  },

  // option 31: router discovery
  31: {
    encode: function (buf: any, num: any, value: any, offset: any) {
      buf[offset++] = num;
      buf[offset++] = 1;
      writeInt8(buf, value, offset);
      return offset + 1;
    },

    decode: function (buf: any) {
      return readInt8(buf, 0);
    },
  },

  // option 33: static routes
  33: {
    decode: function decode(buf: any) {
      let i, numRecords, pos, records;
      numRecords = buf.length / 4;
      pos = 0;
      records = [];
      i = 0;
      while (i < numRecords) {
        records.push(
          sprintf(
            "%d.%d.%d.%d",
            buf[pos++],
            buf[pos++],
            buf[pos++],
            buf[pos++],
          ),
        );
        i++;
      }
      return records;
    },

    encode: function encode(buf: any, num: any, data: any, offset: any) {
      let routers;
      routers = data.split(",");
      buf[offset++] = num;
      buf[offset++] = routers.length * 4;
      routers.forEach(function (ip: any) {
        return ip.split(".").forEach(function (item: any) {
          buf[offset++] = item;
        });
      });
      return offset;
    },
  },

  // option 43: vendor specific information
  43: {
    decode: function (buf: any) {
      const records = [];
      let i = 0;
      const len = buf.length;
      while (i < len) {
        records.push(sprintf("%02x", buf[i]));
        i++;
      }
      return records.join(":");
    },
    encode: function (buf: any, num: any, data: any, offset: any) {
      const vendorinfo = data.split(":");
      buf[offset++] = num;
      buf[offset++] = vendorinfo.length;
      vendorinfo.forEach(function (hex: any) {
        buf[offset++] = parseInt(hex, 16);
      });
      return offset;
    },
  },

  // option 44: netbios name servers
  44: {
    decode: function (buf: any) {
      let i, numRecords, pos, records;
      numRecords = buf.length / 4;
      pos = 0;
      records = [];
      i = 0;
      while (i < numRecords) {
        records.push(
          sprintf(
            "%d.%d.%d.%d",
            buf[pos++],
            buf[pos++],
            buf[pos++],
            buf[pos++],
          ),
        );
        i++;
      }
      return records;
    },

    encode: function (buf: any, num: any, data: any, offset: any) {
      let routers;
      routers = data.split(",");
      buf[offset++] = num;
      buf[offset++] = routers.length * 4;
      routers.forEach(function (ip: any) {
        return ip.split(".").forEach(function (item: any) {
          buf[offset++] = item;
        });
      });
      return offset;
    },
  },

  // option 46: netbios node type
  46: {
    decode: function (buf: any) {
      return parseInt(buf[0], 16);
    },
    encode: function (buf: any, num: any, value: any, offset: any) {
      buf[offset++] = num;
      buf[offset++] = 1;
      buf[offset++] = parseInt(buf[0], 10).toString(16);
      return offset;
    },
  },

  // option 47: netbios node type
  47: {
    encode: writeString,
    decode: readString,
  },

  // option 50: requested ip address
  50: {
    encode: writeIp,
    decode: readIp,
  },

  // option 51: lease time
  51: {
    decode: function (buf: any) {
      return readInt32(buf, 0);
    },

    encode: function (buf: any, num: any, value: any, offset: any) {
      buf[offset++] = num;
      buf[offset++] = 4;
      writeInt32(buf, value, offset);
      return offset + 4;
    },
  },

  // option 53: message type
  53: {
    decode: function (buf: any) {
      return parseInt(buf[0], 10);
    },
    encode: function (buf: any, num: any, value: any, offset: any) {
      buf[offset++] = 53;
      buf[offset++] = 1;
      buf[offset++] = value;
      return offset;
    },
  },

  // option 54: server identifier
  54: {
    encode: writeIp,
    decode: function decode(buf: any) {
      return readIp(buf, 0);
    },
  },

  // option 55: parameter request list
  55: {
    decode: function decode(buf: any) {
      const records = [];
      let i = 0;
      const len = buf.length;
      while (i < len) {
        records[i] = buf[i];
        i++;
      }
      return records;
    },

    encode: function encode(buf: any, num: any, data: any, offset: any) {
      buf[offset++] = num;
      buf[offset++] = data.length;
      writeBytes(buf, data, offset);
      //      var i = 0;
      //      while(i < data.length) {
      //        utils.writeBytes(buf, data[i], offset);
      //        i++;
      //        offset++;
      //      }
      return offset;
    },
  },

  // option 57: max message size
  57: {
    encode: function (buf: any, num: any, value: any, offset: any) {
      buf[offset++] = 57;
      buf[offset++] = 2;
      writeInt16(buf, value, offset);
      return offset + 2;
    },

    decode: function (buf: any) {
      return readInt16(buf, 0);
    },
  },

  // option 60: vendor class identifier
  60: {
    encode: writeString,
    decode: readString,
  },

  // option 61: client identifier
  61: {
    encode: function (buf: any, num: any, value: any, offset: any) {
      return offset;
    },

    decode: function (buf: any) {
      let j, s, type;
      s = [];
      type = buf[0];
      j = 1;
      while (j < buf.length) {
        s.push(sprintf("%02x", buf[j]));
        j++;
      }
      return [type, s.join(":")];
    },
  },

  // option 67: bootfile name
  67: {
    encode: writeString,
    decode: readString,
  },

  // option 77: user class information
  77: {
    encode: writeString,
    decode: function (buf: any) {
      const records = [];
      let offset = 0;
      while (buf[offset]) {
        const uc_len = buf[offset];
        const uc_data = buf.slice(offset++, uc_len);
        offset += uc_len;
        records.push(uc_data.toString("ascii"));
      }
      return records.join(":");
    },
  },

  // option 83: client fqdn
  83: {
    encode: function (buf: any, num: any, value: any, offset: any) {
      return offset;
    },

    decode: function (buf: any) {
      let ret;
      ret = "";
      ret += sprintf("%d", buf[0]) + "-";
      ret += sprintf("%d", buf[1]) + "-";
      ret += sprintf("%d", buf[2]) + " ";
      // CHECK
      //ret += utils.toString(buf.slice(3));
      ret += buf.slice(3).toString();
      return ret;
    },
  },

  // option 175: etherboot
  175: {
    encode: function (buf: any, num: any, value: any, offset: any) {
      return offset;
    },

    decode: function (buf: any) {
      let j, s;
      s = [];
      j = 1;
      while (j < buf.length) {
        s.push(sprintf("%02x", buf[j]));
        j++;
      }
      return s.join(":");
    },
  },

  // option 255: end
  255: {
    encode: function (buf: any, num: any, value: any, offset: any) {
      writeInt8(buf, 255, offset);
      return offset + 1;
    },
    decode: function (buf: any) {
      return undefined;
    },
  },
};

const stub = {
  encode: function (buf: any, num: any, value: any, offset: any) {
    //    console.error("[dhcproxy] encoder for option " + num + " not found");
    return offset;
  },
  decode: function (buf: any, num: any) {
    //    console.error("[dhcproxy] decoder for option  " + num + " not found");
    //    console.log("  buffer:", buf);
    return null;
  },
};

export default function (i: any): any {
  if (i == 67 || i == 66) {
    console.log("GET CONVERTER FOR " + i);
  }
  return i in converters ? converters[i] : stub;
}

/**
 * error TS7053: Element implicitly has an 'any' type because expression 
 * of type 'any' can't be used to index type: 
{
  '1': { encode: [Function: writeIp], decode: [Function: readIp] },
  '2': { encode: [Function: encode], decode: [Function: decode] },
  ...
  '255': { encode: [Function: encode], decode: [Function: decode] }
}
*/
