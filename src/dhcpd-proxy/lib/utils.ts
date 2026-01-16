/**
 * util.ts
 *
 * used in dhcpd
 *
 */

import sprintf from './sprintf.js'

/**
 *
 * @param _buffer
 * @param byteArray
 * @param offset
 * @returns
 */
export const writeBytes = (_buffer: any, byteArray: any, offset: number) => {
  let _bytesWritten = 0
  let i = 0
  while (i < byteArray.length) {
    _buffer[offset++] = byteArray[i]
    i++
  }

  if (offset > _bytesWritten) {
    _bytesWritten = offset
  }

  return this
}

/**
 *
 * @param _buffer
 * @param integer
 * @param offset
 * @returns
 */
export function writeInt32(_buffer: any, integer: number, offset: number) {
  _buffer[offset++] = integer >>> 24
  _buffer[offset++] = integer >>> 16
  _buffer[offset++] = integer >>> 8
  _buffer[offset++] = integer
  return offset
}

/**
 *
 * @param _buffer
 * @param integer
 * @param offset
 * @returns
 */
export function writeInt16(_buffer: any, integer: number, offset: number) {
  _buffer[offset++] = integer >>> 8
  _buffer[offset++] = integer
  return offset
}

/**
 *
 * @param _buffer
 * @param integer
 * @param offset
 * @returns
 */
export function writeInt8(_buffer: any, integer: number, offset: number) {
  _buffer[offset++] = integer
  return offset
}

/**
 *
 * @param _buffer
 * @param length
 * @param copy
 * @param offset
 * @returns
 */
export function readBytes(_buffer: any, length: number, copy: any, offset: number) {
  let bufCopy
  if (copy) {
    bufCopy = new Buffer(length)
    _buffer.copy(bufCopy, 0, offset, (offset += length))
    return bufCopy
  }

  return _buffer.slice(offset, (offset += length))
}

/**
 *
 * @param _buffer
 * @param offset
 * @returns
 */
export function readInt32(_buffer: any, offset: number) {
  return (_buffer[offset++] << 24) | (_buffer[offset++] << 16) | (_buffer[offset++] << 8) | _buffer[offset++]
}

/**
 *
 * @param _buffer
 * @param offset
 * @returns
 */
export function readInt16(_buffer: any, offset: number) {
  return (_buffer[offset++] << 8) | _buffer[offset++]
}

/**
 *
 * @param _buffer
 * @param offset
 * @returns
 */
export function readInt8(_buffer: any, offset: number) {
  return _buffer[offset++]
}

/**
 *
 * @param buf
 * @returns
 */
export function readString(buf: any) {
  let j
  let s
  s = ''
  j = 0
  while (j < buf.length) {
    s += String.fromCharCode(buf[j])
    j++
  }

  return s
}

/**
 *
 * @param buf
 * @returns
 */
export function readHex(buf: any) {
  let j
  let s
  s = ''
  j = 0
  while (j < buf.length) {
    // check was b not buf
    s += sprintf('%02x', buf[j])
    j++
  }

  return s
}

/**
 *
 * @param buf
 * @returns
 */
export function readHexAddress(buf: any) {
  let j
  let s
  s = []
  j = 0
  while (j < buf.length) {
    s.push(sprintf('%02d', buf[j]))
    j++
  }

  return s.join(':')
}

/**
 *
 * @param buffer
 * @param offset
 * @returns
 */
export function readIp(buffer: any, offset: number) {
  let stop
  if (offset === null) {
    offset = 0
  }

  if (offset > buffer.length) {
    return
  }

  if (buffer.readUInt8(offset) === 0) {
    return
  }

  stop = offset + 4
  return (function () {
    const _results = []
    while (offset < stop) {
      _results.push(buffer.readUInt8(offset++))
    }

    return _results
  })().join('.')
}

/**
 *
 * @param buffer
 * @returns
 */
export function readMacAddress(buffer: any) {
  let byte
  return (function () {
    let _i
    let _len
    const _results = []
    for (_i = 0, _len = buffer.length; _i < _len; _i++) {
      byte = buffer[_i]
      _results.push((byte + 0x1_00).toString(16).slice(-2))
    }

    return _results
  })().join(':')
}

/**
 *
 * @param buf
 * @param num
 * @param offsetHours
 * @param offset
 * @returns
 */
export function writeTimeOffset(buf: any, num: any, offsetHours: any, offset: number) {
  buf[offset++] = 0
  return offset
}

/**
 *
 * @param buf
 * @param num
 * @param ip
 * @param offset
 * @returns
 */
export function writeIp(buf: any, num: string, ip: any, offset: number) {
  buf[offset++] = num
  buf[offset++] = 4
  if ((typeof ip !== 'string' && !(ip instanceof String)) || !ip.includes('.')) {
    ip = '0.0.0.0'
  }

  ip.split('.').forEach((item: any) => {
    buf[offset++] = item
  })
  return offset
}

/**
 *
 * @param buf
 * @param num
 * @param hostname
 * @param offset
 * @returns
 */
export function writeString(buf: any, num: string, hostname: string, offset: number) {
  let charArr
  charArr = hostname.split('')
  buf[offset++] = num
  buf[offset++] = charArr.length
  for (const chr of charArr) {
    // charCodeAt(index: number): number
    // buf[offset++] = chr.charCodeAt() original
    buf[offset++] = chr.charCodeAt(0)
  }

  return offset
}
