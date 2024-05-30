/**
 * penguins-eggs
 * interface: i-pxe.ts
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */
export interface ITftpOptions {
  host : string
  port : number
  root : string
  denyPUT : boolean
}

export interface IDhcpOptions {
  subnet: string
  host: string
  tftpserver: string
  bios_filename: string
  efi32_filename: string
  efi64_filename: string
}

