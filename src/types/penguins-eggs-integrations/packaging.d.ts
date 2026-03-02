/**
 * Type declarations for penguins-eggs-integrations/packaging.
 * Optional external module; stubs for compile-time only.
 */
declare module 'penguins-eggs-integrations/packaging' {
  interface DownloadOpts {
    repoUrl: string
    dirPath: string
    branch?: string
    destDir: string
  }

  export class DirDownloader {
    constructor(exec: Function, verbose?: boolean)
    static parseGitHubUrl(url: string): { owner: string; repo: string; branch: string; dirPath: string } | null
    download(opts: DownloadOpts): Promise<string[]>
    downloadSparse(opts: DownloadOpts): Promise<void>
  }
}
