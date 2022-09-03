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
