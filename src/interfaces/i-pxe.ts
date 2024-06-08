export interface ITftpOptions {
  host: string;
  port: number;
  root: string;
  denyPUT: boolean;
}

export interface IDhcpOptions {
  subnet: string;
  host: string;
  tftpserver: string;
  bios_filename: string;
  efi32_filename: string;
  efi64_filename: string;
}

export interface IDhcpd {
  constructor(opts: IDhcpOptions): void;
  pre_init: (pkt: IPacket) => void;
  discover: (pkt: IPacket) => void;
  request: (pkt: IPacket) => void;
  inform: (pkt: IPacket) => void;
  proxy_request: (pkt: IPacket) => IPacket;
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
  getRequestedIPAddress: () => string; // this.options[50]
  op: (op: any) => IPacket; // set op
  htype: (htype: any) => IPacket; // set htype
  hlen: (hlen: any) => IPacket; // set hlen
  hops: (hops: any) => IPacket; // set hops
  xid: (xid: any) => IPacket; // set xid
  secs: (secs: any) => IPacket; // set secs
  flags: (flags: any) => IPacket; // set flags
  ciaddr: (ciaddr: string) => IPacket; // set coaddr
  siaddr: (siaddr: string) => IPacket; // set siaddr
  giaddr: (giaddr: string) => IPacket; // set giaddr
  chaddr: (chaddr: any) => IPacket; // set chaddr
  sname: (sname: any) => IPacket; // set snme
  fname: (fname: any) => IPacket; // set fname
  options: (options: any) => IPacket;
}
