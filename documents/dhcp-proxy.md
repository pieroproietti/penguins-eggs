# dhcp-proxy

We only send DHCP option and not main IP address and mask, this is used so we can interoperate with and existing DHCP Server on the network.
* dhcp-range

* dhcp-boot=pxelinux.0

  Set the DHCP Option for the boot filename used as the network bootstrap file
  
* pxe-service=x86PC,’Network Boot’,pxelinux

 Here we set the 2nd DHCP Option we deliver to DHCP clients and specify this is for our bios based systems, x86PC, a boot message and the name of the bootstrap file omitting the .0 from the end of the name.

in options.js

```
 66: {// RFC 2132: PXE option
    name: 'TFTP server name',
    type: 'ASCII',
    // config: 'tftpServer' // e.g. '192.168.0.1'
    config: tftpServer
  },
  67: {// RFC 2132: PXE option
    name: 'Bootfile name',
    type: 'ASCII',
    //config: 'bootFile' // e.g. 'pxelinux.0'
    config: 'pxelinux.0'
  },
  ```

I tried this example:

```
var dhcpd = require('../lib/dhcp.js');

var s = dhcpd.createServer({
  // System settings
  range: [
    "192.168.1.100", "192.168.1.254"
  ],
  forceOptions: ['hostname', 'tftpServer', 'bootFile'], // Options that need to be sent, even if they were not requested
  randomIP: true, // Get random new IP from pool instead of keeping one ip
  static: {
    "11:22:33:44:55:66": "192.168.1.100"
  },

  // Option settings
  netmask: '255.255.255.0',
  router: [
    '192.168.1.1'
  ],
  timeServer: null,
  nameServer: null,
  dns: ["192.168.1.1", "8.8.8.8", "8.8.4.4"],
  hostname: "installing",
  // domainName: "xarg.org",
  // broadcast: '192.168.1.255',
  server: '192.168.1.2', // This is us
  tftpServer: '192.168.1.2', // This is us
  // maxMessageSize: 1500,
  // leaseTime: 86400,
  // renewalTime: 60,
  // rebindingTime: 120,
  bootFile: function(req, res) {

    // res.ip - the actual ip allocated for the client

    if (req.clientId === 'foo bar') {
      return 'x86linux.0';
    } else {
      return 'x64linux.0';
    }
  }
});

s.on('message', function(data) {
  console.log(data);
});

s.on('bound', function(state) {
  console.log("BOUND:");
  console.log(state);
});

s.on("error", function(err, data) {
  console.log(err, data);
});

s.on("listening", function(sock) {
  var address = sock.address();
  console.info('Server Listening: ' + address.address + ':' + address.port);
});

s.on("close", function() {
  console.log('close');
});

s.listen();

process.on('SIGINT', () => {
  s.close();
});
```
