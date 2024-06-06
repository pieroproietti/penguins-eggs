/**
 * ./src/interfaces/i-pxe.ts
 * penguins-eggs v.10.0.0 / ecmascript 2020
 * author: Piero Proietti
 * email: piero.proietti@gmail.com
 * license: MIT
 */

export interface ITftpOptions {
  denyPUT: boolean
  host: string
  port: number
  root: string
}

export interface IDhcpOptions {
  bios_filename: string
  efi32_filename: string
  efi64_filename: string
  host: string
  subnet: string
  tftpserver: string
}
