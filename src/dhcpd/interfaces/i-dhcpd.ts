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
  pre_init: (pkt: any) => void
	discover: (pkt: any) => void
  request: (pkt: any) => void
  inform: (pkt: any) => void
  proxy_request: (pkt: any) => any
}

export interface IProxy {
  // constructor(type, opts) 
  bind: (port: any, addr: any, cb: any) => any 
}

export interface IServer {
  // constructor(type, opts) 
  bind: (port: any, addr: any, cb: any) => any 
}

export interface IPacket {
  getRequestedIPAddress: () => string // this.options[50]
  op: (op: any) => any // set op
  htype: (htype: any) => any // set htype
  hlen: (hlen: any) => any // set hlen
  hops: (hops: any) => any // set hops
  xid: (xid: any) => any // set xid
  secs: (secs: any) => any // set secs
  flags:(flags: any) => any // set flags
  ciaddr: (ciaddr: string) => any // set coaddr
  siaddr: (siaddr: string) => any // set siaddr
  giaddr:(giaddr: string) => any // set giaddr
  chaddr:(chaddr: any)  => any  // set chaddr
  sname:(sname: any) => any // set snme
  fname: (fname: any) => any // set fname
  options:(options: any) => any
}