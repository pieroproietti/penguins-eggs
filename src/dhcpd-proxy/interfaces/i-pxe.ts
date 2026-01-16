export interface ITftpOptions {
  denyPUT: boolean;
  host: string;
  port: number;
  root: string;
}

export interface IDhcpOptions {
  bios_filename: string;
  broadcast: string;
  efi32_filename: string;
  efi64_filename: string;
  host: string;
  subnet: string;
  tftpserver: string;
}

export interface IDhcpd {
  discover: (pkt: IPacket) => void;
  inform: (pkt: IPacket) => void;
  // constructor(opts)
  pre_init: (pkt: IPacket) => void;
  proxy_request: (pkt: IPacket) => IPacket;
  request: (pkt: IPacket) => void;
}

export interface IProxy {
  // constructor(type, opts)
  bind: (port: number, addr: string, cb: any) => IPacket;
}

export interface IServer {
  // constructor(type, opts)
  bind: (port: number, addr: string, cb: any) => IPacket;
}

export interface IPacket {
  chaddr: (chaddr: any) => IPacket; // set chaddr
  ciaddr: (ciaddr: string) => IPacket; // set coaddr
  flags: (flags: any) => IPacket; // set flags
  fname: (fname: any) => IPacket; // set fname
  getRequestedIPAddress: () => string; // this.options[50]
  giaddr: (giaddr: string) => IPacket; // set giaddr
  hlen: (hlen: any) => IPacket; // set hlen
  hops: (hops: any) => IPacket; // set hops
  htype: (htype: any) => IPacket; // set htype
  op: (op: any) => IPacket; // set op
  options: (options: any) => IPacket;
  secs: (secs: any) => IPacket; // set secs
  siaddr: (siaddr: string) => IPacket; // set siaddr
  sname: (sname: any) => IPacket; // set snme
  xid: (xid: any) => IPacket; // set xid
}
