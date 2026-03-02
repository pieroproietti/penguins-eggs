/**
 * Type declarations for penguins-eggs-integrations/build-infra.
 * This is an optional external module; these stubs satisfy the compiler
 * while the actual imports are guarded by try/catch at runtime.
 */
declare module 'penguins-eggs-integrations/build-infra' {
  export function btrfsBeforeProduce(exec: Function, verbose?: boolean): Promise<void>
  export function btrfsAfterProduce(isoFilename: string, isoSize: number, exec: Function, verbose?: boolean): Promise<void>

  export class StOutput {
    constructor(exec: Function, verbose?: boolean)
    createPackage(
      isoPath: string,
      outputDir: string,
      label: string,
      key?: string
    ): Promise<{ bundlePath: string; descriptorPath: string; signaturePath?: string }>
    generateKey(outputDir: string): Promise<{ privateKey: string; publicKey: string }>
    extractFromIso(isoPath: string, outputDir: string): Promise<{ kernel: string; initramfs: string; rootfs: string }>
  }
}
