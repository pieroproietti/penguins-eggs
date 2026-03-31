/**
 * plugins/decentralized/ipgit-remote/ipgit-remote.ts
 * Manages ipgit (meyer1994/ipgit) as a git remote backed by IPFS.
 *
 * ipgit acts as a git remote helper that stores repo data on IPFS.
 * Standard git push/clone/pull work transparently.
 */

import fs from 'node:fs'

type ExecFn = (cmd: string, opts?: { capture?: boolean; echo?: boolean }) => Promise<{ code: number; data: string; error?: string }>

export class IpgitRemote {
  private exec: ExecFn
  private verbose: boolean

  constructor(exec: ExecFn, verbose = false) {
    this.exec = exec
    this.verbose = verbose
  }

  /**
   * Check if ipgit is installed.
   */
  async isInstalled(): Promise<boolean> {
    const result = await this.exec('command -v ipgit', { capture: true })
    if (result.code === 0) return true

    // Also check if installed via pip
    const pipResult = await this.exec('pip show ipgit', { capture: true })
    return pipResult.code === 0
  }

  /**
   * Install ipgit via pip.
   */
  async install(): Promise<void> {
    await this.exec('pip install ipgit', { echo: this.verbose })
  }

  /**
   * Start the ipgit server.
   * ipgit runs a local git HTTP server that stores objects on IPFS.
   */
  async startServer(port = 8787): Promise<string> {
    // ipgit server runs in background
    await this.exec(`ipgit serve --port ${port} &`, { echo: this.verbose })
    return `http://localhost:${port}`
  }

  /**
   * Add an ipgit remote to a repository.
   */
  async addRemote(repoDir: string, remoteName: string, ipgitUrl: string): Promise<void> {
    await this.exec(
      `git -C "${repoDir}" remote add ${remoteName} "${ipgitUrl}"`,
      { echo: this.verbose }
    )
  }

  /**
   * Push a repo to ipgit (stores on IPFS).
   * Returns the IPFS CID of the pushed repo.
   */
  async push(repoDir: string, remoteName = 'ipfs'): Promise<string> {
    const result = await this.exec(
      `git -C "${repoDir}" push ${remoteName} --all 2>&1`,
      { capture: true, echo: this.verbose }
    )

    // Extract CID from ipgit output
    const cidMatch = result.data.match(/Qm[a-zA-Z0-9]{44}|bafy[a-zA-Z0-9]+/)
    return cidMatch?.[0] || ''
  }

  /**
   * Clone a repo from IPFS via ipgit.
   */
  async clone(cid: string, destDir: string, ipgitUrl = 'http://localhost:8787'): Promise<void> {
    await this.exec(
      `git clone "${ipgitUrl}/${cid}" "${destDir}"`,
      { echo: this.verbose }
    )
  }

  /**
   * Push wardrobe configs to IPFS via ipgit.
   * Convenience method for eggs wardrobe repos.
   */
  async pushWardrobe(wardrobeDir: string): Promise<string> {
    // Ensure it's a git repo
    if (!fs.existsSync(`${wardrobeDir}/.git`)) {
      await this.exec(`git -C "${wardrobeDir}" init`, { echo: this.verbose })
      await this.exec(`git -C "${wardrobeDir}" add -A`, { echo: this.verbose })
      await this.exec(`git -C "${wardrobeDir}" commit -m "wardrobe: initial commit"`, { echo: this.verbose })
    }

    // Add ipgit remote if not present
    const remoteResult = await this.exec(
      `git -C "${wardrobeDir}" remote get-url ipfs`,
      { capture: true }
    )
    if (remoteResult.code !== 0) {
      await this.addRemote(wardrobeDir, 'ipfs', 'http://localhost:8787')
    }

    return this.push(wardrobeDir, 'ipfs')
  }
}
