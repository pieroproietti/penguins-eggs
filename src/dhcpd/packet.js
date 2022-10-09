var utils = require('./utils');
var get_convert = require('./packet/converters');

/**
 * 
 */
class Packet {
  constructor(array) {
    var key;
    for (key in array) {
      if (array.hasOwnProperty(key)) {
        this[key] = array[key];
      }
    }
  }

  /**
   * 
   * @returns 
   */
  getRequestedIPAddress() {
    return this.options[50];
  }

  /**
   * 
   * @param {*} op 
   * @returns 
   */
  op(op) {
    this.op = op;
    return this;
  }

  /**
   * 
   * @param {*} htype 
   * @returns 
   */
  htype(htype) {
    this.htype = htype;
    return this;
  }

  /**
   * 
   * @param {*} hlen 
   * @returns 
   */
  hlen(hlen) {
    this.hlen = hlen;
    return this;
  }
  hops(hops) {
    this.hops = hops;
    return this;
  }

  /**
   * 
   * @param {*} xid 
   * @returns 
   */
  xid(xid) {
    this.xid = xid;
    return this;
  }

  /**
   * 
   * @param {*} secs 
   * @returns 
   */
  secs(secs) {
    this.secs = secs;
    return this;
  }
  flags(flags) {
    this.flags = flags;
    return this;
  }

  /**
   * 
   * @param {*} ciaddr 
   * @returns 
   */
  ciaddr(ciaddr) {
    this.ciaddr = ciaddr !== null ? ciaddr : '0.0.0.0';
    return this;
  }

  /**
   * 
   * @param {*} yiaddr 
   * @returns 
   */
  yiaddr(yiaddr) {
    this.yiaddr = yiaddr !== null ? yiaddr : '0.0.0.0';
    return this;
  }

  /**
   * 
   * @param {*} siaddr 
   * @returns 
   */
  siaddr(siaddr) {
    this.siaddr = siaddr !== null ? siaddr : '0.0.0.0';
    return this;
  }

  /**
   * 
   * @param {*} giaddr 
   * @returns 
   */
  giaddr(giaddr) {
    this.giaddr = giaddr !== null ? giaddr : '0.0.0.0';
    return this;
  }

  /**
   * 
   * @param {*} chaddr 
   * @returns 
   */
  chaddr(chaddr) {
    this.chaddr = chaddr;
    return this;
  }

  /**
   * 
   * @param {*} sname 
   * @returns 
   */
  sname(sname) {
    this.sname = sname;
    return this;
  }

  /**
   * 
   * @param {*} fname 
   * @returns 
   */
  fname(fname) {
    this.fname = fname;
    return this;
  }

  /**
   * 
   * @param {*} options 
   * @returns 
   */
  options(options) {
    this.options = options;
    return this;
  }
}


/**
 * 
 * @param {*} str 
 * @returns 
 */
function stripBinNull(str) {
  var pos;
  pos = str.indexOf('\u0000');
  if (pos === -1) {
    return str;
  } else {
    return str.substr(0, pos);
  }
}

var fromBuffer = function(b) {
  var i, optLen, optNum, optVal, options, ret, _ref;
  ret = {
    op: b[0],
    htype: b[1],
    hlen: b.readUInt8(2),
    hops: b.readUInt8(3),
    xid: b.readUInt32BE(4),
    secs: b.readUInt16BE(8),
    flags: b.readUInt16BE(10),
    ciaddr: utils.readIp(b, 12),
    yiaddr: utils.readIp(b, 16),
    siaddr: utils.readIp(b, 20),
    giaddr: utils.readIp(b, 24),
    chaddr: utils.readMacAddress(b.slice(28, 28 + b.readUInt8(2))),
    sname: stripBinNull(b.toString('ascii', 44, 108)),
    fname: stripBinNull(b.toString('ascii', 108, 236)),
    options: {}
  };
  _ref = [0, b.slice(240)]; i = _ref[0]; options = _ref[1];
  while (i < options.length && options[i] !== 255) {
    optNum = parseInt(options[i++], 10);
    optLen = parseInt(options[i++], 10);
    var converter = get_convert(optNum);
    optVal = converter.decode(options.slice(i, i + optLen), optNum);
    ret.options[optNum] = optVal;
    i += optLen;
  }
  return new Packet(ret);
};

var toBuffer = function() {
  var buffer, hex, i, key, octet, opt, padded, pos, value, _i, _j, _k, _l, _len, _len1, _len2, _len3, _ref, _ref1, _ref2, _ref3;
  buffer = new Buffer.alloc(512, 0x00, 'ascii');
  buffer[0] = this.op;
  buffer[1] = this.htype;
  buffer.writeUInt8(this.hlen, 2);
  buffer.writeUInt8(this.hops, 3);
  buffer.writeUInt32BE(this.xid, 4);
  buffer.writeUInt16BE(this.secs, 8);
  buffer.writeUInt16BE(this.flags, 10);
  pos = 12;
  _ref = ["ciaddr", "yiaddr", "siaddr", "giaddr"];
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    key = _ref[_i];
    _ref1 = (this[key] || "0.0.0.0").split(".");
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      octet = _ref1[_j];
      buffer.writeUInt8(parseInt(octet, 10), pos++);
    }
  }
  _ref2 = this.chaddr.split(':');
  for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
    hex = _ref2[_k];
    buffer[pos++] = parseInt(hex, 16);
  }
  buffer.fill(0, 43, 235);
  buffer.write(this.sname, 43, 64, 'ascii');
  if (typeof this.fname === 'string' || this.fname instanceof String) {
    buffer.write(this.fname, 108, 128, 'ascii');
  }
  pos = 236;
  _ref3 = [99, 130, 83, 99];
  for (_l = 0, _len3 = _ref3.length; _l < _len3; _l++) {
    i = _ref3[_l];
    buffer[pos++] = i;
  }
  pos = 240;
  for (opt in this.options) {
    if(this.options.hasOwnProperty(opt)){
      value = this.options[opt];
      var converter = get_convert(opt);
      pos = converter.encode(buffer, opt, value, pos);
    }
  }
  buffer[pos] = 255;
  padded = new Buffer.alloc(pos, 0x00, 'ascii');
  buffer.copy(padded, 0, 0, pos);
  return padded;
};

Packet.fromBuffer = fromBuffer;

Packet.prototype.toBuffer = toBuffer;

















module.exports = {
  Packet: Packet,
  fromBuffer: fromBuffer,
  toBuffer: toBuffer
};
