var util = require('util');
var dhcp = require('./index');
var Socket = require('dgram').Socket;

/**
 * 
 */
class DHCPProxy {
  constructor(type, opts) {
    var _this = this;
    DHCPProxy.super_.apply(this, [type]);
    _this.broadcast = opts.broadcast;
    this.on('error', function (err) {
      console.dir(err);
    });
    this.on('message', function (buffer, remote) {
      var event_name, packet, type;
      packet = dhcp.Packet.fromBuffer(buffer);
      if (packet.op === 1) {
        type = {
          id: packet.options[53] || 0,
          name: dhcp.MessageTypes[packet.options[53] || 0]
        };
        util.log(("Proxy: Got " + type.name + " from") + (" " + remote.address + ":" + remote.port + " (" + packet.chaddr + ") ") + (" with packet length of " + buffer.length + " bytes"));
        event_name = type.name.replace('DHCP', '').toLowerCase();
        packet.remote = remote;
        return _this._emitPacket(event_name, packet);
      } else {
        return console.log("  Unsupported message format");
      }
    });
    return _this;
  }

  /**
   * 
   * @param {*} port 
   * @param {*} addr 
   * @param {*} cb 
   * @returns 
   */
  bind(port, addr, cb) {
    var self = this;
    var res;
    res = DHCPProxy.super_.prototype.bind.call(this, port, addr, function () {
      this.setBroadcast(true);
      if (cb instanceof Function)
        cb();
    });
    return res;
  }

  /**
   * 
   * @param {*} event_name 
   * @param {*} ip 
   * @param {*} packet 
   * @returns 
   */
  _send(event_name, ip, packet) {
    var buffer, _this = this;
    buffer = packet.toBuffer();
    util.log(("Proxy: Sending " + dhcp.MessageTypes[packet.options[53]]) + (" to " + ip + ":" + packet.remote.port + " (" + packet.chaddr + ")") + (" with packet length of " + buffer.length + " bytes"));
    this.emit(event_name, packet);
    return this.send(buffer, 0, buffer.length, packet.remote.port, ip, function (err, bytes) {
      if (err) {
        return _this.emit("" + event_name + "Error", err, packet);
      } else {
        return _this.emit("" + event_name + "Sent", bytes, packet);
      }
    });
  }

  /**
   * 
   * @param {*} message_type 
   * @param {*} packet 
   * @returns 
   */
  _emitPacket(message_type, packet) {
    return this.emit(message_type, packet, packet.options[50] || null);
  }

  /**
   * 
   * @param {*} packet 
   * @param {*} params 
   */
  discover(packet, params) {
    console.log('Proxy: Got DHCP DISCOVER');
  }

  /**
   * 
   * @param {*} packet 
   * @param {*} params 
   * @returns 
   */
  offer(packet, params) {
    if (params) {
      packet.yiaddr = params.yiaddr;
      packet.siaddr = params.siaddr;
      packet.options = params.options;
    }
    packet.op = packet.options[53] = 2;
    return this._send('offer', this.broadcast, packet);
  }

  /**
   * 
   * @param {*} packet 
   * @param {*} params 
   * @returns 
   */
  ack(packet, params) {
    if (params) {
      packet.yiaddr = params.yiaddr;
      packet.siaddr = params.siaddr;
      packet.options = params.options;
    }
    packet.op = 2;
    packet.options[53] = 5;
    //  return this._send('ack', this.broadcast, packet);
    return this._send('ack', packet.ciaddr, packet);
  }

  /**
   * 
   * @param {*} packet 
   * @param {*} params 
   * @returns 
   */
  nak(packet, params) {
    packet.op = 2;
    packet.options[53] = 6;
    return this._send('nak', packet.ciaddr, packet);
  }

  /**
   * 
   * @param {*} packet 
   * @param {*} params 
   * @returns 
   */
  inform(packet, params) {
    if (params) {
      packet.yiaddr = params.yiaddr;
      packet.siaddr = params.siaddr;
      packet.options = params.options;
    }
    packet.op = 2;
    packet.options[53] = 5;
    return this._send('inform', packet.ciaddr, packet);
  }
}
util.inherits(DHCPProxy, Socket);

DHCPProxy.Packet = dhcp.Packet;
module.exports = DHCPProxy;

