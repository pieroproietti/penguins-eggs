/**
 * sprintf.js
 * 
 * used in dhcpd 
 * 
 */

var sprintf;

sprintf = require("./sprintf");

/**
 * 
 * @param {*} _buffer 
 * @param {*} byteArray 
 * @param {*} offset 
 * @returns 
 */
export function writeBytes(_buffer, byteArray, offset) {
    var i, _bytesWritten;
    i = 0;
    while (i < byteArray.length) {
        _buffer[offset++] = byteArray[i];
        i++;
    }
    if (offset > _bytesWritten) {
        _bytesWritten = offset;
    }
    return this;
}

/**
 * 
 * @param {*} _buffer 
 * @param {*} integer 
 * @param {*} offset 
 * @returns 
 */
export function writeInt32(_buffer, integer, offset) {
    _buffer[offset++] = integer >>> 24;
    _buffer[offset++] = integer >>> 16;
    _buffer[offset++] = integer >>> 8;
    _buffer[offset++] = integer;
    return offset;
}

/**
 * 
 * @param {*} _buffer 
 * @param {*} integer 
 * @param {*} offset 
 * @returns 
 */
export function writeInt16(_buffer, integer, offset) {
    _buffer[offset++] = integer >>> 8;
    _buffer[offset++] = integer;
    return offset;
}
export function writeInt8(_buffer, integer, offset) {
    _buffer[offset++] = integer;
    return offset;
}

/**
 * 
 * @param {*} _buffer 
 * @param {*} length 
 * @param {*} copy 
 * @param {*} offset 
 * @returns 
 */
export function readBytes(_buffer, length, copy, offset) {
    var bufCopy;
    if (copy) {
        bufCopy = new Buffer(length);
        _buffer.copy(bufCopy, 0, offset, (offset += length));
        return bufCopy;
    } else {
        return _buffer.slice(offset, (offset += length));
    }
}

/**
 * 
 * @param {*} _buffer 
 * @param {*} offset 
 * @returns 
 */
export function readInt32(_buffer, offset) {
    return (_buffer[offset++] << 24) | (_buffer[offset++] << 16) | (_buffer[offset++] << 8) | _buffer[offset++];
}

/**
 * 
 * @param {*} _buffer 
 * @param {*} offset 
 * @returns 
 */
export function readInt16(_buffer, offset) {
    return (_buffer[offset++] << 8) | _buffer[offset++];
}

/**
 * 
 * @param {*} _buffer 
 * @param {*} offset 
 * @returns 
 */
export function readInt8(_buffer, offset) {
    return _buffer[offset++];
}

/**
 * 
 * @param {*} buf 
 * @returns 
 */
export function readString(buf) {
    var j, s;
    s = "";
    j = 0;
    while (j < buf.length) {
        s += String.fromCharCode(buf[j]);
        j++;
    }
    return s;
}

/**
 * 
 * @param {*} buf 
 * @returns 
 */
export function readHex(buf) {
    var j, s;
    s = "";
    j = 0;
    while (j < buf.length) {
        s += sprintf("%02x", b[j]);
        j++;
    }
    return s;
}

/**
 * 
 * @param {*} buf 
 * @returns 
 */
export function readHexAddress(buf) {
    var j, s;
    s = [];
    j = 0;
    while (j < buf.length) {
        s.push(sprintf("%02d", buf[j]));
        j++;
    }
    return s.join(":");
}

/**
 * 
 * @param {*} buffer 
 * @param {*} offset 
 * @returns 
 */
export function readIp(buffer, offset) {
    var stop;
    if (offset === null) {
        offset = 0;
    }
    if (offset > buffer.length) {
        return undefined;
    }
    if (0 === buffer.readUInt8(offset)) {
        return undefined;
    } else {
        stop = offset + 4;
        return ((function () {
            var _results;
            _results = [];
            while (offset < stop) {
                _results.push(buffer.readUInt8(offset++));
            }
            return _results;
        })()).join('.');
    }
}

/**
 * 
 * @param {*} buffer 
 * @returns 
 */
export function readMacAddress(buffer) {
    var byte;
    return ((function () {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = buffer.length; _i < _len; _i++) {
            byte = buffer[_i];
            _results.push((byte + 0x100).toString(16).substr(-2));
        }
        return _results;
    })()).join(':');
}

/**
 * 
 * @param {*} buf 
 * @param {*} num 
 * @param {*} offsetHours 
 * @param {*} offset 
 * @returns 
 */
export function writeTimeOffset(buf, num, offsetHours, offset) {
    buf[offset++] = 0;
    return offset;
}

/**
 * 
 * @param {*} buf 
 * @param {*} num 
 * @param {*} ip 
 * @param {*} offset 
 * @returns 
 */
export function writeIp(buf, num, ip, offset) {
    buf[offset++] = num;
    buf[offset++] = 4;
    if ((typeof ip !== 'string' && !(ip instanceof String)) || ip.indexOf('.') === -1) {
        ip = "0.0.0.0";
    }
    ip.split(".").forEach(function (item) {
        buf[offset++] = item;
    });
    return offset;
}

/**
 * 
 * @param {*} buf 
 * @param {*} num 
 * @param {*} hostname 
 * @param {*} offset 
 * @returns 
 */
export function writeString(buf, num, hostname, offset) {
    var charArr;
    charArr = hostname.split("");
    buf[offset++] = num;
    buf[offset++] = charArr.length;
    charArr.forEach(function (chr) {
        buf[offset++] = chr.charCodeAt();
    });
    return offset;
}
