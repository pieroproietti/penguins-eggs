"use strict";

let dhcp = require("dhcp");
let dhcpd = function() {};
dhcpd.prototype.start = function(host, netmask, broadcast, range) {
  console.log("netmask: " + netmask);
  console.log("broadcast: " + broadcast);
  console.log("range: " + range);

  var s = dhcp.createServer({
    range: ["192.168.3.1", "192.168.3.254"],
    forceOptions: ["hostname"],
    randomIP: true,
    static: {
      "11:22:33:44:55:66": "192.168.3.100"
    },
    netmask: "255.255.255.0",
    router: ["192.168.3.1"],
    timeServer: null,
    nameServer: null,
    dns: ["8.8.8.8", "8.8.4.4"],
    hostname: "little-bird",
    domainName: "lan",
    broadcast: "192.168.3.255",
    server: "192.168.3.1", // This is us
    maxMessageSize: 1500,
    leaseTime: 86400,
    renewalTime: 60,
    rebindingTime: 120,
    tftpServer: "192.168.3.1",
    bootFile: "pxelinux.0"
  });


  s.on("message", function(data) {
    console.log("<DATA>\n" + data)
    console.log(data);
    console.log("</DATA>")
  });

  s.on("bound", function(state) {
    console.log("BOUND:");
    console.log(state);
  });

  s.on("error", function(err, data) {
    //console.log("ERR:" + err);
    //console.log(err, data);
  });

  s.on("listening", function(sock) {
    var address = sock.address();
    console.info("Server Listening: " + address.address + ":" + address.port);
  });

  s.on("close", function() {
    console.log("close");
  });

  s.listen();

};

export default new dhcpd();
