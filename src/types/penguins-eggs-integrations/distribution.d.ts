/**
 * Type declarations for penguins-eggs-integrations/distribution.
 * Optional external module; stubs for compile-time only.
 */
declare module 'penguins-eggs-integrations/distribution' {
  export class LfsTracker {
    constructor(exec: Function, verbose?: boolean)
    track(path: string): Promise<{ committed: boolean; pushed: boolean }>
    listTracked(dir: string): Promise<string[]>
  }

  export function loadLfsConfig(): Record<string, any>
  export function saveLfsConfig(config: Record<string, any>): void
  export function lfsAfterProduce(isoFilename: string, snapshotDir: string, verbose: boolean, exec: Function): Promise<void>

  export class OpengistSharing {
    constructor(exec: Function, config: { serverUrl?: string; token?: string }, verbose?: boolean)
    share(path: string, title?: string): Promise<{ url: string; files: string[] }>
    import(url: string, dest: string): Promise<void>
    list(): Promise<Array<{ title: string; url: string }>>
    search(query: string): Promise<Array<{ title: string; url: string }>>
  }
}
