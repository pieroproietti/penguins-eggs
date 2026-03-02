/**
 * Type declarations for penguins-eggs-integrations/config-management.
 * Optional external module; stubs for compile-time only.
 */
declare module 'penguins-eggs-integrations/config-management' {
  export class WardrobeBrowse {
    constructor(exec: Function, verbose?: boolean)
    mount(repo: string, mountpoint: string, backend?: string): Promise<void>
  }

  export class WardrobeMerge {
    constructor(exec: Function, verbose?: boolean)
    merge(sources: Array<{ url: string }>, into: string): Promise<void>
  }

  export class WardrobeMount {
    constructor(exec: Function, verbose?: boolean)
    mount(opts: {
      repoUrl: string
      mountpoint: string
      branch?: string
      commitInterval?: number
      pushInterval?: number
    }): Promise<void>
    unmount(mountpoint: string): Promise<void>
    listMounts(): Promise<string[]>
  }
}
