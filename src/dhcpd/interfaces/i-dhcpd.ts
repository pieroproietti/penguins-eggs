/*
  penguins-eggs: Eggs.js
  author: Piero Proietti
  mail: piero.proietti@gmail.com

  interface per classe dhcpd

  https://blog.logrocket.com/when-how-use-interfaces-classes-typescript/
  
  We can only contain declarations of variables and
  methods in the body of the interface. 
*/

export interface IDhcpd {
	// constructor(opts) 
  pre_init: (pkt: IPacket) => void
	discover: (pkt: IPacket) => void
  request: (pkt: IPacket) => void
  inform: (pkt: IPacket) => void
  proxy_request: (pkt: IPacket) =>  IPacket
}

export interface IProxy {
  // constructor(type, opts) 
  bind: (port: any, addr: any, cb: any) =>  IPacket
}

export interface IServer {
  // constructor(type, opts) 
  bind: (port: any, addr: any, cb: any) => IPacket
}

export interface IPacket {
  getRequestedIPAddress: () => string // this.options[50]
  op: (op: any) => IPacket // set op
  htype: (htype: any) => IPacket // set htype
  hlen: (hlen: any) => IPacket // set hlen
  hops: (hops: any) => IPacket // set hops
  xid: (xid: any) => IPacket // set xid
  secs: (secs: any) => IPacket // set secs
  flags:(flags: any) => IPacket // set flags
  ciaddr: (ciaddr: string) => IPacket // set coaddr
  siaddr: (siaddr: string) => IPacket // set siaddr
  giaddr:(giaddr: string) => IPacket // set giaddr
  chaddr:(chaddr: any)  => IPacket  // set chaddr
  sname:(sname: any) => IPacket // set snme
  fname: (fname: any) => IPacket // set fname
  options:(options: any) => IPacket
}