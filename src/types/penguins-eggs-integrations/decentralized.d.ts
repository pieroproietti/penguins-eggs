/**
 * Type declarations for penguins-eggs-integrations/decentralized.
 * Optional external module; stubs for compile-time only.
 */
declare module 'penguins-eggs-integrations/decentralized' {
  export class BrigPublisher {
    constructor(exec: Function, verbose?: boolean)
    isInstalled(): Promise<boolean>
    publish(isoPath: string): Promise<{ cid: string; size: number; gatewayUrl?: string }>
    list(): Promise<string[]>
    get(brigPath: string, dest: string): Promise<void>
    startGateway(): Promise<string>
    history(brigPath: string): Promise<string[]>
  }

  export function loadIpfsConfig(): Record<string, any>
  export function saveIpfsConfig(config: Record<string, any>): void
}
