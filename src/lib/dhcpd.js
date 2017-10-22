/*
https://www.npmjs.com/package/dhcp

ATTENTION PATCH node_modules/dhcp
file lib/dhcp.js.js
replace: in line 320 and 365
search
file: '',
replace
file: this.config('bootFile'),
*/

"use strict";


let dhcp = require("dhcp");

let dhcpd = function() {};

dhcpd.prototype.start = function(host, netmask, broadcast, range) {
  console.log(`start service dhcp at ${host}`);
  console.log("netmask: " + netmask);
  console.log("broadcast: " + broadcast);
  console.log("range: " + range);

  var s = dhcp.createServer({
    range: range,
    netmask: netmask,
    dns: ["8.8.8.8", "8.8.4.4"],
    server: host,
    bootFile: "pxelinux.0",
    hostname: "littlebird",
    domainName: "lan",
    router: [host]
  });

  s.listen();
};

export default new dhcpd();
